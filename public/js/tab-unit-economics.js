// Плагин: Unit-экономика
let ueData = null, ueC1, ueC2, ueC3;

addTab({
  name: '💰 Unit-экономика',
  init(el) {
    el.innerHTML = `<div style="max-width:1200px;margin:0 auto;padding:0 2rem">
      <div class="report-header"><div><h1>Unit-экономика</h1><p id="ue-sub">Загрузите Excel файл</p></div></div>
      <div id="ue-drop" class="drop-zone" onclick="document.getElementById('ue-input').click()">
        <div class="icon">💰</div><h3>Перетащите Excel файл сюда</h3>
        <p>Ustabor_Unit_Economics.xlsx</p>
        <input type="file" id="ue-input" accept=".xlsx,.xls" style="display:none">
      </div>
      <div id="ue-dash"></div>
    </div>`;
    const dz = document.getElementById('ue-drop');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over') });
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); loadUEFile(e.dataTransfer.files[0]) });
    document.getElementById('ue-input').addEventListener('change', e => { loadUEFile(e.target.files[0]); e.target.value = '' });
    // Load from localStorage
    try { ueData = JSON.parse(localStorage.getItem('ustabor_ue')); } catch(e) {}
    if (ueData) renderUE();
  },
  render() { if (ueData) renderUE() }
});

async function loadUEFile(file) {
  if (!file) return;
  const wb = XLSX.read(await file.arrayBuffer(), {type:'array'});
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, {header:1});
  if (rows.length < 2) return;
  const hdr = rows[0];
  const months = [];
  for (let i = 1; i < hdr.length; i++) {
    const h = String(hdr[i]||'').trim();
    if (h.toLowerCase().includes('итого') || h.toLowerCase().includes('комментар')) break;
    months.push(h);
  }
  const metrics = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row[0]) continue;
    const name = String(row[0]).trim();
    const values = [];
    for (let i = 1; i <= months.length; i++) values.push(typeof row[i] === 'number' ? row[i] : parseFloat(String(row[i]||'0').replace(/\s/g,'').replace(',','.'))||0);
    const total = typeof row[months.length+1] === 'number' ? row[months.length+1] : values.reduce((s,v)=>s+v,0);
    const comment = row[months.length+2] ? String(row[months.length+2]).trim() : '';
    metrics.push({ name, values, total, comment });
  }
  ueData = { months, metrics, file: file.name };
  localStorage.setItem('ustabor_ue', JSON.stringify(ueData));
  renderUE();
}

function fmtUE(v) {
  if (Math.abs(v) >= 1e6) return (v/1e6).toFixed(1)+'M';
  if (Math.abs(v) >= 1e3) return (v/1e3).toFixed(1)+'K';
  if (Math.abs(v) < 10 && v !== 0) return v.toFixed(2);
  return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');
}

function renderUE() {
  if (!ueData || !ueData.metrics) return;
  const {months, metrics} = ueData;
  document.getElementById('ue-sub').textContent = months[0] + ' – ' + months[months.length-1] + ' · ' + (ueData.file||'');

  // Find key metrics by index
  const mRevenue = metrics.find(m => m.name.includes('Выручка'));
  const mEBITDA = metrics.find(m => m.name.includes('EBITDA'));
  const mGross = metrics.find(m => m.name.includes('Валовая'));
  const mCAC = metrics.find(m => m.name.includes('CAC'));
  const mARPU = metrics.find(m => m.name.includes('ARPU'));
  const mCPA = metrics.find(m => m.name.includes('CPA'));
  const mUsers = metrics.find(m => m.name.includes('пользователей') && m.name.includes('регистрации'));
  const mMasters = metrics.find(m => m.name.includes('мастеров') && m.name.includes('регистрации'));
  const mTrueMargin = metrics.find(m => m.name.includes('Истинная'));
  const mOPEX = metrics.find(m => m.name.includes('OPEX'));

  // Metrics cards
  const last = months.length - 1;
  let h = `<div class="metrics-grid">`;
  if (mRevenue) h += `<div class="mc"><div class="l">Выручка</div><div class="v vb">$${fmtUE(mRevenue.total)}</div><div class="c c-neutral">за период</div></div>`;
  if (mGross) h += `<div class="mc"><div class="l">Валовая прибыль</div><div class="v vg">$${fmtUE(mGross.total)}</div><div class="c c-neutral">${mRevenue?((mGross.total/mRevenue.total*100).toFixed(0)+'% маржа'):''}</div></div>`;
  if (mEBITDA) h += `<div class="mc"><div class="l">EBITDA</div><div class="v ${mEBITDA.total>=0?'vg':'va'}">$${fmtUE(mEBITDA.total)}</div><div class="c c-neutral">burn rate</div></div>`;
  if (mCAC) h += `<div class="mc"><div class="l">CAC мастера (сред.)</div><div class="v vp">$${fmtUE(mCAC.total/months.length)}</div></div>`;
  h += `</div>`;

  // Second row
  h += `<div class="metrics-grid">`;
  if (mARPU) h += `<div class="mc"><div class="l">ARPU (последний мес.)</div><div class="v vb">$${mARPU.values[last].toFixed(2)}</div><div class="c c-up">↑ ${((mARPU.values[last]/mARPU.values[0]-1)*100).toFixed(0)}% за период</div></div>`;
  if (mCPA) h += `<div class="mc"><div class="l">CPA (средний)</div><div class="v vp">$${(mCPA.total/months.length).toFixed(2)}</div></div>`;
  if (mUsers) h += `<div class="mc"><div class="l">Новых пользователей</div><div class="v vg">${fmtUE(mUsers.total)}</div></div>`;
  if (mMasters) h += `<div class="mc"><div class="l">Новых мастеров</div><div class="v va">${fmtUE(mMasters.total)}</div></div>`;
  h += `</div>`;

  // Charts
  const labels = months.map(m => m.replace(/\s*\d{4}/, ''));
  h += `<div class="charts-row"><div class="cb"><h3>Выручка vs OPEX vs EBITDA</h3><div class="chart-wrap-tall"><canvas id="ueC1"></canvas></div></div>`;
  h += `<div class="cb"><h3>CAC / CPA / ARPU</h3><div class="chart-wrap-tall"><canvas id="ueC2"></canvas></div></div></div>`;
  h += `<div class="cb"><h3>Маржинальность</h3><div class="chart-wrap"><canvas id="ueC3"></canvas></div></div>`;

  // Full table
  h += `<div class="tb"><h3>Unit-экономика — детали</h3><div style="overflow-x:auto"><table><thead><tr><th style="min-width:280px;position:sticky;left:0;background:#16161e;z-index:1">Метрика</th>`;
  months.forEach(m => { h += `<th class="n">${m.replace(/\s*\d{4}/,'')}</th>` });
  h += `<th class="n" style="font-weight:700">ИТОГО</th></tr></thead><tbody>`;
  const highlightRows = ['Выручка','Валовая','EBITDA','Истинная'];
  metrics.forEach(m => {
    const isHL = highlightRows.some(k => m.name.includes(k));
    const isNeg = m.name.includes('EBITDA') || m.name.includes('Истинная');
    h += `<tr style="${isHL?'background:rgba(41,151,255,0.04)':''}">`;
    h += `<td style="font-weight:${isHL?'600':'400'};min-width:280px;position:sticky;left:0;background:${isHL?'#1a1a2e':'#16161e'};z-index:1;font-size:.75rem" title="${m.comment||''}">${m.name}${m.comment?' 💬':''}</td>`;
    m.values.forEach(v => {
      const color = isNeg && v < 0 ? 'color:#ff453a' : isHL ? 'color:#fff' : '';
      h += `<td class="n" style="${color}">${v < 0 ? '-' : ''}$${fmtUE(Math.abs(v))}</td>`;
    });
    const tc2 = isNeg && m.total < 0 ? 'color:#ff453a;font-weight:700' : 'font-weight:700';
    h += `<td class="n" style="${tc2}">${m.total < 0 ? '-' : ''}$${fmtUE(Math.abs(m.total))}</td></tr>`;
  });
  h += `</tbody></table></div></div>`;

  // Comments section
  const withComments = metrics.filter(m => m.comment);
  if (withComments.length) {
    h += `<div class="cb"><h3>💬 Комментарии</h3>`;
    withComments.forEach(m => {
      h += `<div style="margin-bottom:.8rem"><div style="font-size:.78rem;font-weight:600;color:#2997ff;margin-bottom:.2rem">${m.name}</div><div style="font-size:.75rem;color:#6e6e73;line-height:1.5">${m.comment}</div></div>`;
    });
    h += `</div>`;
  }

  // Delete button
  h += `<div style="text-align:center;margin:2rem 0"><button class="f-btn" style="color:#ff453a;border-color:rgba(255,69,58,0.3)" onclick="if(confirm('Удалить?')){localStorage.removeItem('ustabor_ue');ueData=null;document.getElementById('ue-dash').innerHTML=''}">🗑️ Очистить данные</button></div>`;

  document.getElementById('ue-dash').innerHTML = h;

  // Render charts
  if (ueC1) ueC1.destroy(); if (ueC2) ueC2.destroy(); if (ueC3) ueC3.destroy();
  const gc2 = 'rgba(255,255,255,0.04)', tc2 = '#6e6e73';

  // Revenue vs OPEX vs EBITDA
  const ds1 = [];
  if (mRevenue) ds1.push({label:'Выручка',data:mRevenue.values,borderColor:'#30d158',backgroundColor:'rgba(48,209,88,0.1)',fill:true,tension:.4,pointRadius:3,borderWidth:2});
  if (mOPEX) ds1.push({label:'OPEX',data:mOPEX.values,borderColor:'#ff453a',backgroundColor:'rgba(255,69,58,0.1)',fill:true,tension:.4,pointRadius:3,borderWidth:2});
  if (mEBITDA) ds1.push({label:'EBITDA',data:mEBITDA.values,borderColor:'#2997ff',tension:.4,pointRadius:3,borderWidth:2,borderDash:[5,3]});
  ueC1 = new Chart(document.getElementById('ueC1'),{type:'line',data:{labels,datasets:ds1},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc2,boxWidth:12}}},scales:{x:{grid:{color:gc2},ticks:{color:tc2}},y:{grid:{color:gc2},ticks:{color:tc2,callback:v=>'$'+fmtUE(v)}}}}});

  // CAC / CPA / ARPU
  const ds2 = [];
  if (mCAC) ds2.push({label:'CAC мастера',data:mCAC.values,borderColor:'#ff9f0a',tension:.4,pointRadius:3,borderWidth:2});
  if (mCPA) ds2.push({label:'CPA',data:mCPA.values,borderColor:'#bf5af2',tension:.4,pointRadius:3,borderWidth:2});
  if (mARPU) ds2.push({label:'ARPU',data:mARPU.values,borderColor:'#2997ff',tension:.4,pointRadius:3,borderWidth:2});
  ueC2 = new Chart(document.getElementById('ueC2'),{type:'line',data:{labels,datasets:ds2},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc2,boxWidth:12}}},scales:{x:{grid:{color:gc2},ticks:{color:tc2}},y:{grid:{color:gc2},ticks:{color:tc2,callback:v=>'$'+v.toFixed(1)}}}}});

  // Margin bars
  const ds3 = [];
  if (mGross) ds3.push({label:'Валовая прибыль',data:mGross.values,backgroundColor:'#30d158',borderRadius:3});
  if (mTrueMargin) ds3.push({label:'Истинная маржа',data:mTrueMargin.values,backgroundColor:mTrueMargin.values.map(v=>v>=0?'rgba(41,151,255,0.7)':'rgba(255,69,58,0.7)'),borderRadius:3});
  ueC3 = new Chart(document.getElementById('ueC3'),{type:'bar',data:{labels,datasets:ds3},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc2,boxWidth:12}}},scales:{x:{grid:{color:gc2},ticks:{color:tc2}},y:{grid:{color:gc2},ticks:{color:tc2,callback:v=>'$'+fmtUE(v)}}}}});
}