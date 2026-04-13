// Пример плагина — вкладка "Тест"
// Чтобы создать новую вкладку, скопируйте этот файл и измените под свои нужды
// Подключите в index.html: <script src="js/tab-example.js"></script>

addTab({
  name: '🧪 Тест',

  init(el) {
    // Вызывается один раз при загрузке страницы
    el.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:0 2rem">
        <div class="report-header">
          <div>
            <h1>Тестовая вкладка</h1>
            <p style="color:#6e6e73;font-size:.9rem;margin-top:.3rem">Это пример плагина — удалите или измените</p>
          </div>
        </div>
        <div class="metrics-grid">
          <div class="mc"><div class="l">ПРИМЕР МЕТРИКИ</div><div class="v vb">123K</div><div class="c c-up">↑ 12.5%</div></div>
          <div class="mc"><div class="l">ЕЩЁ МЕТРИКА</div><div class="v vp">456</div><div class="c c-neutral">demo</div></div>
          <div class="mc"><div class="l">ТРЕТЬЯ</div><div class="v vg">789</div><div class="c c-down">↓ 3.2%</div></div>
          <div class="mc"><div class="l">ЧЕТВЁРТАЯ</div><div class="v va">99.9%</div><div class="c c-neutral">тест</div></div>
        </div>
        <div class="cb">
          <h3>Как создать свой плагин</h3>
          <div style="color:#6e6e73;font-size:.85rem;line-height:1.6">
            <p>1. Создайте файл <code style="color:#2997ff">public/js/tab-yourname.js</code></p>
            <p>2. Вызовите <code style="color:#2997ff">addTab({ name, render, init })</code></p>
            <p>3. Подключите в index.html: <code style="color:#2997ff">&lt;script src="js/tab-yourname.js"&gt;&lt;/script&gt;</code></p>
            <p style="margin-top:.8rem">Доступные утилиты через <code style="color:#2997ff">U.</code>: fmt, fmtM, pN, pctCh, parseCSV, MS, MF, CHCOL</p>
          </div>
        </div>
      </div>
    `;
  },

  render(el) {
    // Вызывается каждый раз когда пользователь переключается на эту вкладку
    // Здесь можно обновлять данные, рендерить графики и т.д.
  }
});
