// Ustabor Plugin System — автозагрузка
const PLUGINS = [
  'js/fix-channels.js',
  'js/fix-kpi.js',
  'js/tab-masters-data.js',
  'js/tab-masters.js',
  'js/tab-unit-economics.js'
];

(function() {
  const pluginRenders = {};
  window.showTab = function(n) {
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === n));
    document.querySelectorAll('.content').forEach(c => c.classList.remove('visible'));
    const el = document.getElementById('tab-' + n);
    if (el) el.classList.add('visible');
    try {
      if(n===2) renderKPI();
      if(n===3) renderDirections();
      if(n===4) renderApp();
      if(n===5) renderCoef();
      if(n===6) renderUserData();
      if(n===7) renderCustomers();
    } catch(e) {}
    if (pluginRenders[n]) pluginRenders[n](el);
  };
  window.addTab = function(cfg) {
    const tabBar = document.querySelector('.tabs-inner');
    const idx = tabBar.children.length;
    const btn = document.createElement('div');
    btn.className = 'tab';
    btn.textContent = cfg.name;
    btn.setAttribute('onclick', 'showTab(' + idx + ')');
    tabBar.appendChild(btn);
    const div = document.createElement('div');
    div.className = 'content';
    div.id = 'tab-' + idx;
    const firstScript = document.body.querySelector('script');
    document.body.insertBefore(div, firstScript);
    if (cfg.render) pluginRenders[idx] = cfg.render;
    if (cfg.init) cfg.init(div);
    return idx;
  };
  window.U = { fmt, fmtM, pN, pctCh, parseCSV, MS, MF, CHCOL, gc: 'rgba(255,255,255,0.04)', tc: '#6e6e73' };
  PLUGINS.forEach(src => { const s = document.createElement('script'); s.src = src; document.body.appendChild(s) });
})();
