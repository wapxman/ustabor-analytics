# Ustabor AI CEO Аналитика — Полная техническая документация

## Проект
- **Репозиторий:** `wapxman/ustabor-analytics` (GitHub, owner: `wapxman`)
- **Деплой:** https://ustabor-analytics.vercel.app
- **Google Sheets ID:** `1VkQwl1aknuWDExiTqadsvf6FmnLWcUwCEsM_joUAmmk`
- **Таблица:** "USTB - Трафик сайта и приложения"
- **Стек:** Vanilla JS, Chart.js 4.4.1, XLSX.js 0.18.5
- **Дизайн:** Apple-style тёмный, Plus Jakarta Sans

---

## Архитектура файлов

```
public/
  index.html              ← 12KB — HTML-шелл + CSS (НЕ СОДЕРЖИТ JS)
  logo.png, logo1.png     ← логотипы
  loadapp-fix.js          ← устаревший фикс (не используется)
  coefficients/           ← папки 2023-2026 + README
  js/
    main.js               ← 38KB — основная логика 8 встроенных вкладок
    plugins.js            ← 1.7KB — система плагинов + автозагрузка
    fix-channels.js       ← 5.7KB — override renderChannels() с графиками и month pills
    fix-kpi.js            ← 15.6KB — override renderKPI() и calcKPI() с 12 метриками
    tab-masters-data.js   ← 6KB — плагин: загрузка CSV мастеров
    tab-masters.js        ← 9.7KB — плагин: статистика мастеров
    tab-unit-economics.js ← 10.7KB — плагин: Unit-экономика
    tab-example.js        ← 2.4KB — шаблон плагина (можно удалить)
```

---

## Порядок загрузки скриптов

```
1. Chart.js (CDN)        — библиотека графиков
2. XLSX.js (CDN)         — парсинг Excel/CSV
3. js/main.js            — определяет ВСЕ функции и глобальные переменные
4. js/plugins.js         — переопределяет showTab(), определяет addTab(), загружает плагины
   └─ динамически загружает (в порядке массива PLUGINS):
      5. js/fix-channels.js       — переопределяет renderChannels()
      6. js/fix-kpi.js            — переопределяет renderKPI() и calcKPI()
      7. js/tab-masters-data.js   — addTab('Данные мастеров')
      8. js/tab-masters.js        — addTab('Мастера')
      9. js/tab-unit-economics.js — addTab('Unit-экономика')
```

**ВАЖНО:** Порядок в массиве PLUGINS критичен! fix-* файлы ДОЛЖНЫ идти первыми, потому что они переопределяют функции из main.js до того как данные загрузятся из Google Sheets (async).

---

## 11 вкладок

| # | Вкладка | Тип | Файл | Источник данных |
|---|---------|-----|------|-----------------|
| 0 | Трафик сайта | встроенная | main.js | Google Sheets «Каналы» → `AD` |
| 1 | Каналы | встроенная + override | main.js + fix-channels.js | Google Sheets «Каналы» → `AD` |
| 2 | Сводка KPI | встроенная + override | main.js + fix-kpi.js | localStorage `ustabor_coef` |
| 3 | Направления | встроенная | main.js | Google Sheets «Направление» → `DD` |
| 4 | Приложение | встроенная | main.js | Google Sheets «Приложение» → `APD` |
| 5 | Коэффициенты | встроенная | main.js | drag&drop CSV → localStorage `ustabor_coef` |
| 6 | Данные пользователей | встроенная | main.js | drag&drop CSV → localStorage `ustabor_users` |
| 7 | Заказчики | встроенная | main.js | localStorage `ustabor_users` |
| 8 | Данные мастеров | плагин | tab-masters-data.js | drag&drop CSV → localStorage `ustabor_masters` |
| 9 | Мастера | плагин | tab-masters.js | localStorage `ustabor_masters` |
| 10 | Unit-экономика | плагин | tab-unit-economics.js | drag&drop Excel → localStorage `ustabor_ue` |

---

## Глобальные переменные

### Данные из Google Sheets (заполняются async)
| Переменная | Тип | Описание |
|---|---|---|
| `AD` | `{year: {months: {monthNum: {channels:[], total:{}}}}}` | Данные каналов |
| `DD` | `{year: {months: {monthNum: {dirs:[], total:{}}}}}` | Данные направлений |
| `APD` | `{year: {months: {monthNum: {metrics:{}}}}}` | Данные приложения |

### Состояние UI
| Переменная | Тип | Описание |
|---|---|---|
| `curY` | number | Выбранный год (Трафик/Каналы) |
| `selCh` | string/null | Выбранный канал (Каналы) |
| `selMonths` | number[]/null | Выбранные месяцы (Трафик) |
| `chSelMonths` | number[]/null | Выбранные месяцы (Каналы) — в fix-channels.js |
| `dirYear` | number | Выбранный год (Направления) |
| `dirSelMonths` | number[]/null | Выбранные месяцы (Направления) |
| `selDir` | string/null | Выбранное направление |
| `appYear` | number | Выбранный год (Приложение) |
| `appSelMonths` | number[]/null | Выбранные месяцы (Приложение) |
| `coefYear` | number | Выбранный год (Коэффициенты) |
| `kpiYear` | number | Выбранный год (KPI) |
| `kpiSelMonths` | number[]/null | Выбранные месяцы (KPI) |
| `custYear` | number | Выбранный год (Заказчики) |
| `custSelMonths` | number[]/null | Выбранные месяцы (Заказчики) |
| `masYear` | number | Выбранный год (Мастера) — в tab-masters.js |
| `masSelMonths` | number[]/null | Выбранные месяцы (Мастера) — в tab-masters.js |

### Экземпляры Chart.js (для destroy() перед пересозданием)
`c1, c2, c3` — Трафик сайта
`c4, c5` — Каналы
`kC1, kC2` — KPI
`dC1, dC4` — Направления
`aC1` — Приложение
`cuC1, cuC3` — Заказчики
`maC1, maC2, maC3` — Мастера (tab-masters.js)
`ueC1, ueC2, ueC3` — Unit-экономика (tab-unit-economics.js)

### Константы
| Константа | Значение |
|---|---|
| `SHEET_ID` | `1VkQwl1aknuWDExiTqadsvf6FmnLWcUwCEsM_joUAmmk` |
| `MS` | `['Янв','Фев','Мар',...]` — короткие названия месяцев |
| `MF` | `['Январь','Февраль','Март',...]` — полные названия |
| `CHCOL` | 10 цветов для графиков: `['#2997ff','#bf5af2','#30d158',...]` |
| `DIR_ICONS` | `{Строй:'🏗️', Авто:'🚗', Техника:'🔧', Бытовые:'🏠'}` |
| `DIR_COLORS` | `{Строй:'#2997ff', Авто:'#ff9f0a', Техника:'#bf5af2', Бытовые:'#30d158'}` |
| `gc` | `'rgba(255,255,255,0.04)'` — цвет сетки графиков |
| `tc` | `'#6e6e73'` — цвет текста/меток графиков |

---

## Утилиты (глобальные функции из main.js)

| Функция | Описание |
|---|---|
| `fmt(n)` | Число → строка с пробелами: `1234` → `'1 234'` |
| `fmtM(n)` | Число → компактный: `1200` → `'1.2K'`, `1500000` → `'1.5M'` |
| `pN(s)` | Строка → число: `'1 234,5'` → `1234.5` |
| `pC(s)` | Строка процента → число: `'12,5%'` → `12.5` |
| `pctCh(cur, prev)` | Расчёт изменения: возвращает `{v, t, cls}` — `{v:12.5, t:'↑12.5%', cls:'c-up'}` |
| `parseCSV(text)` | Парсинг CSV с поддержкой `"кавычек"` и `;` разделителя |
| `showTab(n)` | Переключение вкладки (ПЕРЕОПРЕДЕЛЕНА в plugins.js) |

---

## Источники данных

### 1. Google Sheets (gviz API)
**URL:** `https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={sheetName}`

**Лист «Каналы»** → `loadData()` → `AD`
- Формат: блоки по месяцам, заголовок `Месяц 2024`, строки каналов, итого
- Колонки: Канал | Посетители | Клики на контакты | Заявки | Конверсия

**Лист «Направление»** → `loadDirectionsData()` → `DD`
- Формат: аналогичный, направления вместо каналов
- Колонки: Направление | Посетители | Просмотры | Клики | Заявки | Конверсия

**Лист «Трафик по месяцам в приложении»** → `loadAppData()` → `APD`
- Формат: плоская таблица, первый столбец = месяц, остальные = метрики
- ВАЖНО: парсер проверяет `c.f` перед `c.v` для заголовков (фикс бага "1615")

### 2. localStorage
| Ключ | Формат | Используется |
|---|---|---|
| `ustabor_coef` | `{"2025-01": {h:[], d:[]}, ...}` | Коэффициенты → KPI |
| `ustabor_users` | `{"2025-01": 4521, ...}` | Регистрации пользователей → Заказчики |
| `ustabor_masters` | `{"2025-01": 892, ...}` | Регистрации мастеров → Мастера |
| `ustabor_ue` | `{months:[], metrics:[], file:''}` | Unit-экономика |

### Формат ustabor_coef (подробно)
```json
{
  "2025-01": {
    "h": ["Направление", "Подкатегория", "Мастер", "Заявки", "Отклики", ...],
    "d": [["Строй", "Сантехник", "Иванов", "15", "22", ...], ...],
    "name": "Январь-2025.csv"
  }
}
```
`h` — заголовки, `d` — строки данных, `name` — имя файла

---

## Система плагинов (plugins.js)

### Как работает
1. `plugins.js` загружается синхронно через `<script src>` в index.html
2. Переопределяет `showTab()` для поддержки плагинных вкладок
3. Создаёт глобальные `addTab()` и `U` (утилиты)
4. Динамически загружает все файлы из массива `PLUGINS`

### Массив PLUGINS (текущий)
```javascript
const PLUGINS = [
  'js/fix-channels.js',       // override renderChannels
  'js/fix-kpi.js',            // override renderKPI + calcKPI
  'js/tab-masters-data.js',   // вкладка: загрузка CSV мастеров
  'js/tab-masters.js',        // вкладка: статистика мастеров
  'js/tab-unit-economics.js'  // вкладка: Unit-экономика
];
```

### addTab(config)
```javascript
addTab({
  name: 'Название вкладки',     // текст кнопки в таб-баре
  init(el) { ... },              // вызывается 1 раз при загрузке (el = div.content)
  render(el) { ... }             // вызывается каждый раз при переключении на вкладку
});
// Возвращает: индекс вкладки (number)
```

### Как добавить новую вкладку
1. Создать файл `public/js/tab-xxx.js`
2. В файле вызвать `addTab({ name, init, render })`
3. Добавить путь в массив `PLUGINS` в `plugins.js`
4. **index.html НЕ трогать**

### Как сделать override существующей функции
1. Создать файл `public/js/fix-xxx.js`
2. В файле переопределить функцию: `function renderXxx() { ... }`
3. Добавить путь в начало массива `PLUGINS` (до tab-* файлов)
4. Override работает потому что: main.js определяет функцию → plugins.js загружает fix-файл → fix-файл переопределяет функцию → когда данные приходят (async), вызывается новая версия

---

## Детали по файлам

### index.html (12KB)
- Только HTML + CSS, **нет inline JS**
- 8 табов в `.tabs-inner` (0-7)
- 8 `.content` div'ов (`tab-0` ... `tab-7`)
- Загружает: Chart.js CDN → XLSX CDN → `js/main.js` → `js/plugins.js`
- CSS классы: `.mc` (metric card), `.cb` (chart box), `.tb` (table box), `.ch-card` (channel card)
- **SHA:** `1393a4c4efe07b81972beacc792af244dee568fe`

### main.js (38KB)
- ВСЕ встроенные функции для вкладок 0-7
- Инициализация: вызывает `renderCoef()`, `renderUserData()`, `loadData()`, `loadDirectionsData()`, `loadAppData()` в конце файла
- **ВАЖНО:** `renderChannels()` и `renderKPI()`/`calcKPI()` здесь УРЕЗАНЫ, реальные версии в fix-*.js
- **SHA:** `68059c1b114efbcd273f7a4ec2f17d71ea654d77`

### fix-channels.js (5.7KB)
- Переопределяет `renderChannels()` с полным функционалом:
  - Month pills (`chSelMonths` — независимый от Трафика фильтр)
  - Кликабельные карточки каналов (selCh)
  - YoY сравнение на карточках
  - Line chart: топ 6 каналов по месяцам
  - Bar chart: заявки выбранного канала
  - Таблица с конверсией и строкой итого
- **SHA:** `84a6ec8e8f59d08a757aca2dd751cdcf7a6ff3a7`

### fix-kpi.js (15.6KB)
- Переопределяет `calcKPI()` — умный маппинг колонок CSV по заголовкам
- Переопределяет `renderKPI()` — полный дашборд:
  - 4 карточки с YoY
  - Compare box (6 метрик: заявки, отклики, клики, списания, пополнения, регистрации)
  - Развёрнутая таблица: 12 метрик × месяцы + Δм + Δг
  - 4 графика: заявки+отклики (с YoY), клики plat/bespl, списания, пополнения+регистрации

**12 метрик KPI (порядок в таблице):**
1. Заявки
2. Клики на платных
3. Клики на бесплатных
4. Общие клики
5. Кол-во зарег. пользователей
6. Коэффициент клика
7. Списание за заявки
8. Списание за клики
9. Списание средства
10. Средняя цена клики
11. Пополнения
12. Отклики на заявку

**Маппинг колонок calcKPI():**
- Ищет по ключевым словам в заголовках CSV: `findCol(['платн'], ['бесплатн'])` — находит "платных" исключая "бесплатных"
- 3 колонки списаний ищутся по вхождению "списан" + контекст (заявк/клик/средств)
- Fallback на жёсткие индексы: zayvki=3, otkliki=4, spisZay=5, klBespl=6, klPlatn=7, spisClick=8, klObsh=9

- **SHA:** `c2592d700b50bc0f99afc8b5c518cafa59afb7c3`

### tab-masters-data.js (6KB)
- Плагин вкладки «Данные мастеров» (вкладка #8)
- Drag&drop зона для CSV файлов
- Автоопределение колонки даты (ищет 'date', 'created_at', 'дата', 'зарегистрирован' и т.д.)
- Подсчёт регистраций по месяцам → `localStorage ustabor_masters`
- Функции: `getMasterStore()`, `saveMasterStore()`, `handleMasterFiles()`, `deleteMasterData()`, `renderMasterData()`
- **SHA:** `4410792066834353dbd69576ccf3064835a24200`

### tab-masters.js (9.7KB)
- Плагин вкладки «Мастера» (вкладка #9)
- Зависит от `getMasterStore()` из tab-masters-data.js (должен загружаться после)
- Фильтры по годам и месяцам (`masYear`, `masSelMonths`)
- YoY compare box + накопительный рост + все годы
- Графики в оранжевых тонах (#ff9f0a)
- Функции: `setMasYear()`, `toggleMasMonth()`, `renderMasters()`
- **SHA:** `796b0c19736e1a62c192685afbe5078a184428e5`

### tab-unit-economics.js (10.7KB)
- Плагин вкладки «Unit-экономика» (вкладка #10)
- Drag&drop зона для Excel файла
- Парсит 17 метрик × 12 месяцев + итого + комментарии
- Данные в `localStorage ustabor_ue`
- 8 карточек: Выручка, Валовая прибыль, EBITDA, CAC, ARPU, CPA, Пользователи, Мастера
- 3 графика: Выручка/OPEX/EBITDA, CAC/CPA/ARPU, Маржинальность
- Полная таблица + секция комментариев
- Функции: `loadUEFile()`, `renderUE()`, `fmtUE()`
- **SHA:** `6c7fe4f891c9d73c94294aa04397edbcf23dc2cf`

### plugins.js (1.7KB)
- Массив `PLUGINS` — список файлов для автозагрузки
- Переопределяет `showTab()` для поддержки плагинных вкладок (idx >= 8)
- `addTab(cfg)` — создаёт tab button + content div + регистрирует render
- `window.U` — экспорт утилит для плагинов
- Динамическая загрузка через `document.createElement('script')`
- **SHA:** `7b0d9937a7dd06fa767636275ffb816ca9237c74`

---

## CSS классы (из index.html)

| Класс | Описание |
|---|---|
| `.mc` | Metric card (карточка метрики) |
| `.mc .l` | Label метрики (uppercase, серый) |
| `.mc .v` | Value метрики (большой шрифт) |
| `.mc .c` | Change/subtitle метрики |
| `.vb .vp .vg .va` | Цвета: blue, purple, green, orange |
| `.c-up .c-down .c-neutral` | Зелёный/красный/серый для изменений |
| `.cb` | Chart box (контейнер графика) |
| `.chart-wrap` | 220px height для графика |
| `.chart-wrap-tall` | 320px height для графика |
| `.tb` | Table box (контейнер таблицы) |
| `.ch-card` | Channel card (кликабельная) |
| `.ch-card.sel` | Выбранный канал (синяя рамка) |
| `.f-btn` | Filter button (год) |
| `.f-btn.active` | Активный фильтр (синий фон) |
| `.mp` | Month pill |
| `.mp.active` | Активный месяц |
| `.mp.all` | Кнопка "Все" |
| `.drop-zone` | Зона drag&drop |
| `.drop-zone.over` | При наведении файла |
| `.compare-box` | Блок сравнения YoY |
| `.cmp-grid` | Сетка внутри compare-box |
| `.cmp-card` | Карточка в сравнении |
| `.kpi-tbl` | Таблица KPI (sticky first col) |
| `.kpi-tbl .pch.up` | Зелёный Δ |
| `.kpi-tbl .pch.dn` | Красный Δ |
| `.metrics-grid` | 4-колоночная сетка метрик |
| `.coef-grid` | 4-колоночная сетка коэффициентов |
| `.loading` | Состояние загрузки |
| `.total td` | Строка итого в таблице |

---

## Цветовая палитра

| Цвет | Hex | Использование |
|---|---|---|
| Синий | `#2997ff` | Посетители, заявки, активный таб, кнопки |
| Фиолетовый | `#bf5af2` | Клики, техника |
| Зелёный | `#30d158` | Заявки (bar), рост, бесплатные клики |
| Оранжевый | `#ff9f0a` | Конверсия, авто, мастера |
| Красный | `#ff453a` | Падение, удаление, EBITDA<0 |
| Голубой | `#64d2ff` | Списания за заявки |
| Жёлтый | `#ffd60a` | Списания за клики |
| Фон | `#0a0a0f` | body background |
| Карточки | `#16161e` | .mc, .cb, .tb background |
| Серый текст | `#6e6e73` | labels, подписи |

---

## Известные ограничения и особенности

1. **main.js содержит урезанные renderChannels() и renderKPI()** — реальные версии в fix-*.js. Если удалить fix-файлы из PLUGINS, вкладки будут работать, но без графиков и YoY.

2. **Плагины загружаются async** — race condition теоретически возможен, но на практике Google Sheets API отвечает через 500ms+, а локальные JS файлы грузятся за <50ms.

3. **GitHub API ограничение** — файлы >100KB сложно пушить через `create_or_update_file`. Поэтому main.js (38KB) + отдельные override-файлы — оптимальная архитектура.

4. **localStorage** — все CSV данные хранятся в браузере пользователя. Очистка кэша = потеря данных. Лимит ~5-10MB.

5. **calcKPI() маппинг** — ищет колонки по ключевым словам в заголовках. ВАЖНО: "платн" матчит и "бесплатных", поэтому используется `findCol(['платн'], ['бесплатн'])` с исключением.

---

## Как безопасно вносить изменения

### Добавить новую вкладку
1. Создать `public/js/tab-xxx.js` с `addTab({...})`
2. Добавить путь в `PLUGINS` массив в `plugins.js`
3. НЕ трогать index.html и main.js

### Исправить существующую вкладку
1. Создать `public/js/fix-xxx.js` с переопределением функции
2. Добавить путь В НАЧАЛО `PLUGINS` массива
3. НЕ трогать main.js

### Добавить новый источник данных
1. Если Google Sheets — добавить `loadXxxData()` в новый fix-файл или плагин
2. Если CSV/Excel — использовать drag&drop паттерн из tab-masters-data.js
3. Хранить в localStorage с ключом `ustabor_xxx`

### Обновить стили
1. Все CSS в `<style>` блоке index.html
2. Плагины наследуют все CSS классы автоматически
