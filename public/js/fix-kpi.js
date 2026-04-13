// Override: полная версия renderKPI и calcKPI со всеми 12 метриками

function calcKPI(data) {
  // Читаем заголовки чтобы маппить по имени
  const h = (data.h || []).map(x => String(x || '').trim().toLowerCase());
  const find = (keywords) => {
    for (const kw of keywords) {
      const idx = h.findIndex(c => c.includes(kw));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  // Маппинг колонок
  const cols = {
    zayvki: find(['заявк']),
    otkliki: find(['отклик']),
    klPlatn: find(['клик', 'платн']),
    klBespl: find(['клик', 'бесплатн']),
    klObsh: find(['общие клик', 'общ']),
    regUsers: find(['зарегист', 'пользовател', 'регистр']),
    coefClick: find(['коэффициент', 'коэф']),
    spisZay: find(['списан', 'заявк']),
    spisClick: find(['списан', 'клик']),
    spisAll: find(['списан', 'средств']),
    avgPrice: find(['средн', 'цена']),
    popoln: find(['пополн']),
  };

  // Fallback на индексы если заголовки не нашлись
  if (cols.zayvki < 0) cols.zayvki = 3;
  if (cols.otkliki < 0) cols.otkliki = 4;
  if (cols.spisZay < 0) cols.spisZay = 5;
  if (cols.klBespl < 0) cols.klBespl = 6;
  if (cols.klPlatn < 0) cols.klPlatn = 7;
  if (cols.spisClick < 0) cols.spisClick = 8;
  if (cols.klObsh < 0) cols.klObsh = 9;

  let zayvki=0, otkliki=0, klPlatn=0, klBespl=0, klObsh=0,
      regUsers=0, spisZay=0, spisClick=0, spisAll=0, popoln=0;
  let coefClickSum=0, avgPriceSum=0, rowCount=0;

  data.d.forEach(r => {
    zayvki += pN(r[cols.zayvki]);
    otkliki += pN(r[cols.otkliki]);
    klPlatn += pN(r[cols.klPlatn]);
    klBespl += pN(r[cols.klBespl]);
    klObsh += pN(r[cols.klObsh]);
    if (cols.regUsers >= 0) regUsers += pN(r[cols.regUsers]);
    spisZay += pN(r[cols.spisZay]);
    spisClick += pN(r[cols.spisClick]);
    if (cols.spisAll >= 0) spisAll += pN(r[cols.spisAll]);
    if (cols.coefClick >= 0) { coefClickSum += pN(r[cols.coefClick]); rowCount++ }
    if (cols.avgPrice >= 0) avgPriceSum += pN(r[cols.avgPrice]);
    if (cols.popoln >= 0) popoln += pN(r[cols.popoln]);
  });

  if (spisAll === 0) spisAll = spisZay + spisClick;
  const coefClick = rowCount > 0 ? coefClickSum / rowCount : 0;
  const avgPrice = rowCount > 0 ? avgPriceSum / rowCount : 0;

  return { zayvki, otkliki, klPlatn, klBespl, klObsh, regUsers, coefClick, spisZay, spisClick, spisAll, avgPrice, popoln };
}

function renderKPI() {
  const store = getCoefStore();
  const allKeys = Object.keys(store).sort();
  if (!allKeys.length) {
    document.getElementById('kpi-dash').innerHTML = '<div class="loading">Загрузите данные на вкладке «Коэффициенты»</div>';
    document.getElementById('kpi-month-pills').innerHTML = '';
    document.getElementById('yf-kpi').innerHTML = '';
    return;
  }

  const yearSet = new Set();
  allKeys.forEach(k => yearSet.add(parseInt(k.split('-')[0])));
  const years = [...yearSet].sort();
  if (!years.includes(kpiYear)) kpiYear = years[years.length - 1];

  document.getElementById('yf-kpi').innerHTML = years.map(y =>
    `<button class="f-btn${y===kpiYear?' active':''}" onclick="setKpiYear(${y})">${y}</button>`
  ).join('');
  document.getElementById('kpi-yr-title').textContent = kpiYear;

  const yearKeys = allKeys.filter(k => k.startsWith(kpiYear + '-')).sort();
  const avM = yearKeys.map(k => parseInt(k.split('-')[1]));

  let mpp = `<button class="mp all${kpiSelMonths===null?' active':''}" onclick="kpiSelMonths=null;renderKPI()">Все</button>`;
  avM.forEach(m => {
    mpp += `<button class="mp${kpiSelMonths&&kpiSelMonths.includes(m)?' active':''}" onclick="toggleKpiMonth(${m})">${MS[m-1]}</button>`;
  });
  document.getElementById('kpi-month-pills').innerHTML = mpp;

  let fKeys = yearKeys;
  if (kpiSelMonths) fKeys = yearKeys.filter(k => { const m = parseInt(k.split('-')[1]); return kpiSelMonths.includes(m) });
  if (!fKeys.length) { document.getElementById('kpi-dash').innerHTML = '<div class="loading">Нет данных</div>'; return }

  // Calculate KPI for each month
  const months = [];
  fKeys.forEach(key => {
    const kpi = calcKPI(store[key]);
    const m = parseInt(key.split('-')[1]);
    months.push({ key, month: m, label: MF[m-1], ...kpi });
  });

  const sum = (f) => months.reduce((s, m) => s + m[f], 0);
  const tZ = sum('zayvki'), tO = sum('otkliki'), tKP = sum('klPlatn'), tKB = sum('klBespl'),
        tKO = sum('klObsh'), tRU = sum('regUsers'), tSZ = sum('spisZay'), tSC = sum('spisClick'),
        tSA = sum('spisAll'), tPop = sum('popoln');
  const avgCoef = months.length ? months.reduce((s,m) => s + m.coefClick, 0) / months.length : 0;
  const avgPrc = months.length ? months.reduce((s,m) => s + m.avgPrice, 0) / months.length : 0;

  // Previous year comparison
  const pY = kpiYear - 1;
  const pKeys = allKeys.filter(k => k.startsWith(pY + '-')).sort();
  let hasPrev = false, prevMonths = [];
  if (pKeys.length) {
    const pFilt = kpiSelMonths ? pKeys.filter(k => { const m = parseInt(k.split('-')[1]); return kpiSelMonths.includes(m) }) : pKeys;
    pFilt.forEach(key => {
      const kpi = calcKPI(store[key]);
      const m = parseInt(key.split('-')[1]);
      prevMonths.push({ month: m, ...kpi });
    });
    if (prevMonths.length) hasPrev = true;
  }
  const pSum = (f) => prevMonths.reduce((s, m) => s + m[f], 0);

  document.getElementById('kpi-sub').textContent = MF[avM[0]-1] + ' — ' + MF[avM[avM.length-1]-1] + ' · ' + kpiYear + (hasPrev ? ' vs ' + pY : '');

  // Metrics cards — 4 columns × 3 rows
  const chZ = hasPrev ? pctCh(tZ, pSum('zayvki')) : {t:'',cls:'c-neutral'};
  const chO = hasPrev ? pctCh(tO, pSum('otkliki')) : {t:'',cls:'c-neutral'};
  const chKO = hasPrev ? pctCh(tKO, pSum('klObsh')) : {t:'',cls:'c-neutral'};
  const chSA = hasPrev ? pctCh(tSA, pSum('spisAll')) : {t:'',cls:'c-neutral'};

  let h = `<div class="metrics-grid">
    <div class="mc"><div class="l">Заявки</div><div class="v vb">${fmt(tZ)}</div><div class="c ${chZ.cls}">${hasPrev?'vs '+pY+' '+chZ.t:''}</div></div>
    <div class="mc"><div class="l">Отклики</div><div class="v vg">${fmt(tO)}</div><div class="c ${chO.cls}">${hasPrev?'vs '+pY+' '+chO.t:''}</div></div>
    <div class="mc"><div class="l">Общие клики</div><div class="v vp">${fmt(tKO)}</div><div class="c ${chKO.cls}">${hasPrev?'vs '+pY+' '+chKO.t:''}</div></div>
    <div class="mc"><div class="l">Списания</div><div class="v va">${fmtM(tSA)}</div><div class="c ${chSA.cls}">${hasPrev?'vs '+pY+' '+chSA.t:''}</div></div>
  </div>`;
  h += `<div class="metrics-grid">
    <div class="mc"><div class="l">Клики платные</div><div class="v vp">${fmt(tKP)}</div></div>
    <div class="mc"><div class="l">Клики бесплатные</div><div class="v vg">${fmt(tKB)}</div></div>
    <div class="mc"><div class="l">Регистрации</div><div class="v vb">${fmt(tRU)}</div></div>
    <div class="mc"><div class="l">Пополнения</div><div class="v va">${fmtM(tPop)}</div></div>
  </div>`;
  h += `<div class="metrics-grid">
    <div class="mc"><div class="l">Списания за заявки</div><div class="v" style="color:#64d2ff">${fmtM(tSZ)}</div></div>
    <div class="mc"><div class="l">Списания за клики</div><div class="v" style="color:#ffd60a">${fmtM(tSC)}</div></div>
    <div class="mc"><div class="l">Коэф. клика (ср.)</div><div class="v vp">${avgCoef.toFixed(2)}</div></div>
    <div class="mc"><div class="l">Ср. цена клика</div><div class="v va">${avgPrc.toFixed(0)}</div></div>
  </div>`;

  // Charts
  const lb = months.map(m => m.label);
  h += `<div class="charts-row">
    <div class="cb"><h3>Заявки и отклики</h3><div class="chart-wrap"><canvas id="kpiC1"></canvas></div></div>
    <div class="cb"><h3>Списания: заявки vs клики</h3><div class="chart-wrap"><canvas id="kpiC2"></canvas></div></div>
  </div>`;
  h += `<div class="charts-row">
    <div class="cb"><h3>Клики: платные vs бесплатные</h3><div class="chart-wrap"><canvas id="kpiC3"></canvas></div></div>
    <div class="cb"><h3>Пополнения и регистрации</h3><div class="chart-wrap"><canvas id="kpiC4"></canvas></div></div>
  </div>`;

  // Full table
  h += `<div class="tb"><h3>KPI — ${kpiYear}</h3><div style="overflow-x:auto"><table><thead><tr>
    <th>Месяц</th><th class="n">Заявки</th><th class="n">Отклики</th>
    <th class="n">Кл.плат.</th><th class="n">Кл.бесп.</th><th class="n">Кл.общ.</th>
    <th class="n">Регистр.</th><th class="n">Спис.заяв.</th><th class="n">Спис.клик.</th>
    <th class="n">Спис.общ.</th><th class="n">Пополн.</th>
  </tr></thead><tbody>`;
  months.forEach(m => {
    h += `<tr><td>${m.label}</td>
      <td class="n">${fmt(m.zayvki)}</td><td class="n">${fmt(m.otkliki)}</td>
      <td class="n">${fmt(m.klPlatn)}</td><td class="n">${fmt(m.klBespl)}</td><td class="n">${fmt(m.klObsh)}</td>
      <td class="n">${fmt(m.regUsers)}</td><td class="n">${fmtM(m.spisZay)}</td><td class="n">${fmtM(m.spisClick)}</td>
      <td class="n">${fmtM(m.spisAll)}</td><td class="n">${fmtM(m.popoln)}</td></tr>`;
  });
  h += `<tr class="total"><td>Итого</td>
    <td class="n" style="color:#2997ff">${fmt(tZ)}</td><td class="n" style="color:#30d158">${fmt(tO)}</td>
    <td class="n">${fmt(tKP)}</td><td class="n">${fmt(tKB)}</td><td class="n" style="color:#bf5af2">${fmt(tKO)}</td>
    <td class="n">${fmt(tRU)}</td><td class="n">${fmtM(tSZ)}</td><td class="n">${fmtM(tSC)}</td>
    <td class="n" style="color:#ff9f0a">${fmtM(tSA)}</td><td class="n">${fmtM(tPop)}</td>
  </tr></tbody></table></div></div>`;

  document.getElementById('kpi-dash').innerHTML = h;

  // Render charts
  if (kC1) kC1.destroy(); if (kC2) kC2.destroy();
  let kC3c, kC4c;

  kC1 = new Chart(document.getElementById('kpiC1'), {
    type:'bar', data:{labels:lb, datasets:[
      {label:'Заявки',data:months.map(m=>m.zayvki),backgroundColor:'#2997ff',borderRadius:3},
      {label:'Отклики',data:months.map(m=>m.otkliki),backgroundColor:'#30d158',borderRadius:3}
    ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc}}}}
  });

  kC2 = new Chart(document.getElementById('kpiC2'), {
    type:'bar', data:{labels:lb, datasets:[
      {label:'За заявки',data:months.map(m=>m.spisZay),backgroundColor:'#64d2ff',borderRadius:3},
      {label:'За клики',data:months.map(m=>m.spisClick),backgroundColor:'#ffd60a',borderRadius:3}
    ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc,callback:v=>fmtM(v)}}}}
  });

  kC3c = new Chart(document.getElementById('kpiC3'), {
    type:'bar', data:{labels:lb, datasets:[
      {label:'Платные',data:months.map(m=>m.klPlatn),backgroundColor:'#bf5af2',borderRadius:3},
      {label:'Бесплатные',data:months.map(m=>m.klBespl),backgroundColor:'#30d158',borderRadius:3}
    ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{stacked:true,grid:{color:gc},ticks:{color:tc}},y:{stacked:true,grid:{color:gc},ticks:{color:tc}}}}
  });

  kC4c = new Chart(document.getElementById('kpiC4'), {
    type:'line', data:{labels:lb, datasets:[
      {label:'Пополнения',data:months.map(m=>m.popoln),borderColor:'#ff9f0a',tension:.4,pointRadius:3,borderWidth:2,yAxisID:'y'},
      {label:'Регистрации',data:months.map(m=>m.regUsers),borderColor:'#2997ff',tension:.4,pointRadius:3,borderWidth:2,yAxisID:'y1'}
    ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc,callback:v=>fmtM(v)}},y1:{position:'right',grid:{drawOnChartArea:false},ticks:{color:tc}}}}
  });
}