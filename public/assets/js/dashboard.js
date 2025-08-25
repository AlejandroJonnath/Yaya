(function () {
  // ---------- Utils de DOM ----------
  function $(id) { return document.getElementById(id); }
  function qs(sel, root) { return (root || document).querySelector(sel); }

  // ---------- Estado ----------
  var RAW = { topArtworks: [], topNav: [], recent: [], totals: { allClicks:0, artworkClicks:0, navClicks:0 } };
  var VIEW = { recent: [] };

  // ---------- Helpers ----------
  function mapAction(val){
    switch (val) {
      case 'ver-detalle': return { label: 'Ver detalle', cls: 'info' };
      case 'solicitar-precio': return { label: 'Solicitar precio', cls: 'ok' };
      case 'click': return { label: 'Click', cls: 'info' };
      case 'error': return { label: 'Error', cls: 'err' };
      default: return { label: val || '—', cls: '' };
    }
  }

  function ensureMetaObject(meta){
    if (!meta) return {};
    if (typeof meta === 'object') return meta || {};
    try { return JSON.parse(meta); } catch (e) { return { raw: String(meta) }; }
  }

  function renderActionPill(meta){
    var obj = ensureMetaObject(meta);
    var actionVal = obj.action;
    if (!actionVal) return '';
    var mapped = mapAction(actionVal);
    return (
      '<span class="action-pill ' + mapped.cls + '">' +
        '<span class="dot"></span>' +
        mapped.label +
      '</span>'
    );
  }

  function metaToChips(meta){
    var obj = ensureMetaObject(meta);
    var entries = Object.keys(obj).filter(function(k){ return k !== 'action'; }).map(function(k){ return [k, obj[k]]; });
    if (!entries.length) return '';
    function cls(k, v){
      if (k === 'status') {
        var t = String(v).toLowerCase();
        if (t.indexOf('ok') >= 0) return 'ok';
        if (t.indexOf('warn') >= 0) return 'warn';
        if (t.indexOf('err') >= 0 || t.indexOf('error') >= 0) return 'err';
      }
      return '';
    }
    return '<div class="chips">' + entries.map(function(pair){
      var k = pair[0], v = pair[1];
      var val = (typeof v === 'object') ? JSON.stringify(v) : String(v);
      return '<span class="chip ' + cls(k,val) + '"><span class="k">' + k + ':</span> ' + val + '</span>';
    }).join('') + '</div>';
  }

  function fmtDateLocal(iso){
    try { return new Date(iso).toLocaleString(); } catch (e) { return iso || ''; }
  }
  function fmtDateISO(iso){
    try { return new Date(iso).toISOString(); } catch (e) { return ''; }
  }

  // ---------- KPIs + Tops ----------
  function updateKpiSubs(){
    var all = RAW.totals.allClicks|0;
    var a = RAW.totals.artworkClicks|0;
    var n = RAW.totals.navClicks|0;
    var pct = function (x){ return all ? Math.round((x/all)*100) : 0; };

    if ($('k_all_sub')) $('k_all_sub').textContent = all ? '100% del total' : '';
    if ($('k_art_sub')) $('k_art_sub').textContent = a ? (pct(a) + '% del total') : '';
    if ($('k_nav_sub')) $('k_nav_sub').textContent = n ? (pct(n) + '% del total') : '';
  }

  function renderTops(){
    var la = $('list_artworks');
    var ln = $('list_nav');
    if (la) {
      la.innerHTML = (RAW.topArtworks||[]).map(function(a,i){
        return '<li><span class="badge">' + (i===0?'#1':'#'+(i+1)) + '</span> <strong>' + a.target + '</strong> — ' + a.count + ' clics</li>';
      }).join('');
    }
    if (ln) {
      ln.innerHTML = (RAW.topNav||[]).map(function(a,i){
        return '<li><span class="badge">' + (i===0?'#1':'#'+(i+1)) + '</span> <strong>' + a.target + '</strong> — ' + a.count + ' clics</li>';
      }).join('');
    }
    if ($('art_empty')) $('art_empty').style.display = (RAW.topArtworks && RAW.topArtworks.length) ? 'none' : 'block';
    if ($('nav_empty')) $('nav_empty').style.display = (RAW.topNav && RAW.topNav.length) ? 'none' : 'block';
  }

  // ---------- Filtros + Render tabla ----------
  function applyFilters(){
    var qEl = $('search');
    var tEl = $('typeFilter');
    var lEl = $('limitFilter');

    var q = qEl ? (qEl.value || '').trim().toLowerCase() : '';
    var type = tEl ? (tEl.value || '') : '';
    var limit = lEl ? parseInt(lEl.value || '25', 10) : 25;

    var rows = (RAW.recent || []).slice();

    rows.sort(function(a,b){
      return new Date(b.created_at) - new Date(a.created_at);
    });

    if (type) rows = rows.filter(function(r){ return r.type === type; });
    if (q){
      rows = rows.filter(function(r){
        var metaStr = JSON.stringify(ensureMetaObject(r.meta));
        return (String(r.type||'').toLowerCase().indexOf(q) >= 0) ||
               (String(r.target||'').toLowerCase().indexOf(q) >= 0) ||
               (metaStr.toLowerCase().indexOf(q) >= 0);
      });
    }

    VIEW.recent = rows.slice(0, limit);
    renderRecent();
  }

  function renderRecent(){
    var tbody = qs('#recent tbody');
    if (!tbody) {
      console.warn('[dashboard] No existe tbody #recent');
      return;
    }

    if (!VIEW.recent.length){
      tbody.innerHTML = '';
      if ($('recent_empty')) $('recent_empty').style.display = 'block';
      return;
    }
    if ($('recent_empty')) $('recent_empty').style.display = 'none';

    tbody.innerHTML = VIEW.recent.map(function(r){
      return (
        '<tr>' +
          '<td>' + (r.id != null ? r.id : '') + '</td>' +
          '<td>' + (r.type || '') + '</td>' +
          '<td><strong>' + (r.target || '') + '</strong></td>' +
          '<td>' + renderActionPill(r.meta) + '</td>' +
          '<td>' + metaToChips(r.meta) + '</td>' +
          '<td><small title="' + fmtDateISO(r.created_at) + '">' + fmtDateLocal(r.created_at) + '</small></td>' +
        '</tr>'
      );
    }).join('');
  }

  // ---------- Export CSV ----------
  function exportCsv(){
    var rows = VIEW.recent || [];
    var header = ['id','tipo','destino','accion','meta_otras_claves','fecha_iso','fecha_local'];

    function toMetaRest(metaObj){
      var o = {};
      for (var k in metaObj) { if (Object.prototype.hasOwnProperty.call(metaObj, k)) o[k] = metaObj[k]; }
      if ('action' in o) delete o.action;
      var pairs = [];
      for (var key in o) {
        if (!Object.prototype.hasOwnProperty.call(o, key)) continue;
        var v = o[key];
        var val = (typeof v === 'object') ? JSON.stringify(v) : String(v == null ? '' : v);
        pairs.push(key + '=' + val);
      }
      return pairs.join('; ');
    }

    var data = rows.map(function(r){
      var metaObj = ensureMetaObject(r.meta);
      var mapped = mapAction(metaObj.action);
      return {
        id: r.id != null ? r.id : '',
        tipo: r.type || '',
        destino: r.target || '',
        accion: mapped.label || '',
        meta_otras_claves: toMetaRest(metaObj),
        fecha_iso: fmtDateISO(r.created_at),
        fecha_local: fmtDateLocal(r.created_at)
      };
    });

    data.sort(function(a,b){ return new Date(b.fecha_iso) - new Date(a.fecha_iso); });

    function esc(v){ return '"' + String(v == null ? '' : v).replace(/"/g,'""') + '"'; }
    var csv = '\ufeff' + [header.join(',')].concat(
      data.map(function(row){
        return header.map(function(h){ return esc(row[h]); }).join(',');
      })
    ).join('\n');

    try{
      var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'actividad.csv';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }catch(e){
      console.error('[dashboard] Error exportando CSV', e);
      alert('No se pudo exportar el CSV en este navegador.');
    }
  }

  // ---------- Carga + eventos ----------
  async function fetchStats(){
    try{
      var r = await fetch('/api/stats', { headers: { 'Accept': 'application/json' } });
      if (r.status === 401) { window.location.href = '/login.html'; return; }
      if (!r.ok) {
        console.error('[dashboard] /api/stats respondió', r.status, r.statusText);
        showError('No se pudo cargar el dashboard. Código ' + r.status);
        return;
      }
      var data = await r.json();
      if (!data || !data.ok) {
        console.error('[dashboard] Respuesta inválida', data);
        showError('Respuesta inválida del servidor.');
        return;
      }

      RAW.topArtworks = data.topArtworks || [];
      RAW.topNav = data.topNav || [];
      RAW.recent = (data.recent || []).map(function(row, i){ row.index = i; return row; });
      RAW.totals = data.totals || { allClicks:0, artworkClicks:0, navClicks:0 };

      if ($('k_all')) $('k_all').textContent = RAW.totals.allClicks || 0;
      if ($('k_art')) $('k_art').textContent = RAW.totals.artworkClicks || 0;
      if ($('k_nav')) $('k_nav').textContent = RAW.totals.navClicks || 0;

      updateKpiSubs();
      renderTops();
      applyFilters();

      console.debug('[dashboard] Datos cargados', RAW);
    }catch(err){
      console.error('[dashboard] Error de red', err);
      showError('No hay conexión con el servidor.');
    }
  }

  function showError(msg){
    // Muestra un mensaje visible; no depende de ninguna estructura especial
    var wrap = qs('.wrap') || document.body;
    var div = document.createElement('div');
    div.className = 'empty';
    div.style.marginTop = '10px';
    div.textContent = msg;
    wrap.insertBefore(div, wrap.firstChild || null);
  }

  function bindUI(){
    var logoutBtn = $('logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function(){
        try { await fetch('/api/logout', { method: 'POST' }); } catch(e) {}
        window.location.href = '/';
      });
    }

    var search = $('search');
    var typeF = $('typeFilter');
    var limitF = $('limitFilter');
    var clear = $('clearFilters');
    var exportBtn = $('exportCsv');

    if (search) search.addEventListener('input', applyFilters);
    if (typeF) typeF.addEventListener('change', applyFilters);
    if (limitF) limitF.addEventListener('change', applyFilters);
    if (clear) clear.addEventListener('click', function(){
      if (search) search.value = '';
      if (typeF) typeF.value = '';
      if (limitF) limitF.value = '25';
      applyFilters();
    });
    if (exportBtn) exportBtn.addEventListener('click', exportCsv);
  }

  // ---------- Arranque cuando el DOM está listo ----------
  function start(){
    bindUI();
    fetchStats();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    // si el script está al final, igual corremos
    start();
  }
})();
