// Ustabor Plugin System — загрузчик вкладок-плагинов
// Использование: подключите этот файл + файлы плагинов в index.html
//
// <script src="js/plugins.js"></script>
// <script src="js/tab-masters.js"></script>  <!-- новый плагин -->
//
// Файл плагина (tab-masters.js):
// addTab({
//   name: 'Мастера',
//   render(el) { el.innerHTML = '<h1>Мастера</h1><p>Контент...</p>'; }
// });

(function() {
  const pluginRenders = {};

  // Переопределяем showTab чтобы поддерживать и старые и новые вкладки
  const builtinShow = window.showTab;
  window.showTab = function(n) {
    // Деактивируем все табы
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === n));
    // Скрываем все content
    document.querySelectorAll('.content').forEach(c => c.classList.remove('visible'));
    // Показываем нужный
    const el = document.getElementById('tab-' + n);
    if (el) el.classList.add('visible');
    // Встроенные табы
    try {
      if(n===2) renderKPI();
      if(n===3) renderDirections();
      if(n===4) renderApp();
      if(n===5) renderCoef();
      if(n===6) renderUserData();
      if(n===7) renderCustomers();
    } catch(e) {}
    // Плагины
    if (pluginRenders[n]) pluginRenders[n](el);
  };

  // Глобальная функция для добавления вкладки
  window.addTab = function(cfg) {
    // cfg: { name, render, init }
    const tabBar = document.querySelector('.tabs-inner');
    const idx = tabBar.children.length;

    // Кнопка в таб-баре
    const btn = document.createElement('div');
    btn.className = 'tab';
    btn.textContent = cfg.name;
    btn.setAttribute('onclick', 'showTab(' + idx + ')');
    tabBar.appendChild(btn);

    // Контейнер контента
    const div = document.createElement('div');
    div.className = 'content';
    div.id = 'tab-' + idx;
    // Вставляем перед первым <script> в body
    const firstScript = document.body.querySelector('script');
    document.body.insertBefore(div, firstScript);

    // Регистрируем render
    if (cfg.render) pluginRenders[idx] = cfg.render;

    // Вызываем init если есть
    if (cfg.init) cfg.init(div);

    return idx;
  };

  // Экспортируем утилиты для плагинов
  window.U = {
    fmt: window.fmt,
    fmtM: window.fmtM,
    pN: window.pN,
    pctCh: window.pctCh,
    parseCSV: window.parseCSV,
    MS: window.MS,
    MF: window.MF,
    CHCOL: window.CHCOL,
    gc: 'rgba(255,255,255,0.04)',
    tc: '#6e6e73'
  };
})();
