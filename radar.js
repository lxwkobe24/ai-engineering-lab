/* AI Engineering Lab — AI Frontier Radar
 * Public APIs only. Freshness is explicit; failed requests are never represented as live.
 * Sources: Hacker News Algolia, Hugging Face Hub, GitHub Releases.
 */
(() => {
  'use strict';
  const root = document.getElementById('radar');
  if (!root) return;
  const $ = (sel) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const str = (s, max=260) => String(s ?? '').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().slice(0,max);
  const validLink = (url) => {try {const x = new URL(String(url)); return ['https:', 'http:'].includes(x.protocol) ? x.href : '#';} catch {return '#';}};
  const safeDate = (input) => {const ms=typeof input==='number' ? input : /^\d{13}$/.test(String(input)) ? Number(input) : Date.parse(input||'');return Number.isFinite(ms)&&ms>0?ms:0;};
  const fromNow = (ms) => {const days = Math.floor((Date.now()-ms)/86400000); if (!ms) return '日期未知'; if (days < 0) return new Date(ms).toLocaleDateString('zh-CN'); if(days === 0){const hrs = Math.floor((Date.now()-ms)/3600000);return hrs <= 0 ? '刚刚' : `${hrs} 小时前`;} return days === 1 ? '昨天' : days < 30 ? `${days} 天前` : new Date(ms).toLocaleDateString('zh-CN',{month:'short',day:'numeric'});};
  const dateText = (ms) => ms ? new Date(ms).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '日期未提供';
  const CATEGORIES = [ ['all','全部动态'],['news','AI 新闻'],['models','模型上新'],['papers','算法论文'],['opensource','开源更新'],['watching','我的关注'],['saved','我的收藏'] ];
  const TOPICS = ['全部方向','Agent / Harness','LLM / 训练','推理部署','RAG / 检索','多模态'];
  const SOURCES = [
    {id:'news',name:'Hacker News',desc:'社区 AI 技术讨论',url:'https://news.ycombinator.com/'},
    {id:'models',name:'Hugging Face Models',desc:'模型仓库新建记录',url:'https://huggingface.co/models'},
    {id:'papers',name:'Hugging Face Papers',desc:'Daily Papers 论文推荐',url:'https://huggingface.co/papers'},
    {id:'opensource',name:'GitHub Releases',desc:'技术项目正式发布',url:'https://github.com/'}
  ];
  const storage = (action,key,val) => {try {if(action==='get') return JSON.parse(localStorage.getItem(key) || 'null');localStorage.setItem(key,JSON.stringify(val));return true;}catch{return action==='get' ? null : false;}};
  const CACHE_KEY='ai-lab-frontier-v4', SAVE_KEY='ai-lab-frontier-saved-v1', WATCH_KEY='ai-lab-frontier-watch-v1';
  const DEFAULT_WATCH=['Qwen','DeepSeek','Agent','Harness','vLLM','SGLang','RAG','KV Cache','GRPO'];
  const cleanWatch=(val)=>Array.isArray(val)?[...new Set(val.map(x=>str(x,32)).filter(Boolean))].slice(0,16):DEFAULT_WATCH;
  const previous=storage('get',CACHE_KEY);
  const state={items:[],category:'all',topic:'全部方向',period:30,query:'',limit:7,saved:new Set(storage('get',SAVE_KEY)||[]),watch:cleanWatch(storage('get',WATCH_KEY)),statuses:{},lastUpdate:0,loading:false,language:storage('get','ai-lab-frontier-language')==='original'?'original':'zh'};
  let lastRequested=0;

  const tagsFor = (text) => {
    const t=String(text).toLowerCase(),tags=[];
    if(/agent|harness|mcp\b|tool.?use|function.?call|langgraph|autonomous|coding assistant/.test(t)) tags.push('Agent / Harness');
    if(/llm|language model|transformer|pretrain|training|fine.?tun|reinforcement|reasoning|alignment|qwen|deepseek|gemma|llama|gpt|grpo|dpo/.test(t)) tags.push('LLM / 训练');
    if(/inference|vllm|sglang|serving|quantiz|kv.cache|flash.?attention|gpu|cuda|tensorrt|throughput|latency/.test(t)) tags.push('推理部署');
    if(/retriev|rag\b|embedding|rerank|vector.search|vector.database|bm25/.test(t)) tags.push('RAG / 检索');
    if(/vision|multimodal|audio|video|speech|image|omni|diffusion|ocr|asr/.test(t)) tags.push('多模态');
    return tags.length ? tags : ['LLM / 训练'];
  };
  const item = (d) => {
    const title=str(d.title,240),desc=str(d.desc,260),date=safeDate(d.date);
    if(!title || !date || date>Date.now()+86400000 || validLink(d.url)==='#') return null;
    return {id: String(d.id),type:d.type,source:d.source,title,desc,titleZh:str(d.titleZh,320),descZh:str(d.descZh,420),date,url:validLink(d.url),metric:d.metric||'',tags:tagsFor(`${title} ${desc}`),group:d.group||d.type};
  };
  const displayTitle = x => state.language==='original' ? x.title : x.titleZh || (x.type==='models'?`新模型：${x.title}`:x.type==='opensource'?`版本发布：${x.title}`:x.title);
  const displayDesc = x => state.language==='original' ? x.desc : x.descZh || x.desc;
  const translationLabel = x => state.language==='original' ? '' : x.titleZh && x.descZh ? `<span class="radar-translation-label">${['models','opensource'].includes(x.type)?'中文说明 · 名称保留':'机器翻译 · 以原文为准'}</span>` : '<span class="radar-translation-label">中文翻译待更新 · 暂示原文</span>';
  const searchText = x => `${x.title} ${x.desc} ${x.titleZh||''} ${x.descZh||''} ${x.source} ${x.tags.join(' ')}`;
  const fetchJSON = async(url) => {
    const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),9500);
    try{const r=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/json'},cache:'no-store'});if(!r.ok)throw Error(`HTTP ${r.status}`);return await r.json();}
    finally{clearTimeout(timer);}
  };
  const settled = async (jobs) => {
    const results=await Promise.allSettled(jobs);return {success:results.filter(r=>r.status==='fulfilled').length,values:results.filter(r=>r.status==='fulfilled').map(r=>r.value)};
  };
  async function loadNews(){
    const keywords=['LLM','AI agent','OpenAI','DeepSeek'];
    const since=Math.floor(Date.now()/1000)-21*86400;
    const calls=keywords.map(q=>fetchJSON(`https://hn.algolia.com/api/v1/search_by_date?${new URLSearchParams({query:q,tags:'story',numericFilters:`created_at_i>${since}`,hitsPerPage:'18'})}`));
    const res=await settled(calls);if(!res.success)throw Error('Hacker News 数据请求失败');
    const list=res.values.flatMap(v=>Array.isArray(v.hits)?v.hits:[]);
    return list.filter(h=>h.title&&h.created_at_i).map(h=>item({id:`hn-${h.objectID}`,type:'news',source:'Hacker News',title:h.title,desc:`技术社区收录 · ${Number(h.points||0)} 赞同 · ${Number(h.num_comments||0)} 条讨论。点击查看原文与社区观点。`,date:new Date(h.created_at_i*1000).toISOString(),url:h.url||`https://news.ycombinator.com/item?id=${encodeURIComponent(h.objectID)}`,metric:`${Number(h.points||0)} points`,group:'news'})).filter(Boolean);
  }
  async function loadModels(){
    const authors=['Qwen','deepseek-ai','zai-org','meta-llama','google'];
    const calls=authors.map(author=>fetchJSON(`https://huggingface.co/api/models?${new URLSearchParams({author,sort:'createdAt',direction:'-1',limit:'10'})}`));
    const res=await settled(calls);if(!res.success)throw Error('Hugging Face Models 数据请求失败');
    return res.values.flatMap(v=>Array.isArray(v)?v:[]).map(m=>item({id:`hf-${m.id||m.modelId}`,type:'models',source:'Hugging Face',title:m.id||m.modelId,desc:`模型仓库新建记录${m.pipeline_tag?` · ${m.pipeline_tag}`:''}${m.library_name?` · ${m.library_name}`:''}。请查看 Model Card，确认能力、许可证与参数规格。`,date:m.createdAt||m.lastModified,url:`https://huggingface.co/${m.id||m.modelId}`,metric:typeof m.downloads==='number'?`${Intl.NumberFormat('en',{notation:'compact'}).format(m.downloads)} downloads`:''})).filter(Boolean);
  }
  async function loadPapers(){
    const data=await fetchJSON('https://huggingface.co/api/daily_papers?limit=45&sort=publishedAt');
    if(!Array.isArray(data))throw Error('论文数据格式变化');
    return data.map(p=>{const r=p.paper||{},id=r.id||p.id;
      return item({id:`paper-${id}`,type:'papers',source:'HF Daily Papers',title:r.title||p.title,desc:r.summary||p.summary||'来自 Hugging Face Daily Papers，点击阅读论文摘要与相关代码。',date:p.publishedAt||r.submittedOnDailyAt||r.publishedAt,url:`https://huggingface.co/papers/${encodeURIComponent(id||'')}`,metric:typeof r.upvotes==='number'?`${r.upvotes} upvotes`:''});
    }).filter(Boolean);
  }
  async function loadOpenSource(){
    const repos=['vllm-project/vllm','sgl-project/sglang','huggingface/transformers','langchain-ai/langgraph','microsoft/autogen'];
    const calls=repos.map(repo=>fetchJSON(`https://api.github.com/repos/${repo}/releases?per_page=3`).then(releases=>({repo,releases})));
    const res=await settled(calls);if(!res.success)throw Error('GitHub Releases 数据请求失败或达到匿名请求上限');
    return res.values.flatMap(({repo,releases})=>Array.isArray(releases)?releases.filter(r=>!r.draft).map(r=>item({id:`gh-${repo}-${r.id}`,type:'opensource',source:'GitHub Releases',title:`${repo.split('/')[1]} · ${r.name||r.tag_name}`,desc:`${repo} · 已发布的正式 Release${r.prerelease?'（预发布版本）':''}。点击查看更新说明、兼容性与迁移提示。`,date:r.published_at||r.created_at,url:r.html_url,metric:r.tag_name||'',group:'opensource'})).filter(Boolean):[]);
  }
  const FETCHERS={news:loadNews,models:loadModels,papers:loadPapers,opensource:loadOpenSource};
  function unique(items){const ids=new Set();return items.filter(x=>{if(!x||ids.has(x.id))return false;ids.add(x.id);return true;}).sort((a,b)=>b.date-a.date);}
  function restoreCache(){
    if(previous && Array.isArray(previous.items)){
      state.items=unique(previous.items.filter(x=>x&&['news','models','papers','opensource'].includes(x.type)).map(item));
      state.lastUpdate=Number(previous.updated)||0;
      for(const source of SOURCES)state.statuses[source.id]={status:'cached',count:state.items.filter(x=>x.type===source.id).length};
    }
  }
  async function restoreSnapshot(){
    try {
      // A static read-only snapshot is created by a scheduled workflow, not an invented live feed.
      const data=await fetchJSON('./frontier-feed.json');
      if(data?.schemaVersion!==1 || !Array.isArray(data.items))return;
      const stamp=safeDate(data.generatedAt);
      const good=data.items.map(x=>item(x)).filter(Boolean);
      if(!good.length)return;
      const stale=Date.now()-stamp>72*3600*1000;
      if(stamp>=state.lastUpdate || !state.items.length || good.some(x=>x.titleZh)){
        state.items=unique(good);
        state.lastUpdate=stamp;
        for(const source of SOURCES){
          const stored=data.sources?.[source.id];
          state.statuses[source.id]={status:state.items.some(x=>x.type===source.id)?(stale||stored?.status==='stale'?'stale':'snapshot'):'error',count:state.items.filter(x=>x.type===source.id).length};
        }
        render();
      }
      storage('set',CACHE_KEY,{updated:stamp,items:good});
      return true;
    }catch { /* No server snapshot on file:// or before first scheduled job. */ }
  }
  function renderPulse(){
    const last7=state.items.filter(x=>x.date>=Date.now()-7*86400000);
    const rows=[['news','社区动态'],['models','模型仓库'],['papers','研究论文'],['opensource','版本更新']];
    $('#radar-pulse-grid').innerHTML=rows.map(([type,label])=>`<button type="button" class="radar-pulse-stat" data-radar-stat="${type}" title="按${label}筛选"><strong>${last7.filter(x=>x.type===type).length}</strong><span>${label}</span><small>近 7 天收录 ↗</small></button>`).join('');
  }
  function renderWatch(){
    $('#radar-watch-tags').innerHTML=state.watch.map(w=>`<button type="button" class="radar-watch-chip" data-watch-remove="${esc(w)}" title="移除关注关键词 ${esc(w)}">${esc(w)} <span aria-hidden="true">×</span></button>`).join('');
    $('#radar-export').disabled=state.saved.size===0;
  }
  function updateWatch(){storage('set',WATCH_KEY,state.watch);render();}
  function addWatch(){const input=$('#radar-watch-input');const value=str(input.value,32);if(value&&!state.watch.some(x=>x.toLowerCase()===value.toLowerCase())&&state.watch.length<16)state.watch.push(value);input.value='';updateWatch();}
  function exportSaved(){
    const selected=state.items.filter(x=>state.saved.has(x.id));if(!selected.length)return;
    const md=['# AI Engineering Lab · 收藏的前沿动态','','导出时间：'+dateText(Date.now()),'','> 来源数据可能包含缓存，请以原始链接为准。',''];
    for(const x of selected)md.push(`- [${displayTitle(x).replace(/[\[\]]/g,'')}](${x.url}) — ${x.source} · ${new Date(x.date).toISOString().slice(0,10)}`);
    const blob=new Blob([md.join('\n')+'\n'],{type:'text/markdown;charset=utf-8'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='AI-Frontier-Bookmarks.md';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  }
  function sourceStatusHTML(){return SOURCES.map(s=>{
    const st=state.statuses[s.id]||{status:'loading',count:0};
    const label=st.status==='live'?'已同步':st.status==='cached'?'本地缓存':st.status==='snapshot'?'定时快照':st.status==='stale'?'旧快照':st.status==='error'?'连接失败':'连接中';
    return `<a href="${s.url}" target="_blank" rel="noopener noreferrer" class="radar-source-item"><span class="radar-source-icon ${s.id}">${{news:'HN',models:'HF',papers:'P',opensource:'GH'}[s.id]}</span><span class="radar-source-copy"><strong>${esc(s.name)}</strong><small>${esc(s.desc)}</small></span><span class="radar-source-status ${st.status}" title="${label}">${label}</span></a>`;
  }).join('');}
  function statusHeader(){
    const stats=Object.values(state.statuses);const live=stats.filter(x=>x.status==='live').length;
    const hasCache=stats.some(x=>['cached','snapshot','stale'].includes(x.status));
    const status=state.loading?'数据源同步中':live===4?'4 个数据源已同步':live>0?`${live}/4 个数据源已同步`:hasCache?'快照 / 缓存 · 非实时':'暂未连接到数据源';
    $('#radar-status').textContent=status;
    $('#radar-status-dot').className=`radar-pulse ${state.loading?'loading':live>0?'online':hasCache?'stale':'offline'}`;
    $('#radar-update').textContent=state.lastUpdate ? `最近记录：${dateText(state.lastUpdate)}` : '尚未成功获取';
    $('#radar-refresh').disabled=state.loading;
    $('#radar-refresh').classList.toggle('is-loading',state.loading);
    $('#radar-sources').innerHTML=sourceStatusHTML();
  }
  function matches(x){
    if(state.category==='saved') {if(!state.saved.has(x.id))return false;}
    else if(state.category==='watching'){if(!state.watch.some(w=>searchText(x).toLowerCase().includes(w.toLowerCase())))return false;}
    else if(state.category!=='all' && x.type!==state.category)return false;
    if(state.topic!=='全部方向' && !x.tags.includes(state.topic))return false;
    if(x.date < Date.now()-state.period*86400000)return false;
    if(state.query){const q=state.query.toLocaleLowerCase();if(!searchText(x).toLocaleLowerCase().includes(q))return false;}
    return true;
  }
  function counts(){return Object.fromEntries(CATEGORIES.map(([key])=>[key,key==='all'?state.items.length:key==='saved'?state.items.filter(x=>state.saved.has(x.id)).length:key==='watching'?state.items.filter(x=>state.watch.some(w=>searchText(x).toLowerCase().includes(w.toLowerCase()))).length:state.items.filter(x=>x.type===key).length]));}
  function renderTabs(){const all=counts();$('#radar-tabs').innerHTML=CATEGORIES.map(([key,label])=>`<button type="button" class="radar-tab ${state.category===key?'active':''}" data-radar-tab="${key}" aria-pressed="${state.category===key}">${label}<span>${all[key]}</span></button>`).join('');}
  function renderTopics(){$('#radar-topics').innerHTML=TOPICS.map(t=>`<button type="button" class="radar-topic ${state.topic===t?'active':''}" data-radar-topic="${esc(t)}" aria-pressed="${state.topic===t}">${esc(t)}</button>`).join('');}
  const labels={news:'社区快讯',models:'新模型',papers:'研究论文',opensource:'版本发布'};
  function bookmark(x){return `<button type="button" class="radar-bookmark ${state.saved.has(x.id)?'active':''}" data-radar-save="${esc(x.id)}" aria-label="${state.saved.has(x.id)?'取消收藏':'收藏动态'}" title="${state.saved.has(x.id)?'取消收藏':'添加到我的收藏'}">${state.saved.has(x.id)?'★':'☆'}</button>`;}
  const meta=(x)=>`<span class="radar-type ${x.type}">${labels[x.type]}</span><span class="radar-meta-source">${esc(x.source)}</span><time datetime="${new Date(x.date).toISOString()}" title="${dateText(x.date)}">${fromNow(x.date)}</time>`;
  function mainCard(x){return `<article class="radar-feature-card"><div class="radar-card-meta">${meta(x)}</div><a class="radar-feature-link" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><h3>${esc(displayTitle(x))} <span aria-hidden="true">↗</span></h3></a><p>${esc(displayDesc(x))}</p>${translationLabel(x)}<div class="radar-feature-bottom"><div class="radar-tagset">${x.tags.slice(0,2).map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="radar-item-actions">${bookmark(x)}<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" class="radar-visit-link">阅读原文 ↗</a></div></div></article>`;}
  function listCard(x){return `<article class="radar-list-card"><div class="radar-card-meta">${meta(x)}</div><div class="radar-list-inner"><div class="radar-list-text"><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><h3>${esc(displayTitle(x))}</h3></a><p>${esc(displayDesc(x))}</p>${translationLabel(x)}<div class="radar-list-tags">${x.tags.slice(0,2).map(t=>`<span>${esc(t)}</span>`).join('')}</div></div><div class="radar-item-actions">${bookmark(x)}<a class="radar-visit-icon" aria-label="查看${esc(displayTitle(x))}原文" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">↗</a></div></div></article>`;}
  function render(){
    $('#radar-language').textContent=state.language==='zh'?'查看原文':'切换中文';
    $('#radar-language').setAttribute('aria-pressed',String(state.language==='original'));
    renderTabs();renderTopics();renderPulse();renderWatch();statusHeader();
    const results=state.items.filter(matches);
    const shown=results.slice(0,state.limit);
    $('#radar-results-count').textContent=state.items.length ? `当前筛选 ${results.length} 条 · 共获取 ${state.items.length} 条` : '等待数据源连接';
    if(!results.length){
      const msg=state.loading&&!state.items.length?'正在从 Hugging Face、Hacker News 与 GitHub 获取最新信息…':state.items.length?'该时间范围内暂无匹配动态，可以扩大时间范围或清除筛选。':'目前没有可展示的数据。请检查网络，或前往右侧的官方数据源查看。';
      $('#radar-items').innerHTML=`<div class="radar-empty"><div class="radar-empty-symbol">${state.loading?'◌':'⌁'}</div><strong>${state.loading?'正在连接前沿信号':'暂无匹配的更新'}</strong><p>${msg}</p>${!state.loading&&!state.items.length?'<button type="button" class="radar-empty-retry" data-radar-retry="true">重新尝试 ↻</button>':''}</div>`;
    }else{
      $('#radar-items').innerHTML=shown.map((x,i)=>i===0?mainCard(x):listCard(x)).join('');
    }
    $('#radar-more').hidden=results.length<=state.limit;
    $('#radar-more').textContent=`加载更多动态（剩余 ${Math.max(0,results.length-state.limit)} 条） ↓`;
  }
  async function refresh(force=false){
    if(state.loading)return;
    if(!force && state.lastUpdate && Date.now()-state.lastUpdate<12*60*1000)return;
    state.loading=true;lastRequested=Date.now();render();
    // The scheduled snapshot carries Chinese translations. Do not replace it
    // with untranslated browser API responses after the initial page load.
    if(await restoreSnapshot()){
      state.loading=false;render();return;
    }
    const responses=await Promise.allSettled(Object.entries(FETCHERS).map(async ([type,fetcher])=>({type,items:await fetcher()})));
    const resultItems=[],statuses={};
    for(let i=0;i<responses.length;i++){
      const type=Object.keys(FETCHERS)[i],r=responses[i];
      if(r.status==='fulfilled'){
        const items=r.value.items.map(x=>{
          const cached=state.items.find(old=>old.id===x.id);
          return {...x,titleZh:cached?.title===x.title?cached.titleZh:x.titleZh,descZh:cached?.desc===x.desc?cached.descZh:x.descZh};
        });
        statuses[type]={status:'live',count:items.length};resultItems.push(...items);
      }else{
        const stale=state.items.filter(x=>x.type===type);
        const previous=state.statuses[type]?.status;
        statuses[type]={status:stale.length?(previous==='snapshot'||previous==='stale'?'stale':'cached'):'error',count:stale.length};resultItems.push(...stale);
      }
    }
    state.items=unique(resultItems);state.statuses=statuses;
    if(Object.values(statuses).some(x=>x.status==='live')){
      state.lastUpdate=Date.now();
      storage('set',CACHE_KEY,{updated:state.lastUpdate,items:state.items.slice(0,220)});
    }
    state.loading=false;
    render();
  }
  function init(){
    restoreCache();$('#radar-period').value=String(state.period);render();
    $('#radar-language').addEventListener('click',()=>{state.language=state.language==='zh'?'original':'zh';storage('set','ai-lab-frontier-language',state.language);render();});
    $('#radar-tabs').addEventListener('click',e=>{const el=e.target.closest('[data-radar-tab]');if(el){state.category=el.dataset.radarTab;state.limit=7;render();}});
    $('#radar-topics').addEventListener('click',e=>{const el=e.target.closest('[data-radar-topic]');if(el){state.topic=el.dataset.radarTopic;state.limit=7;render();}});
    $('#radar-period').addEventListener('change',e=>{state.period=Number(e.target.value)||30;state.limit=7;render();});
    $('#radar-search').addEventListener('input',e=>{state.query=e.target.value.trim();state.limit=7;render();});
    $('#radar-refresh').addEventListener('click',()=>refresh(true));
    $('#radar-more').addEventListener('click',()=>{state.limit+=7;render();});
    $('#radar-items').addEventListener('click',e=>{
      if(e.target.closest('[data-radar-retry]')){refresh(true);return;}
      const el=e.target.closest('[data-radar-save]');if(!el)return;
      const id=el.dataset.radarSave;if(state.saved.has(id))state.saved.delete(id);else state.saved.add(id);
      storage('set',SAVE_KEY,[...state.saved]);render();
    });
    $('#radar-pulse-grid').addEventListener('click',e=>{const btn=e.target.closest('[data-radar-stat]');if(btn){state.category=btn.dataset.radarStat;state.period=7;$('#radar-period').value='7';state.limit=7;render();}});
    $('#radar-watch-tags').addEventListener('click',e=>{const btn=e.target.closest('[data-watch-remove]');if(btn){state.watch=state.watch.filter(w=>w!==btn.dataset.watchRemove);updateWatch();}});
    $('#radar-watch-add').addEventListener('click',addWatch);
    $('#radar-watch-input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addWatch();}});
    $('#radar-export').addEventListener('click',exportSaved);
    refresh(true);
    setInterval(()=>{if(!document.hidden&&Date.now()-lastRequested>15*60*1000)refresh(true);},15*60*1000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastRequested>15*60*1000)refresh(true);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
