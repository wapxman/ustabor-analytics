// Плагин: Мастера — статистика регистраций мастеров
let masYear = 2025, masSelMonths = null, maC1, maC2, maC3;

addTab({
  name: 'Мастера',
  init(el) {
    el.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:0 2rem">
        <div class="report-header">
          <div><h1>Мастера — <span id="mas-yr-title">2025</span></h1><p id="mas-sub">Статистика регистраций</p></div>
          <div class="filters" id="yf-mas"></div>
        </div>
        <div id="mas-month-pills"></div>
        <div id="mas-dash"><div class="loading">Загрузите данные на вкладке «Данные мастеров»</div></div>
      </div>`;
  },
  render() { renderMasters() }
});

function setMasYear(y) { masYear = y; masSelMonths = null; renderMasters() }
function toggleMasMonth(m) {
  if (!masSelMonths) masSelMonths = [];
  const i = masSelMonths.indexOf(m);
  if (i >= 0) masSelMonths.splice(i, 1); else masSelMonths.push(m);
  if (!masSelMonths.length) masSelMonths = null;
  renderMasters();
}

function renderMasters() {
  const store = getMasterStore();
  const allKeys = Object.keys(store).sort();
  const dashEl = document.getElementById('mas-dash');
  const pillsEl = document.getElementById('mas-month-pills');
  const filtersEl = document.getElementById('yf-mas');
  if (!dashEl) return;
  if (!allKeys.length) {
    dashEl.innerHTML = '<div class="loading">Загрузите данные на вкладке «Данные мастеров»</div>';
    if (pillsEl) pillsEl.innerHTML = '';
    if (filtersEl) filtersEl.innerHTML = '';
    return;
  }

  const yearSet = new Set();
  allKeys.forEach(k => yearSet.add(parseInt(k.split('-')[0])));
  const years = [...yearSet].sort();
  if (!years.includes(masYear)) masYear = years[years.length - 1];

  // Year buttons
  if (filtersEl) filtersEl.innerHTML = years.map(y =>
    `<button class="f-btn${y===masYear?' active':''}" onclick="setMasYear(${y})">${y}</button>`
  ).join('');
  document.getElementById('mas-yr-title').textContent = masYear;

  // Month data
  const yearKeys = allKeys.filter(k => k.startsWith(masYear + '-')).sort();
  const avM = yearKeys.map(k => parseInt(k.split('-')[1]));

  // Month pills
  if (pillsEl) {
    let mp = `<button class="mp all${masSelMonths===null?' active':''}" onclick="masSelMonths=null;renderMasters()">Все</button>`;
    avM.forEach(m => {
      mp += `<button class="mp${masSelMonths&&masSelMonths.includes(m)?' active':''}" onclick="toggleMasMonth(${m})">${MS[m-1]}</button>`;
    });
    pillsEl.innerHTML = mp;
  }

  let fKeys = yearKeys;
  if (masSelMonths) fKeys = yearKeys.filter(k => { const m = parseInt(k.split('-')[1]); return masSelMonths.includes(m) });
  if (!fKeys.length) { dashEl.innerHTML = '<div class="loading">Нет данных</div>'; return }

  const months = fKeys.map(k => {
    const m = parseInt(k.split('-')[1]);
    return { key: k, month: m, label: MF[m-1], count: store[k] };
  });

  const totalCur = months.reduce((s, m) => s + m.count, 0);
  const pY = masYear - 1;
  const prevByM = {};
  let hasPrev = false, totalPrev = 0;
  months.forEach(m => {
    const pk = `${pY}-${String(m.month).padStart(2,'0')}`;
    if (store[pk]) { prevByM[m.month] = store[pk]; totalPrev += store[pk]; hasPrev = true }
  });

  const chT = hasPrev ? pctCh(totalCur, totalPrev) : { t: '', cls: 'c-neutral' };
  const avgCur = months.length ? Math.round(totalCur / months.length) : 0;
  const maxM = months.reduce((mx, m) => m.count > mx.count ? m : mx, months[0]);
  const minM = months.reduce((mn, m) => m.count < mn.count ? m : mn, months[0]);

  document.getElementById('mas-sub').textContent =
    (masSelMonths ? months.length + ' мес.' : MF[avM[0]-1] + ' — ' + MF[avM[avM.length-1]-1]) + ' ' + masYear + (hasPrev ? ' vs ' + pY : '');

  // Metrics
  let h = `<div class="metrics-grid">
    <div class="mc"><div class="l">Мастеров</div><div class="v vb">${fmtM(totalCur)}</div><div class="c ${chT.cls}">${hasPrev ? 'vs '+pY+' '+chT.t : months.length+' мес.'}</div></div>
    <div class="mc"><div class="l">Сред/мес</div><div class="v vp">${fmt(avgCur)}</div></div>
    <div class="mc"><div class="l">Лучший</div><div class="v vg">${fmt(maxM.count)}</div><div class="c c-neutral">${maxM.label}</div></div>
    <div class="mc"><div class="l">Худший</div><div class="v va">${fmt(minM.count)}</div><div class="c c-neutral">${minM.label}</div></div>
  </div>`;

  // YoY comparison
  if (hasPrev) {
    const avgPrev = Object.keys(prevByM).length ? Math.round(totalPrev / Object.keys(prevByM).length) : 0;
    const chAvg = pctCh(avgCur, avgPrev);
    h += `<div class="compare-box"><h3>${masYear} vs ${pY}</h3><div class="cmp-grid">
      <div class="cmp-card"><div class="cmp-label">Всего мастеров</div><div class="cmp-row"><div class="cmp-val vb">${fmt(totalCur)}</div><span class="cmp-change ${chT.v>0?'up':'down'}">${chT.t}</span></div><div style="font-size:.7rem;color:#6e6e73;margin-top:4px">${pY}: ${fmt(totalPrev)}</div></div>
      <div class="cmp-card"><div class="cmp-label">Среднее в мес.</div><div class="cmp-row"><div class="cmp-val vp">${fmt(avgCur)}</div><span class="cmp-change ${chAvg.v>0?'up':'down'}">${chAvg.t}</span></div><div style="font-size:.7rem;color:#6e6e73;margin-top:4px">${pY}: ${fmt(avgPrev)}</div></div>
    </div></div>`;
  }

  // Charts
  const labels = months.map(m => m.label);
  h += `<div class="charts-row">
    <div class="cb"><h3>Регистрации мастеров${hasPrev ? ' vs '+pY : ''}</h3><div class="chart-wrap"><canvas id="maC1"></canvas></div></div>
    <div class="cb"><h3>Накопительный рост</h3><div class="chart-wrap"><canvas id="maC2"></canvas></div></div>
  </div>`;
  h += `<div class="cb"><h3>Все годы — сравнение</h3><div class="chart-wrap-tall"><canvas id="maC3"></canvas></div></div>`;

  // Table
  h += `<div class="tb"><h3>Мастера — ${masYear}${hasPrev ? ' vs '+pY : ''}</h3>
    <table><thead><tr><th>Месяц</th><th class="n">Мастеров</th>${hasPrev ? '<th class="n">'+pY+'</th><th class="n">Δ%</th>' : ''}<th class="n">% от года</th></tr></thead><tbody>`;
  months.forEach(m => {
    h += `<tr><td>${m.label}</td><td class="n">${fmt(m.count)}</td>`;
    if (hasPrev) {
      const pv = prevByM[m.month];
      if (pv) {
        const ch = pctCh(m.count, pv);
        h += `<td class="n" style="color:#6e6e73">${fmt(pv)}</td><td class="n ${ch.cls}">${ch.t}</td>`;
      } else h += `<td class="n">—</td><td class="n">—</td>`;
    }
    h += `<td class="n">${(m.count/totalCur*100).toFixed(1)}%</td></tr>`;
  });
  h += `<tr class="total"><td>Итого</td><td class="n" style="color:#2997ff">${fmt(totalCur)}</td>`;
  if (hasPrev) { const ch = pctCh(totalCur, totalPrev); h += `<td class="n" style="color:#6e6e73">${fmt(totalPrev)}</td><td class="n ${ch.cls}">${ch.t}</td>` }
  h += `<td class="n">100%</td></tr></tbody></table></div>`;

  dashEl.innerHTML = h;

  // Render charts
  if (maC1) maC1.destroy(); if (maC2) maC2.destroy(); if (maC3) maC3.destroy();

  // Bar chart
  const bds = [{ label: String(masYear), data: months.map(m => m.count), backgroundColor: '#ff9f0a', borderRadius: 4, barPercentage: .6 }];
  if (hasPrev) bds.push({ label: String(pY), data: months.map(m => prevByM[m.month] || 0), backgroundColor: 'rgba(255,159,10,0.25)', borderRadius: 4, barPercentage: .6 });
  maC1 = new Chart(document.getElementById('maC1'), {
    type: 'bar', data: { labels, datasets: bds },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#6e6e73', boxWidth: 12 } } },
      scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6e6e73' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6e6e73' } } } }
  });

  // Cumulative
  let cum = 0;
  const cumD = months.map(m => { cum += m.count; return cum });
  let cumP = 0;
  const cumPrevD = hasPrev ? months.map(m => { cumP += (prevByM[m.month] || 0); return cumP }) : [];
  const cumDS = [{ label: String(masYear), data: cumD, borderColor: '#ff9f0a', backgroundColor: 'rgba(255,159,10,0.1)', fill: true, tension: .4, pointRadius: 3, borderWidth: 2 }];
  if (hasPrev) cumDS.push({ label: String(pY), data: cumPrevD, borderColor: 'rgba(255,159,10,0.3)', borderDash: [5,5], tension: .4, pointRadius: 2, borderWidth: 1.5, fill: false });
  maC2 = new Chart(document.getElementById('maC2'), {
    type: 'line', data: { labels, datasets: cumDS },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#6e6e73', boxWidth: 12 } } },
      scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6e6e73' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6e6e73', callback: v => fmtM(v) } } } }
  });

  // All years
  const ayDS = years.map((yr, yi) => {
    const data = [];
    for (let m = 1; m <= 12; m++) { data.push(store[yr + '-' + String(m).padStart(2,'0')] || 0) }
    return { label: String(yr), data, borderColor: CHCOL[yi % CHCOL.length], tension: .4, pointRadius: 3, borderWidth: 2 };
  });
  maC3 = new Chart(document.getElementById('maC3'), {
    type: 'line', data: { labels: MS, datasets: ayDS },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#6e6e73', boxWidth: 12 } } },
      scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6e6e73' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6e6e73', callback: v => fmtM(v) } } } }
  });
}