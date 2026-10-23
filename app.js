(() => {
  'use strict';
  const data = window.LAB_DATA;
  if (!data) throw new Error('Please load data.js before app.js');
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getStored = (key, fallback) => {try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }};
  const setStored = (key, value) => {try { localStorage.setItem(key, value); return true; } catch { return false; }};
  const icons = {
    code:'<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>',
    brain:'<path d="M12 18V5a3 3 0 0 0-5.9-.8A4 4 0 0 0 4 11a4.5 4.5 0 0 0 2 8.5A3.5 3.5 0 0 0 12 18Zm0 0V5a3 3 0 0 1 5.9-.8A4 4 0 0 1 20 11a4.5 4.5 0 0 1-2 8.5A3.5 3.5 0 0 1 12 18Z"/><path d="M8 8c2 .5 3 2 3 4M16 8c-2 .5-3 2-3 4"/>',
    sparkles:'<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM5 17l.8 2.2L8 20l-2.2.8L5 23l-.8-2.2L2 20l2.2-.8L5 17ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    layers:'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
    network:'<rect x="8" y="2" width="8" height="6" rx="1.5"/><rect x="2" y="16" width="8" height="6" rx="1.5"/><rect x="14" y="16" width="8" height="6" rx="1.5"/><path d="M12 8v4M6 16v-4h12v4"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    aperture:'<circle cx="12" cy="12" r="9"/><path d="m14.5 3.5 3 5.2M20.5 9.5h-6M17.5 18l-3-5.2M9.5 20.5l-3-5.2M3.5 14.5h6M6.5 6l3 5.2"/>',
    server:'<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M12 6.5h6M12 17.5h6"/>',
    git:'<circle cx="6" cy="3" r="2"/><circle cx="6" cy="21" r="2"/><circle cx="18" cy="6" r="2"/><path d="M6 5v14M6 11a7 7 0 0 0 7-5h3"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>'
  };
  const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.book}</svg>`;
  const filters = ['全部','Agent','LLM','RAG','工程','推理','算法','评测','多模态','源码'];
  const state = { filter:'全部', limit:6, searchResults:[], searchIndex:0, activeModal:null, previousFocus:null };
  let toastTimeout;

  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimeout); toastTimeout = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function renderKnowledge() {
    $('#knowledge-grid').innerHTML = data.categories.map(c => {
      const count = data.notes.filter(n => n.category === c.topic).length;
      return `<button type="button" class="knowledge-card" data-topic="${esc(c.topic)}" aria-label="浏览${esc(c.name)}专题笔记">
        <div class="knowledge-top"><div class="knowledge-icon">${svg(c.icon)}</div><span class="knowledge-index">${c.number} / 09</span></div>
        <h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>
        <div class="knowledge-card-bottom"><span>${count ? `${count} 篇笔记与指南` : '持续整理中'}</span><b>↗</b></div>
      </button>`;
    }).join('');
  }

  function renderFeatured() {
    const n = data.notes.find(n => n.featured) || data.notes[0];
    $('#featured-note').innerHTML = `<div class="featured-note-text"><span class="feature-label">✦ EDITOR'S PICK · FEATURED NOTE</span>
      <h3>${esc(n.title)}</h3><p>${esc(n.desc)}</p>
      <div class="featured-meta"><span>${esc(n.category)}</span><span>·</span><span>${n.read} 分钟阅读</span><span>·</span><span>示例内容</span><button class="feat-link" data-note="${esc(n.slug)}">开始阅读 ↗</button></div></div>
      <div class="feature-art" aria-hidden="true"><i class="feature-dot one"></i><i class="feature-dot two"></i><i class="feature-dot three"></i><div class="feature-art-center">${svg('network')}<strong>Agent Harness</strong><span>FROM IDEA TO SYSTEM</span></div></div>`;
    $('#featured-note').querySelector('.feature-art').addEventListener('click', () => openContent('note', n.slug));
  }

  function renderNotes() {
    $('#note-filters').innerHTML = filters.map(f => `<button type="button" class="filter-button${state.filter === f ? ' active' : ''}" data-filter="${esc(f)}" aria-pressed="${state.filter === f}">${esc(f)}</button>`).join('');
    const all = data.notes.filter(n => !n.featured && (state.filter === '全部' || n.category === state.filter));
    const subset = all.slice(0, state.limit);
    $('#notes-grid').innerHTML = subset.map(n => `<article class="note-card" data-note="${esc(n.slug)}" tabindex="0" role="button" aria-label="阅读文章：${esc(n.title)}"><div class="note-top"><span class="note-tag">${esc(n.category)}</span><span class="note-date">${esc(n.date)}</span></div><h3>${esc(n.title)}</h3><p>${esc(n.desc)}</p><div class="note-bottom"><span>${n.read} min read · ${esc(n.status || '示例笔记')}</span><span class="arrow">↗</span></div></article>`).join('') || `<div class="empty-notes">这个专题的笔记正在整理中。可以先浏览其他方向。</div>`;
    $('#notes-count').textContent = `${all.length} 篇笔记`;
    $('#show-more-notes').hidden = all.length <= state.limit;
  }

  function renderProjects() {
    $('#projects-grid').innerHTML = data.projects.map(p => `<article class="project-card${p.featured ? ' feature-project' : ''}" data-project="${esc(p.id)}" role="button" tabindex="0" aria-label="查看项目：${esc(p.title)}"><div class="project-header"><div class="project-icon">${svg(p.icon)}</div><span class="project-type">${esc(p.type)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p><div class="project-tags">${p.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div><div class="project-bottom"><span>${esc(p.status)}</span><b>探索项目 ↗</b></div></article>`).join('');
  }

  function getRoadmapProgress() {
    let saved;
    try {saved = JSON.parse(getStored('lab-roadmap-v1','{}'));} catch {saved = {};}
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return saved;
  }
  function updateProgress() {
    const total = data.roadmap.reduce((sum, p) => sum + p.items.length, 0);
    const done = Object.values(getRoadmapProgress()).filter(Boolean).length;
    $('#learning-percent').textContent = `${Math.round(done / total * 100)}%`;
    $('#learning-fraction').textContent = `${done} / ${total} 已完成`;
    $('#learning-progress-fill').style.width = `${done / total * 100}%`;
  }
  function renderRoadmap() {
    const progress = getRoadmapProgress();
    $('#roadmap-list').innerHTML = data.roadmap.map((phase, i) => `<div class="roadmap-group"><h3>${esc(phase.title)}</h3><p>${esc(phase.desc)}</p><div class="roadmap-items">${phase.items.map((item, j) => {
      const id = `step-${i}-${j}`; const checked = !!progress[id];
      return `<label class="roadmap-item${checked ? ' checked' : ''}"><input type="checkbox" data-step="${id}" ${checked ? 'checked' : ''}/><span class="roadmap-item-text">${esc(item)}</span><span class="roadmap-item-code">${String(j + 1).padStart(2,'0')}</span></label>`;
    }).join('')}</div></div>`).join('');
    updateProgress();
  }

  function formatInline(raw) {
    const codeTokens = [];
    let out = esc(raw).replace(/`([^`]+)`/g, (_, code) => {const key = `@@CODE${codeTokens.length}@@`; codeTokens.push(`<code>${code}</code>`); return key;});
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    codeTokens.forEach((v, i) => {out = out.replace(`@@CODE${i}@@`, v);});
    return out;
  }
  function renderMarkdown(md) {
    const lines = String(md || '').trim().split(/\r?\n/);
    let html = '', para = [], list = [], quote = [], code = [], inCode = false, listType = null;
    const flushPara = () => {if (para.length) {html += `<p>${formatInline(para.join(' '))}</p>`;para=[];}};
    const flushList = () => {if (list.length) {html += `<${listType}>${list.map(x => `<li>${formatInline(x)}</li>`).join('')}</${listType}>`;list=[];listType=null;}};
    const flushQuote = () => {if (quote.length) {html += `<blockquote><p>${formatInline(quote.join(' '))}</p></blockquote>`;quote=[];}};
    for (const line of lines) {
      if (/^\s*```/.test(line)) {
        flushPara();flushList();flushQuote();
        if (inCode) {html += `<pre><code>${esc(code.join('\n'))}</code></pre>`;code=[];inCode=false;}
        else inCode=true;
        continue;
      }
      if (inCode) {code.push(line);continue;}
      if (!line.trim()) {flushPara();flushList();flushQuote();continue;}
      const h = line.match(/^(#{2,3})\s+(.*)/);
      if (h) {flushPara();flushList();flushQuote();let n=h[1].length;html+=`<h${n}>${formatInline(h[2])}</h${n}>`;continue;}
      const ul = line.match(/^\s*[-*]\s+(.*)/); const ol = line.match(/^\s*\d+\.\s+(.*)/);
      if (ul || ol) {flushPara();flushQuote();let kind = ul ? 'ul' : 'ol';if(listType && listType!==kind)flushList();listType=kind;list.push((ul||ol)[1]);continue;}
      if (line.startsWith('> ')) {flushPara();flushList();quote.push(line.slice(2));continue;}
      flushList();flushQuote();para.push(line.trim());
    }
    flushPara();flushList();flushQuote();
    if (inCode) html+=`<pre><code>${esc(code.join('\n'))}</code></pre>`;
    return html;
  }

  function lockBody() {document.body.classList.add('modal-open');}
  function unlockBodyIfClosed() {if (!document.querySelector('.modal-layer:not([hidden])')) document.body.classList.remove('modal-open');}
  function openModal(id) {const el = document.getElementById(id);state.previousFocus = document.activeElement;el.hidden=false;state.activeModal=id;lockBody();}
  function closeModal(id) {const el = document.getElementById(id);el.hidden=true;state.activeModal=null;unlockBodyIfClosed();if(state.previousFocus && state.previousFocus.isConnected)state.previousFocus.focus();}

  function openContent(kind, slug, modifyHash = true) {
    const isNote = kind === 'note';
    const obj = (isNote ? data.notes : data.projects).find(x => (isNote ? x.slug : x.id) === slug);
    if (!obj) return;
    $('#reader-content').innerHTML = `<div class="reader-meta"><span class="reader-tag">${isNote ? esc(obj.category) : esc(obj.type)}</span><span>${isNote ? esc(obj.status || '示例笔记 · 可自行编辑') : '研究项目 · 展示性摘要'}</span><span>${isNote ? `${obj.read} 分钟阅读` : esc(obj.status)}</span></div>
      <h1 id="reader-title">${esc(obj.title)}</h1><p class="reader-lead">${esc(obj.desc)}</p><div class="reader-divider"></div><div class="reader-article">${renderMarkdown(isNote ? obj.body : obj.detail)}</div>
      <div class="reader-note">${isNote ? obj.status === '学习指南' ? '学习指南 · 根据公开资料整理。文中的练习为建议任务；公式示例不代表个人实测结果。请结合所用版本核对原始资料。' : '专题示例稿 · 用于组织学习问题，尚未标注为个人实测文章。' : '研究方向摘要 · 用于说明目标与方案，尚未标注为已交付项目。'}</div>`;
    enhanceReader(isNote ? obj : null);
    $('#reader-brand').setAttribute('href', '#top');
    const wasHidden = $('#content-modal').hidden;
    if (wasHidden) openModal('content-modal');
    $('#content-modal .reader-dialog').scrollTop = 0;
    $('#reader-copy').dataset.link = `${location.origin}${location.pathname}#${isNote ? 'read' : 'project'}/${encodeURIComponent(slug)}`;
    if (modifyHash) history.replaceState(null, '', `#${isNote ? 'read' : 'project'}/${encodeURIComponent(slug)}`);
    updateReaderProgress();
  }
  function closeContent() {
    closeModal('content-modal');
    const hash = location.hash;
    if (hash.startsWith('#read/') || hash.startsWith('#project/')) history.replaceState(null,'','#notes');
    $('#reading-progress').style.width='0%';
  }
  function updateReaderProgress() {
    if ($('#content-modal').hidden) return;
    const container = $('#content-modal .reader-dialog');
    const available = container.scrollHeight - container.clientHeight;
    $('#reading-progress').style.width = `${available > 0 ? Math.min(100,Math.round(container.scrollTop/available*100)) : 100}%`;
  }
  function handleInitialHash() {
    const hash = location.hash;
    const match = hash.match(/^#(read|project)\/(.+)$/);
    if (match) openContent(match[1] === 'read' ? 'note' : 'project', decodeURIComponent(match[2]), false);
  }

  function setFilter(filter) {
    state.filter=filters.includes(filter) ? filter : '全部'; state.limit=6;renderNotes();
    $('#notes').scrollIntoView({behavior:'smooth'});
  }

  function getSearchResults(query) {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return [
      ...data.notes.slice(0,4).map(item => ({type:'note',id:item.slug,title:item.title,desc:item.category,icon:'book'})),
      ...data.projects.slice(0,2).map(item => ({type:'project',id:item.id,title:item.title,desc:'研究项目',icon:item.icon}))
    ];
    return [
      ...data.notes.filter(x => `${x.title} ${x.desc} ${x.category} ${x.body}`.toLocaleLowerCase().includes(q)).map(item=>({type:'note',id:item.slug,title:item.title,desc:`${item.category} · 学习笔记`,icon:'book'})),
      ...data.projects.filter(x => `${x.title} ${x.desc} ${x.tags.join(' ')}`.toLocaleLowerCase().includes(q)).map(item=>({type:'project',id:item.id,title:item.title,desc:'项目实验',icon:item.icon})),
      ...data.categories.filter(x=>`${x.name} ${x.desc}`.toLocaleLowerCase().includes(q)).map(item=>({type:'category',id:item.topic,title:item.name,desc:'知识地图专题',icon:item.icon}))
    ].slice(0,12);
  }
  function updateSearch() {
    state.searchResults = getSearchResults($('#search-input').value);
    state.searchIndex=0;
    $('#search-results').innerHTML = state.searchResults.length ? `<div class="search-section-title">${$('#search-input').value.trim() ? '搜索结果' : '推荐阅读'} · ${state.searchResults.length}</div>${state.searchResults.map((r,i)=>`<button type="button" class="search-item${i===0?' selected':''}" data-search-index="${i}"><span>${svg(r.icon)}</span><div class="search-item-main"><strong>${esc(r.title)}</strong><small>${esc(r.desc)}</small></div><span class="search-item-arrow">↗</span></button>`).join('')}` : '<div class="search-no-results">没有找到相关内容，试试 Agent、RAG、推理或 Python。</div>';
  }
  function openSearch() {openModal('search-modal');$('#search-input').value='';updateSearch();requestAnimationFrame(()=>$('#search-input').focus());}
  function closeSearch() {closeModal('search-modal');}
  function chooseSearch(i) {
    const r = state.searchResults[i];if(!r)return;
    closeSearch();
    if(r.type==='category')setFilter(r.id);
    else openContent(r.type,r.id);
  }

  function bindEvents() {
    $('#resource-filters').addEventListener('click', e => {
      const button = e.target.closest('[data-resource-type]');
      if (button) renderResources(button.dataset.resourceType);
    });
    $('#kv-context').addEventListener('input', updateKV);
    $('#reader-content').addEventListener('click', e => {
      const button = e.target.closest('[data-reader-heading]');
      if (button) {
        const heading = document.getElementById(button.dataset.readerHeading);
        heading?.scrollIntoView({behavior:'smooth', block:'start'});
        heading?.focus({preventScroll:true});
      }
    });
    $('#theme-toggle').addEventListener('click',()=>{
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme=next;setStored('lab-theme',next);
    });
    $('#menu-toggle').addEventListener('click',()=>{
      const nav = $('#mobile-nav');const next = nav.hidden;nav.hidden=!next;$('#menu-toggle').setAttribute('aria-expanded',String(next));
    });
    $('#mobile-nav').addEventListener('click',e=>{if(e.target.closest('a')){$('#mobile-nav').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');}});
    $('#knowledge-grid').addEventListener('click',e=>{const c=e.target.closest('[data-topic]');if(c)setFilter(c.dataset.topic);});
    $('#note-filters').addEventListener('click',e=>{const btn=e.target.closest('[data-filter]');if(btn)setFilter(btn.dataset.filter);});
    $('#show-more-notes').addEventListener('click',()=>{state.limit+=6;renderNotes();});
    $('#all-notes').addEventListener('click',()=>{setFilter('全部');state.limit=Infinity;renderNotes();});
    document.addEventListener('click',e=>{
      const note=e.target.closest('[data-note]');const project=e.target.closest('[data-project]');
      if(note)openContent('note',note.dataset.note);
      if(project)openContent('project',project.dataset.project);
      const dismiss=e.target.closest('[data-dismiss]');if(dismiss){const type=dismiss.dataset.dismiss;if(type==='search')closeSearch();if(type==='content')closeContent();if(type==='capture')closeModal('capture-modal');}
    });
    document.addEventListener('keydown',e=>{
      const active = document.activeElement;
      if((e.key.toLowerCase()==='k' && (e.metaKey || e.ctrlKey)) || (e.key==='/' && !['INPUT','TEXTAREA'].includes(active.tagName))) {e.preventDefault();if($('#search-modal').hidden)openSearch();else closeSearch();return;}
      if(e.key==='Escape') {if(!$('#search-modal').hidden)closeSearch();else if(!$('#content-modal').hidden)closeContent();else if(!$('#capture-modal').hidden)closeModal('capture-modal');return;}
      if(!$('#search-modal').hidden){
        if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const len=state.searchResults.length;if(!len)return;state.searchIndex=(state.searchIndex+(e.key==='ArrowDown'?1:-1)+len)%len;$('#search-results').querySelectorAll('[data-search-index]').forEach((x,i)=>x.classList.toggle('selected',i===state.searchIndex));$('#search-results').querySelector(`[data-search-index="${state.searchIndex}"]`)?.scrollIntoView({block:'nearest'});}
        if(e.key==='Enter'){e.preventDefault();chooseSearch(state.searchIndex);}
      }
      if((e.key==='Enter'||e.key===' ') && active.matches('[data-note], [data-project]')){e.preventDefault();if(active.dataset.note)openContent('note',active.dataset.note);else openContent('project',active.dataset.project);}
    });
    $('#search-trigger').addEventListener('click',openSearch);
    $('#search-input').addEventListener('input',updateSearch);
    $('#search-close').addEventListener('click',closeSearch);
    $('#search-results').addEventListener('click',e=>{const el=e.target.closest('[data-search-index]');if(el)chooseSearch(Number(el.dataset.searchIndex));});
    $('#reader-close').addEventListener('click',closeContent);
    $('#reader-close-bottom').addEventListener('click',closeContent);
    $('#reader-copy').addEventListener('click',async()=>{
      const path = $('#reader-copy').dataset.link;
      try{await navigator.clipboard.writeText(path);toast('文章链接已复制');}catch{toast('无法访问剪贴板，可从浏览器地址栏复制链接');}
    });
    $('#content-modal .reader-dialog').addEventListener('scroll',updateReaderProgress,{passive:true});
    window.addEventListener('hashchange',()=>{
      const hash = location.hash;
      if(hash.startsWith('#read/')||hash.startsWith('#project/'))handleInitialHash();
      else if(!$('#content-modal').hidden)closeContent();
    });
    $('#roadmap-list').addEventListener('change',e=>{
      const input=e.target.closest('[data-step]');if(!input)return;
      const saved=getRoadmapProgress();saved[input.dataset.step]=input.checked;
      if(!input.checked)delete saved[input.dataset.step];
      if(!setStored('lab-roadmap-v1',JSON.stringify(saved)))toast('浏览器禁用了本地存储，无法保存进度');
      input.closest('.roadmap-item').classList.toggle('checked',input.checked);updateProgress();
    });
    $('#reset-learning').addEventListener('click',()=>{if(!confirm('确定要重置当前浏览器的全部学习进度吗？'))return;setStored('lab-roadmap-v1','{}');renderRoadmap();toast('学习进度已重置');});
    $('#quick-note-trigger').addEventListener('click',()=>{openModal('capture-modal');$('#capture-input').value=getStored('lab-capture-v1','');$('#capture-input').focus();});
    $('#capture-close').addEventListener('click',()=>closeModal('capture-modal'));
    $('#capture-input').addEventListener('input',()=>{
      const ok=setStored('lab-capture-v1',$('#capture-input').value);
      $('#capture-status').textContent = ok ? '已自动保存在本机' : '存储受限，请立即导出备份';
    });
    $('#capture-clear').addEventListener('click',()=>{if(!$('#capture-input').value)return;if(!confirm('确定清空本地速记吗？'))return;$('#capture-input').value='';setStored('lab-capture-v1','');toast('速记已清空');});
    $('#capture-export').addEventListener('click',()=>{
      const val = $('#capture-input').value;
      if(!val.trim()){toast('写下一点内容后再导出');return;}
      const file = new Blob([`# AI Engineering Lab · 灵感速记\n\n导出时间：${new Date().toLocaleString('zh-CN')}\n\n${val}\n`],{type:'text/markdown;charset=utf-8'});
      const a=document.createElement('a');const url=URL.createObjectURL(file);a.href=url;a.download=`ai-lab-notes-${new Date().toISOString().slice(0,10)}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Markdown 文件已导出');
    });
    $('#copy-intro').addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(`${data.profile.name}｜${data.profile.headline}\n${data.profile.introduction}`);toast('个人简介已复制');}catch{toast('请手动复制关于我的介绍');}
    });
    $('#back-to-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    window.addEventListener('scroll',()=>{$('#back-to-top').classList.toggle('visible',scrollY>700);},{passive:true});
    if('IntersectionObserver' in window){
      const observer = new IntersectionObserver(entries=>{
        entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===entry.target.id));}});
      },{rootMargin:'-30% 0px -55% 0px',threshold:0});
      document.querySelectorAll('main section[id]').forEach(section=>observer.observe(section));
    }
  }

  function renderLearning() {
    $('#learning-paths').innerHTML = data.paths.map(path => `<article class="learning-path"><div class="section-kicker">${esc(path.label)}</div><h3>${esc(path.title)}</h3><p>${esc(path.desc)}</p><ol>${path.slugs.map(slug => {
      const note = data.notes.find(n => n.slug === slug);
      return note ? `<li><button type="button" data-note="${esc(slug)}">${esc(note.title)}<span>${note.read} 分钟 ↗</span></button></li>` : '';
    }).join('')}</ol><div class="path-outcome">${esc(path.outcome)}</div></article>`).join('');
    renderResources('全部');
    updateKV();
  }

  function renderResources(type) {
    const types = ['全部', ...new Set(data.resources.map(r => r.type))];
    $('#resource-filters').innerHTML = types.map(t => `<button type="button" class="filter-button${t === type ? ' active' : ''}" data-resource-type="${esc(t)}" aria-pressed="${t === type}">${esc(t)}</button>`).join('');
    const resources = data.resources.filter(r => type === '全部' || r.type === type);
    $('#resource-count').textContent = `${resources.length} 份精选资料 · 链接核对于 2026-10-23 · 外部资料可能更新`;
    $('#resource-grid').innerHTML = resources.map(r => `<article class="resource-card"><div class="resource-meta"><span>${esc(r.type)}</span><span>${esc(r.author)}</span></div><h3><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)} <span aria-hidden="true">↗</span></a></h3><p>${esc(r.why)}</p><div class="resource-task"><strong>读完试试</strong><span>${esc(r.task)}</span></div></article>`).join('');
  }

  function updateKV() {
    const tokens = Number($('#kv-context').value);
    const gib = 2 * 32 * tokens * 8 * 128 * 2 / 1024 ** 3;
    $('#kv-tokens').textContent = `${tokens.toLocaleString('en-US')} tokens`;
    $('#kv-result').textContent = `${gib.toFixed(2)} GiB`;
    $('#kv-fill').style.width = `${tokens / 32768 * 100}%`;
  }

  function enhanceReader(note) {
    const article = $('#reader-content .reader-article');
    const headings = [...article.querySelectorAll('h2, h3')];
    if (headings.length > 1) {
      headings.forEach((heading, index) => {heading.id = `reader-section-${index}`;heading.tabIndex = -1;});
      const toc = document.createElement('nav');
      toc.className = 'reader-toc';
      toc.setAttribute('aria-label', '文章目录');
      toc.innerHTML = `<strong>本文目录</strong><ol>${headings.map(h => `<li><button type="button" data-reader-heading="${h.id}">${esc(h.textContent)}</button></li>`).join('')}</ol>`;
      article.before(toc);
    }
    if (!note) return;
    const path = data.paths.find(p => p.slugs.includes(note.slug));
    const related = [...new Set([...(path?.slugs || []), ...data.notes.filter(n => n.category === note.category).map(n => n.slug)])]
      .filter(slug => slug !== note.slug).map(slug => data.notes.find(n => n.slug === slug)).filter(Boolean).slice(0,3);
    if (related.length) {
      const section = document.createElement('section');
      section.className = 'reader-related';
      section.innerHTML = `<h2>沿着这个问题继续读</h2>${related.map(n => `<button type="button" data-note="${esc(n.slug)}"><span>${esc(n.category)} · ${n.read} 分钟</span><strong>${esc(n.title)} ↗</strong></button>`).join('')}`;
      article.after(section);
    }
  }

  function init(){
    const theme = getStored('lab-theme', window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
    $('#current-year').textContent=new Date().getFullYear();
    renderKnowledge();renderFeatured();renderNotes();renderProjects();renderRoadmap();renderLearning();bindEvents();handleInitialHash();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
