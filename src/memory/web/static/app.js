// SiftCoder Memory web client. Vanilla JS, no framework.
(() => {
  const params = new URLSearchParams(location.search);
  const tokenFromUrl = params.get('token');
  if (tokenFromUrl) {
    sessionStorage.setItem('siftcoder-mem-token', tokenFromUrl);
    history.replaceState({}, '', location.pathname);
  }
  const TOKEN = sessionStorage.getItem('siftcoder-mem-token') || '';

  const fmt = {
    num: (n) => Number(n || 0).toLocaleString('en-US'),
    pct: (n) => (Number(n || 0) * 100).toFixed(1) + '%',
    when: (ts) => {
      if (!ts) return '';
      const d = new Date(Number(ts));
      const now = Date.now();
      const diff = now - d.getTime();
      if (diff < 60000) return Math.round(diff / 1000) + 's ago';
      if (diff < 3600000) return Math.round(diff / 60000) + 'm ago';
      if (diff < 86400000) return Math.round(diff / 3600000) + 'h ago';
      return d.toISOString().slice(0, 19).replace('T', ' ');
    },
    confidence: (c) => c == null ? '–' : Number(c).toFixed(2),
  };

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      method: opts.method || 'GET',
      headers: { 'authorization': 'Bearer ' + TOKEN, 'content-type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    return res.json();
  }

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // Tabs
  document.querySelectorAll('nav button[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('nav button[data-tab]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.getElementById('tab-' + id).classList.add('active');
      loadTab(id);
    });
  });
  document.getElementById('refresh').addEventListener('click', refreshAll);

  async function refreshAll() {
    await loadHealth();
    const active = document.querySelector('nav button.active')?.dataset.tab || 'overview';
    await loadTab(active);
  }

  async function loadHealth() {
    const banner = document.getElementById('health');
    try {
      const { data } = await api('/api/health');
      banner.textContent = `${data.workspace}  ${data.backend}  events=${data.events} summaries=${data.summaries} embeddings=${data.embeddings}`;
      banner.className = 'health ok';
    } catch (e) {
      banner.textContent = 'unreachable';
      banner.className = 'health err';
    }
  }

  async function loadTab(name) {
    if (name === 'overview') return loadOverview();
    if (name === 'events') return loadEvents();
    if (name === 'summaries') return loadSummaries();
    if (name === 'search') return; // form-driven
    if (name === 'why') return;
    if (name === 'ab') return;
  }

  function row(label, value) {
    return `<div class="k">${escape(label)}</div><div class="v">${escape(value)}</div>`;
  }

  async function loadOverview() {
    const cap = document.getElementById('overview-capture');
    const dr = document.getElementById('overview-drain');
    const sp = document.getElementById('overview-spend');
    const ctx = document.getElementById('overview-context');
    cap.innerHTML = dr.innerHTML = sp.innerHTML = ctx.innerHTML = '<div class="empty">loading...</div>';
    try {
      const { data: r } = await api('/api/savings');
      cap.innerHTML = '<div class="kv">' +
        row('events captured', fmt.num(r.capture.events)) +
        row('tokens captured', fmt.num(r.capture.tokensCaptured)) +
        row('redacted events', fmt.num(r.capture.redactedEvents)) +
        row('by tool', Object.entries(r.capture.perTool).map(([k, v]) => `${k}=${v}`).join(', ') || '–') +
      '</div>';
      dr.innerHTML = '<div class="kv">' +
        row('summarized', fmt.num(r.drain.summarized) + ' (' + fmt.pct(r.drain.coverage) + ' coverage)') +
        row('raw / pending', fmt.num(r.drain.raw)) +
        row('skipped', fmt.num(r.drain.skipped)) +
      '</div>';
      sp.innerHTML = '<div class="kv">' +
        row('summaries', fmt.num(r.spend.summaries)) +
        row('tokens in', fmt.num(r.spend.tokensIn)) +
        row('tokens out', fmt.num(r.spend.tokensOut)) +
        row('cache hit rate', fmt.pct(r.spend.cacheHitRate)) +
      '</div>';
      ctx.innerHTML = '<div class="kv">' +
        row('summary tokens stored', fmt.num(r.context.summaryTokensStored)) +
        row('compression ratio', fmt.pct(r.context.compressionRatio)) +
        row('net saved tokens', fmt.num(r.context.netSavedTokens)) +
      '</div>';
    } catch (e) {
      cap.innerHTML = '<div class="empty">failed: ' + escape(e.message) + '</div>';
    }
  }

  async function loadEvents() {
    const tbody = document.getElementById('events-body');
    tbody.innerHTML = '<tr><td colspan="5" class="empty">loading...</td></tr>';
    try {
      const { data } = await api('/api/events?limit=100');
      if (!data.events.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">no events</td></tr>';
        return;
      }
      tbody.innerHTML = data.events.map((e) =>
        `<tr><td>${escape(e.id)}</td><td>${escape(e.tool)}</td>` +
        `<td><span class="tag ${escape(e.status)}">${escape(e.status)}</span></td>` +
        `<td>${escape(e.session_id)}</td>` +
        `<td>${escape(fmt.when(e.ts))}</td></tr>`
      ).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">failed: ' + escape(e.message) + '</td></tr>';
    }
  }

  async function loadSummaries() {
    const tbody = document.getElementById('summaries-body');
    tbody.innerHTML = '<tr><td colspan="5" class="empty">loading...</td></tr>';
    try {
      const { data } = await api('/api/summaries?limit=100');
      if (!data.summaries.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">no summaries yet — run mem_drain</td></tr>';
        return;
      }
      tbody.innerHTML = data.summaries.map((s) =>
        `<tr><td>${escape(s.id)}</td><td>${escape(s.model)}</td>` +
        `<td>${escape(fmt.confidence(s.confidence))}</td>` +
        `<td>${escape(s.text)}</td>` +
        `<td>${escape(fmt.when(s.ts))}</td></tr>`
      ).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">failed: ' + escape(e.message) + '</td></tr>';
    }
  }

  document.getElementById('search-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const q = document.getElementById('search-q').value.trim();
    const k = parseInt(document.getElementById('search-k').value, 10) || 5;
    const tbody = document.getElementById('search-body');
    if (!q) { tbody.innerHTML = ''; return; }
    tbody.innerHTML = '<tr><td colspan="4" class="empty">searching...</td></tr>';
    try {
      const { data } = await api('/api/search', { method: 'POST', body: { query: q, k } });
      if (!data.hits.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">no hits</td></tr>';
        return;
      }
      tbody.innerHTML = data.hits.map((h) =>
        `<tr><td>${escape(Number(h.score).toFixed(4))}</td>` +
        `<td>${escape(h.id)}</td>` +
        `<td>${escape(fmt.confidence(h.recency))}</td>` +
        `<td>${escape(h.text)}</td></tr>`
      ).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty">failed: ' + escape(e.message) + '</td></tr>';
    }
  });

  document.getElementById('why-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const kind = document.getElementById('why-kind').value.trim();
    const id = document.getElementById('why-id').value.trim();
    const depth = parseInt(document.getElementById('why-depth').value, 10) || 4;
    const ul = document.getElementById('why-body');
    if (!kind || !id) { ul.innerHTML = '<li class="empty">kind and id required</li>'; return; }
    ul.innerHTML = '<li class="empty">tracing...</li>';
    try {
      const { data } = await api('/api/why', { method: 'POST', body: { kind, id, depth } });
      if (!data.edges.length) {
        ul.innerHTML = '<li class="empty">no provenance edges from this node</li>';
        return;
      }
      ul.innerHTML = data.edges.map((e) =>
        `<li>${escape(e.from.kind)}:${escape(e.from.id)} <span class="arrow">→</span> ` +
        `[${escape(e.edgeType)} ${Number(e.confidence).toFixed(2)}] <span class="arrow">→</span> ` +
        `${escape(e.to.kind)}:${escape(e.to.id)} ` +
        `<span class="tag">${escape(e.source)}</span></li>`
      ).join('');
    } catch (e) {
      ul.innerHTML = '<li class="empty">failed: ' + escape(e.message) + '</li>';
    }
  });

  document.getElementById('ab-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const turns = parseInt(document.getElementById('ab-turns').value, 10) || 100;
    const k = parseInt(document.getElementById('ab-k').value, 10) || 5;
    const out = document.getElementById('ab-result');
    out.innerHTML = '<div class="empty">running A/B...</div>';
    try {
      const { data } = await api('/api/ab', { method: 'POST', body: { turns, k } });
      const aMax = Math.max(data.totalA, data.totalB) || 1;
      out.innerHTML = `<div class="kv">` +
        row('turns replayed', fmt.num(data.turns.length)) +
        row('memory K', data.k) +
      `</div>
      <div style="margin-top:16px;">
        <div><strong>Branch A (full history)</strong></div>
        <div><span class="bar" style="width:${(data.totalA / aMax * 360).toFixed(0)}px"></span>${fmt.num(data.totalA)} tokens</div>
        <div style="margin-top:6px;"><strong>Branch B (memory-backed)</strong></div>
        <div><span class="bar" style="width:${(data.totalB / aMax * 360).toFixed(0)}px"></span>${fmt.num(data.totalB)} tokens</div>
        <div style="margin-top:12px; color:#57c785;"><strong>Saved: ${fmt.num(data.savedTokens)} (${fmt.pct(data.savedPct)})</strong></div>
      </div>`;
    } catch (e) {
      out.innerHTML = '<div class="empty">failed: ' + escape(e.message) + '</div>';
    }
  });

  refreshAll();
  setInterval(loadHealth, 15000);
})();
