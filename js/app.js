/* js/app.js — 逻辑层 */
(function () {
  const DATA = window.HANDBOOK_DATA;
  const S = window.HBStorage;

  /* ============ 工具 ============ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad2 = n => String(n).padStart(2, '0');
  const idLabel = id => String(id).toUpperCase();
  const highlight = (text, kw) => {
    if (!kw) return esc(text);
    const re = new RegExp('(' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return esc(text).replace(re, '<mark>$1</mark>');
  };
  const chevron = `<svg class="item-chevron" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>`;

  /* ============ 状态 ============ */
  let state = {
    kw: '',
    activeTags: new Set(),
    openItems: new Set()
  };

  /* ============ 初始化 ============ */
  function init() {
    renderNav();
    renderSections();
    renderTagFilters();
    bindSearch();
    bindToolbar();
    bindModal();
    bindQuiz();
    bindItemToggle();
    bindCheckboxes();
    bindMobileMenu();
    updateProgress();
  }

  /* ============ 渲染目录 ============ */
  function renderNav() {
    const root = $('#nav-root');
    root.innerHTML = DATA.sections.map((sec, si) => `
      <div class="nav-section">
        <div class="nav-section-title" data-section="${sec.id}">
          <span class="nav-section-num">${pad2(si + 1)}</span>
          <span>${esc(sec.title)}</span>
          <span class="nav-section-count">${sec.items.length}</span>
        </div>
        <div class="nav-items">
          ${sec.items.map(it => `
            <a class="nav-item" href="#${it.id}" data-nav-id="${it.id}">
              <span class="nav-item-id">${esc(idLabel(it.id))}</span>
              <span class="nav-item-q">${esc(it.q)}</span>
            </a>
          `).join('')}
        </div>
      </div>
    `).join('');

    root.addEventListener('click', e => {
      const t = e.target.closest('.nav-section-title');
      if (t) {
        const items = t.nextElementSibling;
        items.style.display = items.style.display === 'none' ? '' : 'none';
      }
    });
  }

  /* ============ 渲染主内容 ============ */
  function renderSections() {
    const root = $('#main-root');
    const html = DATA.sections.map((sec, si) => `
      <section class="section" id="sec-${sec.id}">
        <div class="section-head">
          <div class="section-meta">
            <span class="section-num">CH ${pad2(si + 1)}</span>
            <span class="section-count">${sec.items.length} QUESTIONS</span>
          </div>
          <h2>${esc(sec.title)}</h2>
          <p>${esc(sec.desc)}</p>
        </div>
        ${sec.items.map(it => renderItem(it)).join('')}
      </section>
    `).join('');
    $('#toolbar').insertAdjacentHTML('afterend', html);
  }

  function renderItem(it) {
    const checked = S.getChecks().includes(it.id);
    const tags = (it.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
    const blindTag = it.blind ? '<span class="tag tag-blind">需核实</span>' : '';
    const followups = (it.followups || []).length ? `
      <div class="followups">
        <div class="followups-title">Follow-ups</div>
        ${it.followups.map(f => `
          <div class="followup">
            <div class="followup-q">${esc(f.q)}</div>
            <div class="followup-a">${esc(f.a)}</div>
          </div>
        `).join('')}
      </div>` : '';
    const trap = it.trap ? `<div class="trap">${esc(it.trap)}</div>` : '';
    return `
      <article class="item${checked ? ' checked' : ''}" id="${it.id}" data-id="${it.id}">
        <div class="item-head" data-toggle="${it.id}">
          <input type="checkbox" class="item-check" data-check="${it.id}" ${checked ? 'checked' : ''} aria-label="标记已复习" />
          <div class="item-id">${esc(idLabel(it.id))}</div>
          <div class="item-main">
            <h3 class="item-q">${esc(it.q)}</h3>
            <div class="item-tags">${tags}${blindTag}</div>
          </div>
          ${chevron}
        </div>
        <div class="item-body">
          <div class="point">考点 · ${esc(it.point)}</div>
          <div class="answer">${highlight(it.answer, state.kw)}</div>
          ${followups}
          ${trap}
        </div>
      </article>
    `;
  }

  /* ============ 标签筛选 ============ */
  function renderTagFilters() {
    const tags = new Set();
    DATA.sections.forEach(s => s.items.forEach(it => (it.tags || []).forEach(t => tags.add(t))));
    const all = [...tags];
    const list = $('#search-tags');
    list.innerHTML = all.map(t => `<span class="tag" data-tag="${esc(t)}">${esc(t)}</span>`).join('');

    const toggle = $('#btn-tags-toggle');
    const countEl = $('#tags-toggle-count');
    const activeEl = $('#tags-active');
    countEl.textContent = String(all.length);

    function setTagsOpen(open) {
      S.setTagsOpen(open);
      toggle.setAttribute('aria-expanded', String(open));
      list.hidden = !open;
      list.classList.toggle('is-collapsed', !open);
    }
    setTagsOpen(S.getTagsOpen());
    toggle.addEventListener('click', () => {
      setTagsOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    function syncActiveStrip() {
      const active = [...state.activeTags];
      if (!active.length || !list.hidden) {
        activeEl.hidden = true;
        activeEl.innerHTML = '';
      } else {
        activeEl.hidden = false;
        activeEl.innerHTML = active.map(t =>
          `<span class="tag active" data-tag="${esc(t)}" title="点击取消">${esc(t)} ×</span>`
        ).join('');
      }
      countEl.textContent = active.length ? `${active.length}/${all.length}` : String(all.length);
      countEl.classList.toggle('has-active', active.length > 0);
    }

    function onTagClick(e) {
      const t = e.target.closest('[data-tag]');
      if (!t) return;
      const tag = t.dataset.tag;
      if (state.activeTags.has(tag)) state.activeTags.delete(tag); else state.activeTags.add(tag);
      $$('[data-tag="' + CSS.escape(tag) + '"]').forEach(el => {
        el.classList.toggle('active', state.activeTags.has(tag));
      });
      syncActiveStrip();
      applyFilter();
    }

    list.addEventListener('click', onTagClick);
    activeEl.addEventListener('click', onTagClick);
    syncActiveStrip();
  }

  /* ============ 搜索 ============ */
  function bindSearch() {
    $('#search').addEventListener('input', e => {
      state.kw = e.target.value.trim();
      applyFilter();
    });
  }

  function applyFilter() {
    let visible = 0;
    $$('.item').forEach(el => {
      const id = el.dataset.id;
      const item = findItem(id);
      if (!item) return;
      let show = true;
      if (state.kw) {
        const hay = (item.q + ' ' + item.answer + ' ' + (item.tags || []).join(' ')).toLowerCase();
        if (!hay.includes(state.kw.toLowerCase())) show = false;
      }
      if (state.activeTags.size) {
        const itemTags = new Set(item.tags || []);
        for (const t of state.activeTags) if (!itemTags.has(t)) { show = false; break; }
      }
      el.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    $$('.section').forEach(sec => {
      const any = $$('.item', sec).some(el => el.style.display !== 'none');
      sec.style.display = any ? '' : 'none';
    });

    const empty = $('#filter-empty');
    if (empty) empty.hidden = visible > 0 || (!state.kw && !state.activeTags.size);
  }

  function findItem(id) {
    for (const s of DATA.sections) {
      const it = s.items.find(x => x.id === id);
      if (it) return it;
    }
    return null;
  }

  /* ============ 工具栏 ============ */
  function bindToolbar() {
    $('#btn-expand').addEventListener('click', () => {
      $$('.item').forEach(el => el.classList.add('open'));
    });
    $('#btn-collapse').addEventListener('click', () => {
      $$('.item').forEach(el => el.classList.remove('open'));
    });
    $('#btn-print').addEventListener('click', () => {
      $$('.item').forEach(el => el.classList.add('open'));
      setTimeout(() => window.print(), 100);
    });
    $('#btn-clear-checks').addEventListener('click', () => {
      S.clearChecks();
      $$('.item-check').forEach(cb => { cb.checked = false; cb.closest('.item')?.classList.remove('checked'); });
      updateProgress();
    });
  }

  /* ============ 展开/收起 ============ */
  function bindItemToggle() {
    document.addEventListener('click', e => {
      const head = e.target.closest('.item-head');
      if (!head) return;
      if (e.target.closest('.item-check')) return;
      const el = head.closest('.item');
      el.classList.toggle('open');
    });
  }

  /* ============ 勾选进度 ============ */
  function bindCheckboxes() {
    document.addEventListener('change', e => {
      const cb = e.target.closest('.item-check');
      if (!cb) return;
      S.toggleCheck(cb.dataset.check);
      const item = cb.closest('.item');
      if (item) item.classList.toggle('checked', cb.checked);
      updateProgress();
    });
  }

  function updateProgress() {
    const total = DATA.sections.reduce((n, s) => n + s.items.length, 0);
    const done = S.getChecks().length;
    const pct = total ? Math.round(done / total * 100) : 0;
    $('#progress-text').textContent = `${done} / ${total} · ${pct}%`;
    $('#progress-fill').style.width = (done / total * 100) + '%';
    $('#quick-stat').textContent = `共 ${total} 问 · 已复习 ${done}`;
  }

  /* ============ Modal ============ */
  function bindModal() {
    $$('[data-modal]').forEach(btn => {
      btn.addEventListener('click', () => openModal(btn.dataset.modal));
    });
    document.addEventListener('click', e => {
      if (e.target.closest('[data-close]')) {
        const m = e.target.closest('.modal');
        if (m) m.hidden = true;
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') $$('.modal').forEach(m => m.hidden = true);
    });
    renderNumbersModal();
    renderRescueModal();
    renderBlindModal();
    renderTodoModal();
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = false;
  }

  function renderNumbersModal() {
    const r = DATA.quickRef;
    $('#modal-numbers-body').innerHTML = `
      <table>
        <thead><tr><th>项目</th><th>口径</th></tr></thead>
        <tbody>
          ${r.numbers.map(n => `<tr><td>${esc(n.label)}</td><td>${esc(n.value)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="modal-sub">城市薪资</div>
      <table>
        <thead><tr><th>城市</th><th>区间</th><th>依据</th></tr></thead>
        <tbody>
          ${r.city.map(c => `<tr><td>${esc(c.city)}</td><td>${esc(c.range)}</td><td>${esc(c.reason)}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  function renderRescueModal() {
    $('#modal-rescue-body').innerHTML = DATA.rescue.map(r => `
      <div class="rescue-row">
        <div class="rescue-scene">${esc(r.scene)}</div>
        <div class="rescue-script">${esc(r.script)}</div>
      </div>
    `).join('');
  }

  function renderBlindModal() {
    $('#modal-blind-body').innerHTML = DATA.blinds.map(b => `
      <div class="rescue-row">
        <div class="rescue-scene">${esc(b.item)}</div>
        <div class="rescue-script">${esc(b.script)}</div>
      </div>
    `).join('');
  }

  function renderTodoModal() {
    $('#modal-todo-body').innerHTML = `
      <table>
        <thead><tr><th>#</th><th>项</th><th>建议值</th></tr></thead>
        <tbody>
          ${DATA.todo.map(t => `<tr><td>${t.id}</td><td>${esc(t.item)}</td><td>${esc(t.suggest)}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  /* ============ 自测 ============ */
  let quiz = { pool: [], idx: 0, showA: false };

  function bindQuiz() {
    $('#btn-quiz').addEventListener('click', startQuiz);
    $('#btn-quiz-close').addEventListener('click', () => { $('#quiz-overlay').hidden = true; });
  }

  function startQuiz() {
    quiz.pool = [];
    DATA.sections.forEach(s => s.items.forEach(it => quiz.pool.push(it)));
    quiz.pool.sort(() => Math.random() - 0.5);
    quiz.idx = 0;
    $('#quiz-overlay').hidden = false;
    renderQuiz();
  }

  function renderQuiz() {
    const q = quiz.pool[quiz.idx];
    if (!q) {
      $('#quiz-body').innerHTML = '<p>本轮结束。</p>';
      $('#quiz-foot').innerHTML = `<button class="btn" id="quiz-restart">再来一轮</button>`;
      $('#quiz-restart').onclick = startQuiz;
      return;
    }
    $('#quiz-body').innerHTML = `
      <div class="quiz-meta">${pad2(quiz.idx + 1)} / ${quiz.pool.length} · ${esc(idLabel(q.id))} · ${esc(q.point)}</div>
      <div class="quiz-q">${esc(q.q)}</div>
      ${quiz.showA ? `<div class="quiz-a">${esc(q.answer)}</div>` : ''}
    `;
    $('#quiz-foot').innerHTML = `
      ${quiz.showA ? '' : `<button class="btn" id="quiz-show">显示答案</button>`}
      <button class="btn" id="quiz-ok">会了</button>
      <button class="btn" id="quiz-no">不会</button>
      <button class="btn" id="quiz-next">下一题</button>
    `;
    $('#quiz-show') && ($('#quiz-show').onclick = () => { quiz.showA = true; renderQuiz(); });
    $('#quiz-ok').onclick = () => { quiz.idx++; quiz.showA = false; renderQuiz(); };
    $('#quiz-no').onclick = () => { quiz.showA = true; renderQuiz(); };
    $('#quiz-next').onclick = () => { quiz.idx++; quiz.showA = false; renderQuiz(); };
  }

  /* ============ 移动端 ============ */
  function bindMobileMenu() {
    const btn = $('#btn-menu');
    const sidebar = $('#sidebar');
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      btn.setAttribute('aria-expanded', sidebar.classList.contains('open'));
    });
    document.addEventListener('click', e => {
      if (window.innerWidth > 900) return;
      if (!sidebar.classList.contains('open')) return;
      if (e.target.closest('#sidebar') || e.target.closest('#btn-menu')) return;
      sidebar.classList.remove('open');
    });
  }

  /* ============ 启动 ============ */
  document.addEventListener('DOMContentLoaded', init);
})();
