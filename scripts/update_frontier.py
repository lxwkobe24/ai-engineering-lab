#!/usr/bin/env python3
"""Update the AI Frontier snapshot with public, attributable source records.

Usage: python scripts/update_frontier.py
Uses only Python stdlib. Designed for scheduled GitHub Actions as well as local runs.
If all sources fail, this script exits nonzero and does not overwrite an older good snapshot.
"""
from __future__ import annotations

import datetime as dt
import concurrent.futures
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "frontier-feed.json"
AGENT = "AI-Engineering-Lab/1.1 (+public-read-only-content)"
TIMEOUT = 14
NOW = dt.datetime.now(dt.timezone.utc)
SOURCES = ("news", "models", "papers", "opensource")


def localize_items(items, old_items):
    """Translate public feed text only; cache by exact original text, retain links."""
    cached = {}
    for entry in old_items:
        for field in ("title", "desc"):
            if entry.get(field) and entry.get(field + "Zh"):
                cached[entry[field]] = entry[field + "Zh"]

    def translate(text):
        if not text or re.search(r"[\u4e00-\u9fff]", text):
            return text
        if text in cached:
            return cached[text]
        # Public Google Translate web endpoint: best effort, no credentials.
        url = "https://translate.googleapis.com/translate_a/single?" + urllib.parse.urlencode({
            "client": "gtx", "sl": "auto", "tl": "zh-CN", "dt": "t", "q": text})
        for attempt in range(2):
            try:
                data = fetch_json(url)
                translated = "".join(part[0] for part in data[0] if part and part[0]).strip()
                if translated and re.search(r"[\u4e00-\u9fff]", translated):
                    return translated
            except (ValueError, TypeError, IndexError, KeyError, OSError):
                pass
            if attempt == 0:
                time.sleep(1)
        return None

    texts = set()
    for entry in items:
        if entry["type"] not in ("models", "opensource"):
            texts.add(entry["title"])
        texts.add(entry["desc"])
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        translations = dict(zip(texts, executor.map(translate, texts)))
    for entry in items:
        kind = entry["type"]
        entry["titleZh"] = (
            "新模型：" + entry["title"] if kind == "models" else
            "版本发布：" + entry["title"] if kind == "opensource" else
            translations.get(entry["title"]) or "")
        entry["descZh"] = translations.get(entry["desc"]) or ""
        entry["translationStatus"] = "ready" if entry["titleZh"] and entry["descZh"] else "pending"
    ready = sum(entry["translationStatus"] == "ready" for entry in items)
    print(f"Chinese localization: {ready}/{len(items)} entries ready")
    return {"language": "zh-CN", "status": "complete" if ready == len(items) else "partial",
            "ready": ready, "pending": len(items) - ready,
            "notice": "新闻和论文为机器翻译；模型名称、项目名称与版本号保留原名。以原始来源为准。"}


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        return json.load(response)


def query(params):
    return urllib.parse.urlencode(params, safe=",><")


def make_item(kind, source, identifier, title, date, link, summary="", metric=""):
    if not identifier or not title or not date or not link:
        return None
    try:
        stamp = date if isinstance(date, (int, float)) else dt.datetime.fromisoformat(str(date).replace("Z", "+00:00")).timestamp() * 1000
        if stamp <= 0:
            return None
        # Avoid feeds accidentally presenting entries with impossible future dates.
        if stamp > (NOW.timestamp() + 24*3600) * 1000:
            return None
    except (ValueError, TypeError, OverflowError):
        return None
    if not link.startswith("https://"):
        return None
    return {"id": str(identifier)[:180], "type": kind, "source": source,
            "title": str(title)[:240], "desc": str(summary)[:320],
            "date": round(stamp), "url": link, "metric": str(metric)[:80]}


def collect_hn():
    seen = {}
    since = int(time.time()) - 21 * 86400
    for word in ("LLM", "AI agent", "OpenAI", "DeepSeek"):
        url = "https://hn.algolia.com/api/v1/search_by_date?" + query({
            "query": word, "tags": "story", "numericFilters": f"created_at_i>{since}", "hitsPerPage": 18})
        try:
            response = fetch_json(url)
            for h in response.get("hits", []):
                oid = h.get("objectID")
                if not oid:
                    continue
                raw_url = h.get("url") or f"https://news.ycombinator.com/item?id={oid}"
                info = make_item("news", "Hacker News", f"hn-{oid}", h.get("title"),
                    (h.get("created_at_i") or 0) * 1000,
                    raw_url,
                    f"技术社区讨论 · {int(h.get('points') or 0)} 赞同 · {int(h.get('num_comments') or 0)} 条评论。", "")
                if info:
                    seen[info["id"]] = info
        except Exception as exc:
            print(f"HN keyword {word}: {exc}", file=sys.stderr)
    if not seen:
        raise RuntimeError("All Hacker News searches failed or returned no entries")
    return list(seen.values())


def collect_models():
    result = {}
    for author in ("Qwen", "deepseek-ai", "zai-org", "meta-llama", "google"):
        url = "https://huggingface.co/api/models?" + query({"author": author, "sort": "createdAt", "direction": "-1", "limit": 10})
        try:
            for m in fetch_json(url):
                mid = m.get("id") or m.get("modelId")
                if not mid:
                    continue
                info = make_item("models", "Hugging Face", f"hf-{mid}", mid,
                    m.get("createdAt") or m.get("lastModified"),
                    f"https://huggingface.co/{urllib.parse.quote(mid, safe='/')}",
                    "模型仓库创建记录 · 发布日期不等于模型正式发布日期，请以 Model Card 为准。", "")
                if info:
                    result[info["id"]] = info
        except Exception as exc:
            print(f"HF models author {author}: {exc}", file=sys.stderr)
    if not result:
        raise RuntimeError("All model queries failed or returned no entries")
    return list(result.values())


def collect_papers():
    url = "https://huggingface.co/api/daily_papers?limit=45&sort=publishedAt"
    data = fetch_json(url)
    if not isinstance(data, list):
        raise ValueError("Unrecognized Daily Papers shape")
    result = []
    for p in data:
        paper = p.get("paper") or {}
        pid = paper.get("id") or p.get("id")
        if not pid:
            continue
        info = make_item("papers", "HF Daily Papers", f"paper-{pid}",
            paper.get("title") or p.get("title"),
            p.get("publishedAt") or paper.get("submittedOnDailyAt") or paper.get("publishedAt"),
            f"https://huggingface.co/papers/{urllib.parse.quote(str(pid), safe='')}",
            paper.get("summary") or p.get("summary") or "每日论文推荐，点击查看原文及引用。")
        if info:
            result.append(info)
    if not result:
        raise RuntimeError("Daily Papers returned no usable entries")
    return result


def collect_releases():
    result = []
    for repo in ("vllm-project/vllm", "sgl-project/sglang", "huggingface/transformers",
                 "langchain-ai/langgraph", "microsoft/autogen"):
        url = f"https://api.github.com/repos/{repo}/releases?per_page=3"
        try:
            for release in fetch_json(url):
                if release.get("draft"):
                    continue
                info = make_item("opensource", "GitHub Releases", f"gh-{repo}-{release.get('id')}",
                    f"{repo.split('/')[-1]} · {release.get('name') or release.get('tag_name')}",
                    release.get("published_at") or release.get("created_at"),
                    release.get("html_url"),
                    f"{repo} · {'预发布版本' if release.get('prerelease') else '正式 Release'}，点击查看版本说明。",
                    release.get("tag_name") or "")
                if info:
                    result.append(info)
        except Exception as exc:
            print(f"GitHub releases repo {repo}: {exc}", file=sys.stderr)
    if not result:
        raise RuntimeError("All GitHub releases failed or returned no entries")
    return result


def main():
    jobs = {"news": collect_hn, "models": collect_models,
            "papers": collect_papers, "opensource": collect_releases}
    all_items, statuses = [], {}
    for source, collector in jobs.items():
        try:
            items = collector()
            statuses[source] = {"status": "snapshot", "count": len(items)}
            all_items.extend(items)
            print(f"{source}: {len(items)} entries")
        except Exception as exc:
            statuses[source] = {"status": "error", "count": 0}
            print(f"{source}: FAILED ({exc})", file=sys.stderr)
    if not all_items:
        print("All sources failed; keeping old snapshot unchanged.", file=sys.stderr)
        return 1

    # If only one source has failed, keep valid older records of that source as stale snapshot data.
    if OUT.exists():
        try:
            old = json.loads(OUT.read_text(encoding="utf-8"))
            for src in SOURCES:
                if statuses[src]["status"] == "error":
                    stale = [i for i in old.get("items", []) if i.get("type") == src]
                    if stale:
                        all_items.extend(stale)
                        statuses[src] = {"status": "stale", "count": len(stale)}
        except Exception:
            pass
    deduped = {item["id"]: item for item in all_items}
    items = sorted(deduped.values(), key=lambda i: i["date"], reverse=True)[:260]
    old_items = []
    if OUT.exists():
        try:
            old_items = json.loads(OUT.read_text(encoding="utf-8")).get("items", [])
        except (ValueError, OSError):
            pass
    localization = localize_items(items, old_items)
    payload = {"schemaVersion": 1, "generatedAt": NOW.isoformat(timespec="seconds"),
               "sources": statuses, "localization": localization, "items": items}
    temp = OUT.with_suffix(".tmp")
    temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(OUT)
    print(f"Snapshot saved: {OUT}, {len(items)} entries")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
