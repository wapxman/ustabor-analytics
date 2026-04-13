// Override: полная версия renderKPI и calcKPI со всеми 12 метриками + развёрнутая таблица

function calcKPI(data) {
  const h = (data.h || []).map(x => String(x || '').trim().toLowerCase());
  const find = (keywords) => { for (const kw of keywords) { const idx = h.findIndex(c => c.includes(kw)); if (idx >= 0) return idx } return -1 };
  const cols = {
    zayvki: find(['заявк']), otkliki: find(['отклик']),
    klPlatn: find(['клик', 'платн']), klBespl: find(['клик', 'бесплатн']),
    klObsh: find(['общие клик', 'общ']), regUsers: find(['зарегист', 'пользовател', 'регистр']),
    coefClick: find(['коэффициент', 'коэф']), spisZay: find(['списан', 'заявк']),
    spisClick: find(['списан', 'клик']), spisAll: find(['списан', 'средств']),
    avgPrice: find(['средн', 'цена']), popoln: find(['пополн']),
  };
  if (cols.zayvki < 0) cols.zayvki = 3; if (cols.otkliki < 0) cols.otkliki = 4;
  if (cols.spisZay < 0) cols.spisZay = 5; if (cols.klBespl < 0) cols.klBespl = 6;
  if (cols.klPlatn < 0) cols.klPlatn = 7; if (cols.spisClick < 0) cols.spisClick = 8;
  if (cols.klObsh < 0) cols.klObsh = 9;

  let zayvki=0,otkliki=0,klPlatn=0,klBespl=0,klObsh=0,regUsers=0,spisZay=0,spisClick=0,spisAll=0,popoln=0;
  let coefClickSum=0,avgPriceSum=0,rowCount=0;
  data.d.forEach(r => {
    zayvki+=pN(r[cols.zayvki]);otkliki+=pN(r[cols.otkliki]);klPlatn+=pN(r[cols.klPlatn]);
    klBespl+=pN(r[cols.klBespl]);klObsh+=pN(r[cols.klObsh]);
    if(cols.regUsers>=0)regUsers+=pN(r[cols.regUsers]);
    spisZay+=pN(r[cols.spisZay]);spisClick+=pN(r[cols.spisClick]);
    if(cols.spisAll>=0)spisAll+=pN(r[cols.spisAll]);
    if(cols.coefClick>=0){coefClickSum+=pN(r[cols.coefClick]);rowCount++}
    if(cols.avgPrice>=0)avgPriceSum+=pN(r[cols.avgPrice]);
    if(cols.popoln>=0)popoln+=pN(r[cols.popoln]);
  });
  if(spisAll===0)spisAll=spisZay+spisClick;
  const coefClick=rowCount>0?coefClickSum/rowCount:0;
  const avgPrice=rowCount>0?avgPriceSum/rowCount:0;
  const coefOtklika=zayvki>0?otkliki/zayvki:0;
  const sootnPlatBespl=klObsh>0?((klPlatn/klObsh)*100):0;
  return{zayvki,otkliki,klPlatn,klBespl,klObsh,regUsers,coefClick,coefOtklika,sootnPlatBespl,spisZay,spisClick,spisAll,avgPrice,popoln};
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
  const yearSet = new Set(); allKeys.forEach(k => yearSet.add(parseInt(k.split('-')[0])));
  const years = [...yearSet].sort();
  if (!years.includes(kpiYear)) kpiYear = years[years.length - 1];
  document.getElementById('yf-kpi').innerHTML = years.map(y => `<button class="f-btn${y===kpiYear?' active':''}" onclick="setKpiYear(${y})">${y}</button>`).join('');
  document.getElementById('kpi-yr-title').textContent = kpiYear;
  const yearKeys = allKeys.filter(k => k.startsWith(kpiYear + '-')).sort();
  const avM = yearKeys.map(k => parseInt(k.split('-')[1]));
  let mpp = `<button class="mp all${kpiSelMonths===null?' active':''}" onclick="kpiSelMonths=null;renderKPI()">Все</button>`;
  avM.forEach(m => { mpp += `<button class="mp${kpiSelMonths&&kpiSelMonths.includes(m)?' active':''}" onclick="toggleKpiMonth(${m})">${MS[m-1]}</button>` });
  document.getElementById('kpi-month-pills').innerHTML = mpp;
  let fKeys = yearKeys;
  if (kpiSelMonths) fKeys = yearKeys.filter(k => { const m = parseInt(k.split('-')[1]); return kpiSelMonths.includes(m) });
  if (!fKeys.length) { document.getElementById('kpi-dash').innerHTML = '<div class="loading">Нет данных</div>'; return }

  const months = [];
  fKeys.forEach(key => { const kpi = calcKPI(store[key]); const m = parseInt(key.split('-')[1]); months.push({ key, month: m, label: MF[m-1], ...kpi }) });
  const sum = (f) => months.reduce((s, m) => s + m[f], 0);
  const tZ=sum('zayvki'),tO=sum('otkliki'),tKP=sum('klPlatn'),tKB=sum('klBespl'),tKO=sum('klObsh'),tRU=sum('regUsers'),tSZ=sum('spisZay'),tSC=sum('spisClick'),tSA=sum('spisAll'),tPop=sum('popoln');

  document.getElementById('kpi-sub').textContent = MF[avM[0]-1] + ' — ' + MF[avM[avM.length-1]-1] + ' · ' + kpiYear;

  // Top metrics cards
  let h = `<div class="metrics-grid">
    <div class="mc"><div class="l">Заявки</div><div class="v vb">${fmt(tZ)}</div><div class="c c-neutral">${months.length} мес.</div></div>
    <div class="mc"><div class="l">Отклики</div><div class="v vg">${fmt(tO)}</div><div class="c c-neutral">коэф. ${tZ>0?(tO/tZ).toFixed(2):'-'}</div></div>
    <div class="mc"><div class="l">Общие клики</div><div class="v vp">${fmt(tKO)}</div><div class="c c-neutral">плат.+бесп.</div></div>
    <div class="mc"><div class="l">Списания</div><div class="v va">${fmtM(tSA)}</div><div class="c c-neutral">сум</div></div>
  </div>`;

  // === PIVOTED TABLE: metrics as rows, months as columns ===
  const metricRows = [
    { name: 'Заявки', key: 'zayvki', fmt: 'int', bold: true },
    { name: 'Отклики', key: 'otkliki', fmt: 'int', bold: true },
    { name: 'Коэф. отклика', key: 'coefOtklika', fmt: 'dec2', noDelta: true },
    { name: 'Клики платных', key: 'klPlatn', fmt: 'int' },
    { name: 'Клики бесплатных', key: 'klBespl', fmt: 'int' },
    { name: 'Общие клики', key: 'klObsh', fmt: 'int', bold: true },
    { name: 'Соотн. плат./бесп.', key: 'sootnPlatBespl', fmt: 'pct', noDelta: true },
    { name: 'Списание за заявки', key: 'spisZay', fmt: 'money' },
    { name: 'Списание за клики', key: 'spisClick', fmt: 'money' },
    { name: 'Списание всего', key: 'spisAll', fmt: 'money', bold: true },
    { name: 'Ср. цена клика', key: 'avgPrice', fmt: 'int' },
    { name: 'Пополнения', key: 'popoln', fmt: 'money' },
    { name: 'Регистрации', key: 'regUsers', fmt: 'int' },
  ];

  function fmtCell(v, f) {
    if (f === 'dec2') return v.toFixed(2);
    if (f === 'pct') return v.toFixed(2) + '%';
    if (f === 'money') return fmt(Math.round(v));
    return fmt(Math.round(v));
  }

  h += `<div class="tb"><h3>KPI — ${kpiYear}</h3><div style="overflow-x:auto"><table class="kpi-tbl"><thead><tr><th style="min-width:180px;position:sticky;left:0;background:#16161e;z-index:2">Показатель</th>`;
  months.forEach((m, i) => {
    h += `<th class="n">${m.label}</th>`;
    if (i > 0) h += `<th class="n" style="font-size:.65rem;color:#6e6e73">Δм</th>`;
    else h += `<th class="n" style="font-size:.65rem;color:#6e6e73"></th>`;
  });
  h += `</tr></thead><tbody>`;

  metricRows.forEach(mr => {
    h += `<tr><td style="font-weight:${mr.bold?'600':'400'};position:sticky;left:0;background:#16161e;z-index:1;font-size:.75rem">${mr.name}</td>`;
    months.forEach((m, i) => {
      const v = m[mr.key] || 0;
      h += `<td class="n" style="${mr.bold?'font-weight:600':''}">${fmtCell(v, mr.fmt)}</td>`;
      // Delta column
      if (i > 0 && !mr.noDelta) {
        const prev = months[i-1][mr.key] || 0;
        if (prev !== 0) {
          const delta = ((v - prev) / prev * 100).toFixed(1);
          const cls = delta > 0 ? 'up' : delta < 0 ? 'dn' : '';
          const sign = delta > 0 ? '+' : '';
          h += `<td class="n"><span class="pch ${cls}">${sign}${delta}%</span></td>`;
        } else {
          h += `<td class="n"></td>`;
        }
      } else {
        h += `<td class="n"></td>`;
      }
    });
    h += `</tr>`;
  });
  h += `</tbody></table></div></div>`;

  // Charts
  const lb = months.map(m => m.label);
  h += `<div class="charts-row">
    <div class="cb"><h3>Заявки и отклики</h3><div class="chart-wrap"><canvas id="kpiC1"></canvas></div></div>
    <div class="cb"><h3>Клики: платные vs бесплатные</h3><div class="chart-wrap"><canvas id="kpiC3"></canvas></div></div>
  </div>`;
  h += `<div class="charts-row">
    <div class="cb"><h3>Списания: заявки vs клики</h3><div class="chart-wrap"><canvas id="kpiC2"></canvas></div></div>
    <div class="cb"><h3>Пополнения и регистрации</h3><div class="chart-wrap"><canvas id="kpiC4"></canvas></div></div>
  </div>`;

  document.getElementById('kpi-dash').innerHTML = h;

  // Render charts
  if (kC1) kC1.destroy(); if (kC2) kC2.destroy();
  kC1 = new Chart(document.getElementById('kpiC1'), {
    type:'bar', data:{labels:lb, datasets:[
      {label:'Заявки '+kpiYear,data:months.map(m=>m.zayvki),backgroundColor:'#2997ff',borderRadius:3},
      {label:'Отклики '+kpiYear,data:months.map(m=>m.otkliki),backgroundColor:'#30d158',borderRadius:3}
    ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc}}}}
  });
  kC2 = new Chart(document.getElementById('kpiC2'), {
    type:'bar', data:{labels:lb, datasets:[
      {label:'За заявки',data:months.map(m=>m.spisZay),backgroundColor:'#64d2ff',borderRadius:3},
      {label:'За клики',data:months.map(m=>m.spisClick),backgroundColor:'#ffd60a',borderRadius:3}
    ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc,callback:v=>fmtM(v)}}}}
  });
  new Chart(document.getElementById('kpiC3'), {
    type:'bar', data:{labels:lb, datasets:[
      {label:'Платные '+kpiYear,data:months.map(m=>m.klPlatn),backgroundColor:'#ff9f0a',borderRadius:3},
      {label:'Бесплатные '+kpiYear,data:months.map(m=>m.klBespl),backgroundColor:'#30d158',borderRadius:3}
    ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{stacked:true,grid:{color:gc},ticks:{color:tc}},y:{stacked:true,grid:{color:gc},ticks:{color:tc}}}}
  });
  new Chart(document.getElementById('kpiC4'), {
    type:'line', data:{labels:lb, datasets:[
      {label:'Пополнения',data:months.map(m=>m.popoln),borderColor:'#ff9f0a',tension:.4,pointRadius:3,borderWidth:2,yAxisID:'y'},
      {label:'Регистрации',data:months.map(m=>m.regUsers),borderColor:'#2997ff',tension:.4,pointRadius:3,borderWidth:2,yAxisID:'y1'}
    ]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc,callback:v=>fmtM(v)}},y1:{position:'right',grid:{drawOnChartArea:false},ticks:{color:tc}}}}
  });
}