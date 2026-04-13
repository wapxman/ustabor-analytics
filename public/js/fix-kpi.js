// Override: полная Сводка KPI — YoY сравнение + Δм + все 12 метрик

function calcKPI(data) {
  const h = (data.h || []).map(x => String(x || '').trim().toLowerCase());
  function findCol(mustInclude, mustExclude) {
    return h.findIndex(c => {
      const match = mustInclude.every(kw => c.includes(kw));
      const excl = mustExclude ? mustExclude.some(kw => c.includes(kw)) : false;
      return match && !excl;
    });
  }
  function findAny(...kws) { for (const kw of kws) { const i = h.findIndex(c => c.includes(kw)); if (i >= 0) return i } return -1 }
  const C = {
    zayvki: findAny('заявк'),
    klBespl: findCol(['бесплатн'], null),
    klPlatn: findCol(['платн'], ['бесплатн']),
    klObsh: findCol(['общ', 'клик'], null) >= 0 ? findCol(['общ', 'клик'], null) : findCol(['общие'], null),
    regUsers: findAny('зарегист', 'регистр', 'пользовател'),
    coefClick: findAny('коэффициент', 'коэф'),
    avgPrice: findAny('средн'),
    popoln: findAny('пополн'),
    otkliki: findAny('отклик'),
  };
  const allSpis = []; h.forEach((c, i) => { if (c.includes('списан') || c.includes('списание')) allSpis.push(i) });
  let spisZayIdx=-1,spisClickIdx=-1,spisAllIdx=-1;
  if (allSpis.length>=3) {
    allSpis.forEach(idx => { const col=h[idx]; if(col.includes('заявк'))spisZayIdx=idx; else if(col.includes('клик'))spisClickIdx=idx; else if(col.includes('средств')||col.includes('всего')||col.includes('общ'))spisAllIdx=idx });
    if(spisZayIdx<0)spisZayIdx=allSpis[0]; if(spisClickIdx<0)spisClickIdx=allSpis[1]; if(spisAllIdx<0)spisAllIdx=allSpis[2];
  } else if(allSpis.length===2){spisZayIdx=allSpis[0];spisClickIdx=allSpis[1]} else if(allSpis.length===1){spisZayIdx=allSpis[0]}
  C.spisZay=spisZayIdx;C.spisClick=spisClickIdx;C.spisAll=spisAllIdx;
  if(C.zayvki<0)C.zayvki=3;if(C.otkliki<0)C.otkliki=4;if(C.spisZay<0)C.spisZay=5;if(C.klBespl<0)C.klBespl=6;if(C.klPlatn<0)C.klPlatn=7;if(C.spisClick<0)C.spisClick=8;if(C.klObsh<0)C.klObsh=9;

  let zayvki=0,otkliki=0,klPlatn=0,klBespl=0,klObsh=0,regUsers=0,spisZay=0,spisClick=0,spisAll=0,popoln=0;
  let coefClickSum=0,avgPriceSum=0,rowCount=0;
  data.d.forEach(r => {
    zayvki+=pN(r[C.zayvki]);otkliki+=pN(r[C.otkliki]);klPlatn+=pN(r[C.klPlatn]);klBespl+=pN(r[C.klBespl]);klObsh+=pN(r[C.klObsh]);
    if(C.regUsers>=0)regUsers+=pN(r[C.regUsers]);spisZay+=pN(r[C.spisZay]);
    if(C.spisClick>=0)spisClick+=pN(r[C.spisClick]);if(C.spisAll>=0)spisAll+=pN(r[C.spisAll]);
    if(C.coefClick>=0){coefClickSum+=pN(r[C.coefClick]);rowCount++}
    if(C.avgPrice>=0)avgPriceSum+=pN(r[C.avgPrice]);if(C.popoln>=0)popoln+=pN(r[C.popoln]);
  });
  if(spisAll===0)spisAll=spisZay+spisClick;
  return{zayvki,otkliki,klPlatn,klBespl,klObsh,regUsers,coefClick:rowCount>0?coefClickSum/rowCount:0,spisZay,spisClick,spisAll,avgPrice:rowCount>0?avgPriceSum/rowCount:0,popoln};
}

function renderKPI() {
  const store=getCoefStore(); const allKeys=Object.keys(store).sort();
  if(!allKeys.length){document.getElementById('kpi-dash').innerHTML='<div class="loading">Загрузите данные на вкладке «Коэффициенты»</div>';document.getElementById('kpi-month-pills').innerHTML='';document.getElementById('yf-kpi').innerHTML='';return}
  const yearSet=new Set();allKeys.forEach(k=>yearSet.add(parseInt(k.split('-')[0])));const years=[...yearSet].sort();
  if(!years.includes(kpiYear))kpiYear=years[years.length-1];
  document.getElementById('yf-kpi').innerHTML=years.map(y=>`<button class="f-btn${y===kpiYear?' active':''}" onclick="setKpiYear(${y})">${y}</button>`).join('');
  document.getElementById('kpi-yr-title').textContent=kpiYear;
  const yearKeys=allKeys.filter(k=>k.startsWith(kpiYear+'-')).sort();
  const avM=yearKeys.map(k=>parseInt(k.split('-')[1]));
  let mpp=`<button class="mp all${kpiSelMonths===null?' active':''}" onclick="kpiSelMonths=null;renderKPI()">Все</button>`;
  avM.forEach(m=>{mpp+=`<button class="mp${kpiSelMonths&&kpiSelMonths.includes(m)?' active':''}" onclick="toggleKpiMonth(${m})">${MS[m-1]}</button>`});
  document.getElementById('kpi-month-pills').innerHTML=mpp;
  let fKeys=yearKeys;
  if(kpiSelMonths)fKeys=yearKeys.filter(k=>{const m=parseInt(k.split('-')[1]);return kpiSelMonths.includes(m)});
  if(!fKeys.length){document.getElementById('kpi-dash').innerHTML='<div class="loading">Нет данных</div>';return}

  // Current months
  const months=[];
  fKeys.forEach(key=>{const kpi=calcKPI(store[key]);const m=parseInt(key.split('-')[1]);months.push({key,month:m,label:MF[m-1],...kpi})});

  // Previous month for first Δ
  const prevMonthData={};
  if(months.length){const fm=months[0];const pm=fm.month-1;const py=pm<=0?kpiYear-1:kpiYear;const pmn=pm<=0?12:pm;const pk=`${py}-${String(pmn).padStart(2,'0')}`;if(store[pk])prevMonthData[fm.key]=calcKPI(store[pk])}

  // YoY — аналогичный период прошлого года
  const pY=kpiYear-1;
  const selMonthNums=months.map(m=>m.month);
  const prevYearMonths=[];
  selMonthNums.forEach(mn=>{const pk=`${pY}-${String(mn).padStart(2,'0')}`;if(store[pk]){prevYearMonths.push({month:mn,label:MF[mn-1],...calcKPI(store[pk])})}});
  const hasPrev=prevYearMonths.length>0;

  const sum=(arr,f)=>arr.reduce((s,m)=>s+m[f],0);
  const tZ=sum(months,'zayvki'),tO=sum(months,'otkliki'),tKO=sum(months,'klObsh'),tSA=sum(months,'spisAll'),tKP=sum(months,'klPlatn'),tKB=sum(months,'klBespl'),tPop=sum(months,'popoln'),tRU=sum(months,'regUsers'),tSZ=sum(months,'spisZay'),tSC=sum(months,'spisClick');
  const pZ=sum(prevYearMonths,'zayvki'),pO=sum(prevYearMonths,'otkliki'),pKO=sum(prevYearMonths,'klObsh'),pSA=sum(prevYearMonths,'spisAll'),pKP=sum(prevYearMonths,'klPlatn'),pKB=sum(prevYearMonths,'klBespl'),pPop=sum(prevYearMonths,'popoln'),pRU=sum(prevYearMonths,'regUsers'),pSZ=sum(prevYearMonths,'spisZay'),pSC=sum(prevYearMonths,'spisClick');

  const chZ=hasPrev?pctCh(tZ,pZ):{t:'',cls:'c-neutral'};
  const chO=hasPrev?pctCh(tO,pO):{t:'',cls:'c-neutral'};
  const chKO=hasPrev?pctCh(tKO,pKO):{t:'',cls:'c-neutral'};
  const chSA=hasPrev?pctCh(tSA,pSA):{t:'',cls:'c-neutral'};

  document.getElementById('kpi-sub').textContent=MF[avM[0]-1]+' — '+MF[avM[avM.length-1]-1]+' · '+kpiYear+(hasPrev?' vs '+pY:'');

  // Cards with YoY
  let h=`<div class="metrics-grid">
    <div class="mc"><div class="l">Заявки</div><div class="v vb">${fmt(tZ)}</div><div class="c ${chZ.cls}">${hasPrev?'vs '+pY+' '+chZ.t:months.length+' мес.'}</div></div>
    <div class="mc"><div class="l">Отклики</div><div class="v vg">${fmt(tO)}</div><div class="c ${chO.cls}">${hasPrev?'vs '+pY+' '+chO.t:'коэф. '+(tZ>0?(tO/tZ).toFixed(2):'-')}</div></div>
    <div class="mc"><div class="l">Общие клики</div><div class="v vp">${fmt(tKO)}</div><div class="c ${chKO.cls}">${hasPrev?'vs '+pY+' '+chKO.t:'плат.+бесп.'}</div></div>
    <div class="mc"><div class="l">Списания</div><div class="v va">${fmtM(tSA)}</div><div class="c ${chSA.cls}">${hasPrev?'vs '+pY+' '+chSA.t:'сум'}</div></div>
  </div>`;

  // YoY Compare box
  if(hasPrev){
    const chKP=pctCh(tKP,pKP),chKB=pctCh(tKB,pKB),chPop=pctCh(tPop,pPop),chRU=pctCh(tRU,pRU);
    h+=`<div class="compare-box"><h3>${kpiYear} vs ${pY} (${selMonthNums.length===avM.length?'весь год':selMonthNums.length+' мес.'})</h3><div class="cmp-grid">
      <div class="cmp-card"><div class="cmp-label">Заявки</div><div class="cmp-row"><div class="cmp-val vb">${fmt(tZ)}</div><span class="cmp-change ${chZ.v>0?'up':'down'}">${chZ.t}</span></div><div style="font-size:.7rem;color:#6e6e73;margin-top:4px">${pY}: ${fmt(pZ)}</div></div>
      <div class="cmp-card"><div class="cmp-label">Отклики</div><div class="cmp-row"><div class="cmp-val vg">${fmt(tO)}</div><span class="cmp-change ${chO.v>0?'up':'down'}">${chO.t}</span></div><div style="font-size:.7rem;color:#6e6e73;margin-top:4px">${pY}: ${fmt(pO)}</div></div>
      <div class="cmp-card"><div class="cmp-label">Клики платные</div><div class="cmp-row"><div class="cmp-val vp">${fmt(tKP)}</div><span class="cmp-change ${chKP.v>0?'up':'down'}">${chKP.t}</span></div><div style="font-size:.7rem;color:#6e6e73;margin-top:4px">${pY}: ${fmt(pKP)}</div></div>
      <div class="cmp-card"><div class="cmp-label">Списания</div><div class="cmp-row"><div class="cmp-val va">${fmtM(tSA)}</div><span class="cmp-change ${chSA.v>0?'up':'down'}">${chSA.t}</span></div><div style="font-size:.7rem;color:#6e6e73;margin-top:4px">${pY}: ${fmtM(pSA)}</div></div>
      <div class="cmp-card"><div class="cmp-label">Пополнения</div><div class="cmp-row"><div class="cmp-val" style="color:#ff9f0a">${fmtM(tPop)}</div><span class="cmp-change ${chPop.v>0?'up':'down'}">${chPop.t}</span></div><div style="font-size:.7rem;color:#6e6e73;margin-top:4px">${pY}: ${fmtM(pPop)}</div></div>
      <div class="cmp-card"><div class="cmp-label">Регистрации</div><div class="cmp-row"><div class="cmp-val vb">${fmt(tRU)}</div><span class="cmp-change ${chRU.v>0?'up':'down'}">${chRU.t}</span></div><div style="font-size:.7rem;color:#6e6e73;margin-top:4px">${pY}: ${fmt(pRU)}</div></div>
    </div></div>`;
  }

  // Pivoted table
  const metricRows=[
    {name:'Заявки',key:'zayvki',fmt:'int',bold:true},
    {name:'Клики на платных',key:'klPlatn',fmt:'int'},
    {name:'Клики на бесплатных',key:'klBespl',fmt:'int'},
    {name:'Общие клики',key:'klObsh',fmt:'int',bold:true},
    {name:'Кол-во зарег. пользователей',key:'regUsers',fmt:'int'},
    {name:'Коэффициент клика',key:'coefClick',fmt:'dec2'},
    {name:'Списание за заявки',key:'spisZay',fmt:'money',bold:true},
    {name:'Списание за клики',key:'spisClick',fmt:'money',bold:true},
    {name:'Списание средства',key:'spisAll',fmt:'money',bold:true},
    {name:'Средняя цена клики',key:'avgPrice',fmt:'dec1'},
    {name:'Пополнения',key:'popoln',fmt:'money'},
    {name:'Отклики на заявку',key:'otkliki',fmt:'int'},
  ];
  function fmtV(v,f){if(f==='dec2')return v.toFixed(2);if(f==='dec1')return v.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g,' ');if(f==='money')return fmt(Math.round(v));return fmt(Math.round(v))}

  // Build prev year lookup by month
  const prevByMonth={};
  prevYearMonths.forEach(pm=>{prevByMonth[pm.month]=pm});

  h+=`<div class="tb"><h3>KPI — ${kpiYear}</h3><div style="overflow-x:auto"><table class="kpi-tbl"><thead><tr><th style="min-width:200px;position:sticky;left:0;background:#16161e;z-index:2">Показатель</th>`;
  months.forEach(m=>{
    h+=`<th class="n">${m.label}</th><th class="n" style="font-size:.65rem;color:#6e6e73">Δм</th>`;
    if(hasPrev&&prevByMonth[m.month])h+=`<th class="n" style="font-size:.65rem;color:#6e6e73">Δг</th>`;
  });
  h+=`</tr></thead><tbody>`;

  metricRows.forEach(mr=>{
    h+=`<tr><td style="font-weight:${mr.bold?'600':'400'};position:sticky;left:0;background:#16161e;z-index:1;font-size:.75rem">${mr.name}</td>`;
    months.forEach((m,i)=>{
      const v=m[mr.key]||0;
      h+=`<td class="n" style="${mr.bold?'font-weight:600':''}">${fmtV(v,mr.fmt)}</td>`;
      // Δм
      let prev=null;
      if(i>0)prev=months[i-1][mr.key]||0;
      else if(prevMonthData[m.key])prev=prevMonthData[m.key][mr.key]||0;
      if(prev!==null&&prev!==0){const d=((v-prev)/prev*100).toFixed(1);const cls=d>0?'up':d<0?'dn':'';h+=`<td class="n"><span class="pch ${cls}">${d>0?'+':''}${d}%</span></td>`}
      else{h+=`<td class="n"></td>`}
      // Δг (YoY)
      if(hasPrev&&prevByMonth[m.month]){
        const pv=prevByMonth[m.month][mr.key]||0;
        if(pv!==0){const d=((v-pv)/pv*100).toFixed(1);const cls=d>0?'up':d<0?'dn':'';h+=`<td class="n"><span class="pch ${cls}" style="opacity:.7">${d>0?'+':''}${d}%</span></td>`}
        else{h+=`<td class="n"></td>`}
      }
    });
    h+=`</tr>`;
  });
  h+=`</tbody></table></div></div>`;

  // Charts
  const lb=months.map(m=>m.label);
  h+=`<div class="charts-row">
    <div class="cb"><h3>Заявки и отклики${hasPrev?' vs '+pY:''}</h3><div class="chart-wrap"><canvas id="kpiC1"></canvas></div></div>
    <div class="cb"><h3>Клики: платные vs бесплатные</h3><div class="chart-wrap"><canvas id="kpiC3"></canvas></div></div>
  </div>`;
  h+=`<div class="charts-row">
    <div class="cb"><h3>Списания: заявки vs клики</h3><div class="chart-wrap"><canvas id="kpiC2"></canvas></div></div>
    <div class="cb"><h3>Пополнения и регистрации</h3><div class="chart-wrap"><canvas id="kpiC4"></canvas></div></div>
  </div>`;

  document.getElementById('kpi-dash').innerHTML=h;
  if(kC1)kC1.destroy();if(kC2)kC2.destroy();

  // Chart 1: Заявки + Отклики with YoY
  const ds1=[
    {label:'Заявки '+kpiYear,data:months.map(m=>m.zayvki),backgroundColor:'#2997ff',borderRadius:3,barPercentage:.6},
    {label:'Отклики '+kpiYear,data:months.map(m=>m.otkliki),backgroundColor:'#30d158',borderRadius:3,barPercentage:.6}
  ];
  if(hasPrev){
    ds1.push({label:'Заявки '+pY,data:months.map(m=>{const p=prevByMonth[m.month];return p?p.zayvki:0}),backgroundColor:'rgba(41,151,255,0.25)',borderRadius:3,barPercentage:.6});
    ds1.push({label:'Отклики '+pY,data:months.map(m=>{const p=prevByMonth[m.month];return p?p.otkliki:0}),backgroundColor:'rgba(48,209,88,0.25)',borderRadius:3,barPercentage:.6});
  }
  kC1=new Chart(document.getElementById('kpiC1'),{type:'bar',data:{labels:lb,datasets:ds1},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc}}}}});

  kC2=new Chart(document.getElementById('kpiC2'),{type:'bar',data:{labels:lb,datasets:[
    {label:'За заявки',data:months.map(m=>m.spisZay),backgroundColor:'#64d2ff',borderRadius:3},
    {label:'За клики',data:months.map(m=>m.spisClick),backgroundColor:'#ffd60a',borderRadius:3}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc,callback:v=>fmtM(v)}}}}});

  new Chart(document.getElementById('kpiC3'),{type:'bar',data:{labels:lb,datasets:[
    {label:'Платные',data:months.map(m=>m.klPlatn),backgroundColor:'#ff9f0a',borderRadius:3},
    {label:'Бесплатные',data:months.map(m=>m.klBespl),backgroundColor:'#30d158',borderRadius:3}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{stacked:true,grid:{color:gc},ticks:{color:tc}},y:{stacked:true,grid:{color:gc},ticks:{color:tc}}}}});

  new Chart(document.getElementById('kpiC4'),{type:'line',data:{labels:lb,datasets:[
    {label:'Пополнения',data:months.map(m=>m.popoln),borderColor:'#ff9f0a',tension:.4,pointRadius:3,borderWidth:2,yAxisID:'y'},
    {label:'Регистрации',data:months.map(m=>m.regUsers),borderColor:'#2997ff',tension:.4,pointRadius:3,borderWidth:2,yAxisID:'y1'}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,boxWidth:12}}},scales:{x:{grid:{color:gc},ticks:{color:tc}},y:{grid:{color:gc},ticks:{color:tc,callback:v=>fmtM(v)}},y1:{position:'right',grid:{drawOnChartArea:false},ticks:{color:tc}}}}});
}