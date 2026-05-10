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
    if (name === 'health') return loadHealthTab();
    if (name === 'pinned') return loadPinned();
    if (name === 'sessions') return loadSessions();
    if (name === 'search') return; // form-driven
    if (name === 'symbol') return; // form-driven
    if (name === 'why') return;
    if (name === 'graph') return loadGraphTab();
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

  // ─── Health tab: stats + doctor ──────────────────────────────────────────────
  // rowHtml allows trusted html on the right-hand side (caller's responsibility to escape).
  function rowHtml(label, html) { return `<div class="k">${escape(label)}</div><div class="v">${html}</div>`; }
  async function loadHealthTab() {
    const statsBox = document.getElementById('health-stats');
    const doctorBox = document.getElementById('health-doctor');
    statsBox.innerHTML = doctorBox.innerHTML = '<div class="empty">loading...</div>';
    try {
      const [stats, doctor] = await Promise.all([api('/api/stats'), api('/api/doctor')]);
      const s = stats.data;
      const c = s.counts || { events: 0, raw: 0, summarized: 0, skipped: 0 };
      const tp = s.throughput || { eventsPerMin: 0, summariesPerMin: 0 };
      const bl = s.backlog || { pending: 0, etaSec: null };
      statsBox.innerHTML = '<div class="kv">' +
        row('events', `${fmt.num(c.events)} (raw=${fmt.num(c.raw)} sum=${fmt.num(c.summarized)} skip=${fmt.num(c.skipped)})`) +
        row('throughput', `${tp.eventsPerMin.toFixed(2)} ev/min  ${tp.summariesPerMin.toFixed(2)} sm/min`) +
        row('backlog', `${fmt.num(bl.pending)} pending  eta ${bl.etaSec ?? '–'}s`) +
        row('cache hit rate', fmt.pct(s.cacheHitRate)) +
        row('top tools', (s.topTools || []).slice(0, 6).map(t => `${t.tool}=${t.count}`).join(', ') || '–') +
        '</div>';
      const d = doctor.data;
      const vc = d.vecCardinality || { embeddings: 0, vec: 0, drift: 0 };
      const ok = d.integrity === 'ok' && (d.orphanSummaries ?? 0) === 0 && (d.orphanEmbeddings ?? 0) === 0 && (d.orphanProvenance ?? 0) === 0;
      doctorBox.innerHTML = '<div class="kv">' +
        rowHtml('integrity', `<span class="tag ${ok ? 'ok' : 'err'}">${escape(d.integrity)}</span>`) +
        row('orphans', `summaries=${d.orphanSummaries ?? 0} embeddings=${d.orphanEmbeddings ?? 0} provenance=${d.orphanProvenance ?? 0}`) +
        row('vec0 drift', `embeddings=${vc.embeddings} vec=${vc.vec} drift=${vc.drift}`) +
        row('pinned', fmt.num(d.pinned ?? 0)) +
        '</div>';
    } catch (e) {
      statsBox.innerHTML = '<div class="empty">failed: ' + escape(e.message) + '</div>';
      doctorBox.innerHTML = '';
    }
  }

  // ─── Pinned tab: list + unpin ────────────────────────────────────────────────
  async function loadPinned() {
    const tbody = document.getElementById('pinned-body');
    tbody.innerHTML = '<tr><td colspan="5" class="empty">loading...</td></tr>';
    try {
      const { data } = await api('/api/pinned?limit=100');
      if (!data.pinned.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">no pinned summaries — pin via mem_pin or click pin in another tab</td></tr>';
        return;
      }
      tbody.innerHTML = data.pinned.map((p) =>
        `<tr><td>${escape(p.id)}</td>` +
        `<td>${escape(fmt.confidence(p.confidence))}</td>` +
        `<td>${escape(p.text)}</td>` +
        `<td>${escape(fmt.when(p.ts))}</td>` +
        `<td><button class="unpin-btn" data-id="${escape(p.id)}">unpin</button></td></tr>`
      ).join('');
      tbody.querySelectorAll('.unpin-btn').forEach((btn) => {
        btn.addEventListener('click', async (ev) => {
          const id = Number(ev.target.dataset.id);
          ev.target.disabled = true;
          ev.target.textContent = '...';
          try {
            await api('/api/unpin', { method: 'POST', body: { summaryId: id } });
            await loadPinned();
          } catch (err) { ev.target.textContent = 'failed'; }
        });
      });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">failed: ' + escape(e.message) + '</td></tr>';
    }
  }

  // ─── Sessions tab: list + click to replay ────────────────────────────────────
  async function loadSessions() {
    const tbody = document.getElementById('sessions-body');
    tbody.innerHTML = '<tr><td colspan="6" class="empty">loading...</td></tr>';
    document.getElementById('replay-panel').innerHTML = '';
    try {
      const { data } = await api('/api/sessions?limit=50');
      if (!data.sessions || data.sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">no sessions yet</td></tr>';
        return;
      }
      tbody.innerHTML = data.sessions.map((s) => {
        const short = s.sessionId.length > 12 ? s.sessionId.slice(0, 12) + '…' : s.sessionId;
        return `<tr class="session-row" data-id="${escape(s.sessionId)}">` +
          `<td title="${escape(s.sessionId)}">${escape(short)}</td>` +
          `<td>${fmt.num(s.eventCount)}</td>` +
          `<td>${escape(fmt.when(s.firstTs))}</td>` +
          `<td>${escape(fmt.when(s.lastTs))}</td>` +
          `<td title="${escape(s.cwd ?? '')}">${escape(s.cwd ? shortPath(s.cwd) : '')}</td>` +
          `<td><button class="replay-btn" data-id="${escape(s.sessionId)}">replay</button></td></tr>`;
      }).join('');
      tbody.querySelectorAll('.replay-btn').forEach((btn) => {
        btn.addEventListener('click', async (ev) => {
          await runReplay(ev.target.dataset.id);
        });
      });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">failed: ' + escape(e.message) + '</td></tr>';
    }
  }

  function shortPath(p) {
    const parts = p.split('/').filter(Boolean);
    if (parts.length <= 3) return p;
    return '…/' + parts.slice(-3).join('/');
  }

  async function runReplay(sessionId) {
    const panel = document.getElementById('replay-panel');
    panel.innerHTML = '<div class="empty">loading replay...</div>';
    try {
      const { data } = await api('/api/replay', { method: 'POST', body: { sessionId, limit: 50 } });
      if (!data.events.length) {
        panel.innerHTML = '<div class="empty">no events in this session</div>';
        return;
      }
      panel.innerHTML = `<h3>Replay: ${escape(sessionId)}</h3>` +
        '<ul class="replay-list">' +
        data.events.map((e) => {
          const sym = (e.symbols ?? []).join(', ');
          const sumText = e.summary && e.summary.text ? `<div class="replay-sum">→ ${escape(e.summary.text)}</div>` : '';
          return `<li><span class="tag ${escape(e.status)}">${escape(e.tool)}</span> ` +
            `<span class="muted">#${escape(e.eventId)}  ${escape(fmt.when(e.ts))}</span> ` +
            (sym ? `<span class="muted">[${escape(sym)}]</span>` : '') +
            sumText + '</li>';
        }).join('') +
        '</ul>';
    } catch (e) {
      panel.innerHTML = '<div class="empty">failed: ' + escape(e.message) + '</div>';
    }
  }

  // ─── Symbol search tab ───────────────────────────────────────────────────────
  document.getElementById('symbol-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const q = document.getElementById('symbol-q').value.trim();
    const k = parseInt(document.getElementById('symbol-k').value, 10) || 10;
    const tbody = document.getElementById('symbol-body');
    if (!q) { tbody.innerHTML = ''; return; }
    tbody.innerHTML = '<tr><td colspan="4" class="empty">searching...</td></tr>';
    try {
      const { data } = await api('/api/symbol-search', { method: 'POST', body: { query: q, k } });
      if (!data.hits.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">no symbol matches — symbols populate asynchronously after capture</td></tr>';
        return;
      }
      tbody.innerHTML = data.hits.map((h) =>
        `<tr><td>#${escape(h.eventId)}</td>` +
        `<td>${escape(h.tool)}</td>` +
        `<td>${escape((h.symbols ?? []).join(', '))}</td>` +
        `<td>${escape(h.text ?? '–')}</td></tr>`
      ).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty">failed: ' + escape(e.message) + '</td></tr>';
    }
  });

  // ─── Graph tab: subgraph extraction + hub list ───────────────────────────────
  let graphHubsLoaded = false;
  async function loadGraphTab() {
    if (!graphHubsLoaded) {
      await loadHubs();
      graphHubsLoaded = true;
    }
  }

  async function loadHubs() {
    const tbody = document.getElementById('hubs-body');
    tbody.innerHTML = '<tr><td colspan="2" class="empty">loading...</td></tr>';
    try {
      const kind = document.getElementById('hubs-kind').value.trim();
      const path = '/api/graph/hubs?limit=20' + (kind ? '&kind=' + encodeURIComponent(kind) : '');
      const { data } = await api(path);
      if (!data.hubs.length) {
        tbody.innerHTML = '<tr><td colspan="2" class="empty">no edges yet — graph populates as provenance is recorded</td></tr>';
        return;
      }
      tbody.innerHTML = data.hubs.map((h) => {
        const idShort = h.node.id.length > 32 ? h.node.id.slice(0, 32) + '…' : h.node.id;
        return `<tr class="hub-row" data-kind="${escape(h.node.kind)}" data-id="${escape(h.node.id)}">` +
          `<td title="${escape(h.node.kind + ':' + h.node.id)}"><span class="muted">${escape(h.node.kind)}:</span>${escape(idShort)}</td>` +
          `<td>${fmt.num(h.degree)}<span class="muted"> (${h.outDegree}/${h.inDegree})</span></td></tr>`;
      }).join('');
      tbody.querySelectorAll('.hub-row').forEach((tr) => {
        tr.addEventListener('click', () => {
          document.getElementById('graph-kind').value = tr.dataset.kind;
          document.getElementById('graph-id').value = tr.dataset.id;
          document.getElementById('graph-form').dispatchEvent(new Event('submit', { cancelable: true }));
        });
      });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="2" class="empty">failed: ' + escape(e.message) + '</td></tr>';
    }
  }

  document.getElementById('hubs-kind').addEventListener('change', loadHubs);

  document.getElementById('graph-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const kind = document.getElementById('graph-kind').value.trim();
    const id = document.getElementById('graph-id').value.trim();
    const direction = document.getElementById('graph-direction').value;
    const maxDepth = parseInt(document.getElementById('graph-depth').value, 10) || 2;
    const edgeType = document.getElementById('graph-edge-type').value.trim();
    const summary = document.getElementById('graph-summary');
    const tbody = document.getElementById('graph-body');
    if (!kind || !id) {
      summary.className = 'empty';
      summary.textContent = 'kind and id are required.';
      return;
    }
    summary.className = '';
    summary.textContent = 'loading subgraph...';
    tbody.innerHTML = '';
    try {
      const body = { kind, id, direction, maxDepth, maxEdges: 200 };
      if (edgeType) body.edgeType = edgeType;
      const { data } = await api('/api/graph/subgraph', { method: 'POST', body });
      summary.textContent = `${data.nodes.length} nodes, ${data.edges.length} edges around ${kind}:${id}`;
      if (!data.edges.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">no edges in this neighbourhood</td></tr>';
        return;
      }
      tbody.innerHTML = data.edges.map((e) => {
        const fromShort = shortId(e.from.id);
        const toShort = shortId(e.to.id);
        const fromCell = `<a class="node-link" data-kind="${escape(e.from.kind)}" data-id="${escape(e.from.id)}" title="${escape(e.from.id)}"><span class="muted">${escape(e.from.kind)}:</span>${escape(fromShort)}</a>`;
        const toCell = `<a class="node-link" data-kind="${escape(e.to.kind)}" data-id="${escape(e.to.id)}" title="${escape(e.to.id)}"><span class="muted">${escape(e.to.kind)}:</span>${escape(toShort)}</a>`;
        return `<tr><td>${fromCell}</td>` +
          `<td><span class="tag">${escape(e.edgeType)}</span></td>` +
          `<td>${toCell}</td>` +
          `<td>${escape(Number(e.confidence).toFixed(2))}</td></tr>`;
      }).join('');
      tbody.querySelectorAll('.node-link').forEach((a) => {
        a.addEventListener('click', () => {
          document.getElementById('graph-kind').value = a.dataset.kind;
          document.getElementById('graph-id').value = a.dataset.id;
          document.getElementById('graph-form').dispatchEvent(new Event('submit', { cancelable: true }));
        });
      });
    } catch (e) {
      summary.textContent = 'failed: ' + e.message;
    }
  });

  function shortId(s) {
    if (s.length <= 40) return s;
    return s.slice(0, 18) + '…' + s.slice(-18);
  }

  refreshAll();
  setInterval(loadHealth, 15000);
})();
