// Override: полная версия renderChannels с month pills, графиками, YoY и кликабельными карточками
let chSelMonths = null;

function toggleChMonth(m) {
  if (!chSelMonths) chSelMonths = [];
  const i = chSelMonths.indexOf(m);
  if (i >= 0) chSelMonths.splice(i, 1); else chSelMonths.push(m);
  if (!chSelMonths.length) chSelMonths = null;
  renderChannels();
}

function renderChannels(){
  const yd = AD[curY];
  if (!yd) { document.getElementById('channels-dash').innerHTML='<div class="loading">Нет данных</div>'; return }
  const allSm = Object.keys(yd.months).map(Number).sort((a,b)=>a-b);
  const filt = chSelMonths ? allSm.filter(m => chSelMonths.includes(m)) : null;
  const d = getF(curY, filt);
  if(!d||!d.sm.length){document.getElementById('channels-dash').innerHTML='<div class="loading">Нет данных</div>';return}

  const pY=curY-1;const pD=getF(pY,d.sm);const hasPrev=pD&&pD.sm.length>0;
  document.getElementById('yr-title2').textContent=curY;
  document.getElementById('yr-sub2').textContent=(chSelMonths?'Выбрано '+d.sm.length+' мес.':MF[d.sm[0]]+' — '+MF[d.sm[d.sm.length-1]])+' '+curY+(hasPrev?' vs '+pY:'');

  // Month pills
  let pills = document.getElementById('ch-month-pills');
  if (!pills) {
    pills = document.createElement('div');
    pills.id = 'ch-month-pills';
    pills.className = 'month-pills';
    const dash = document.getElementById('channels-dash');
    dash.parentNode.insertBefore(pills, dash);
  }
  let mp = `<button class="mp all${chSelMonths===null?' active':''}" onclick="chSelMonths=null;renderChannels()">Все</button>`;
  allSm.forEach(m => {
    mp += `<button class="mp${chSelMonths&&chSelMonths.includes(m)?' active':''}" onclick="toggleChMonth(${m})">${MS[m]}</button>`;
  });
  pills.innerHTML = mp;

  const cs=Object.entries(d.ca).sort((a,b)=>b[1].visitors-a[1].visitors);
  if(!selCh&&cs.length)selCh=cs[0][0];

  // Clickable channel cards with YoY
  let h=`<div class="ch-cards">`;
  cs.forEach(([name,data])=>{
    const pct=d.tv>0?((data.visitors/d.tv)*100).toFixed(1):'0';
    let yoyHtml='';
    if(hasPrev&&pD.ca[name]){
      const ch=pctCh(data.visitors,pD.ca[name].visitors);
      yoyHtml=`<div class="ch-yoy ${ch.cls}">vs ${pY}: ${ch.t}</div>`;
    }
    h+=`<div class="ch-card${name===selCh?' sel':''}" onclick="selCh='${name.replace(/'/g,"\\'")}';renderChannels()">
      <div class="ch-name">${name}</div>
      <div class="ch-val">${(data.visitors/1e3).toFixed(1)}K</div>
      <div class="ch-sub">${pct}% · ${data.leads} заявок</div>${yoyHtml}</div>`;
  });
  h+=`</div>`;

  // Monthly data for charts (always all months for the line chart)
  const allMo=allSm.map(m=>MS[m]);

  // Charts row
  h+=`<div class="charts-row">
    <div class="cb"><h3>Топ каналы по месяцам</h3><div class="chart-wrap-tall"><canvas id="cChAll"></canvas></div></div>
    <div class="cb"><h3>${selCh||'Канал'} — заявки</h3><div class="chart-wrap-tall"><canvas id="cChL"></canvas></div></div>
  </div>`;

  // Table with conversion and totals
  h+=`<div class="tb"><h3>Каналы — ${curY}</h3><table><thead><tr>
    <th>Канал</th><th class="n">Пос.</th><th class="n">%</th><th class="n">Клики</th><th class="n">Заявки</th><th class="n">Конв.</th>
  </tr></thead><tbody>`;
  cs.forEach(([name,data])=>{
    const pct=d.tv>0?((data.visitors/d.tv)*100).toFixed(1):'0';
    const cv=data.visitors>0?((data.clicks/data.visitors)*100).toFixed(2):'0';
    h+=`<tr><td>${name}</td><td class="n">${fmt(data.visitors)}</td><td class="n">${pct}%</td>
      <td class="n">${fmt(data.clicks)}</td><td class="n">${data.leads}</td>
      <td class="n">${cv.replace('.',',')}%</td></tr>`;
  });
  h+=`<tr class="total"><td>Итого</td>
    <td class="n" style="color:#2997ff">${fmt(d.tv)}</td><td class="n">100%</td>
    <td class="n" style="color:#bf5af2">${fmt(d.tcl)}</td>
    <td class="n" style="color:#30d158">${fmt(d.tl)}</td>
    <td class="n" style="color:#ff9f0a">${d.avgConv}%</td>
  </tr></tbody></table></div>`;

  document.getElementById('channels-dash').innerHTML=h;

  // Destroy old charts
  if(c4)c4.destroy();if(c5)c5.destroy();

  // Line chart: top 6 channels over ALL months
  const topCh=cs.slice(0,6);
  const fullD = getF(curY); // all months for line chart
  c4=new Chart(document.getElementById('cChAll'),{
    type:'line',
    data:{labels:allMo,datasets:topCh.map(([name],i)=>{
      const chFull = fullD.ca[name];
      return {
        label:name,
        data:allSm.map(m=>chFull&&chFull.monthly[m]?chFull.monthly[m].visitors:0),
        borderColor:CHCOL[i%CHCOL.length],backgroundColor:'transparent',
        tension:.4,pointRadius:2,borderWidth:2
      };
    })},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:tc,font:{size:11},boxWidth:12}}},
      scales:{
        x:{grid:{color:gc},ticks:{color:tc}},
        y:{grid:{color:gc},ticks:{color:tc,callback:v=>v>=1e3?(v/1e3)+'K':v}}
      }}
  });

  // Bar chart: selected channel leads by month
  const chFull = fullD.ca[selCh];
  if(chFull){
    c5=new Chart(document.getElementById('cChL'),{
      type:'bar',
      data:{labels:allMo,datasets:[{
        label:selCh+' заявки',
        data:allSm.map(m=>chFull.monthly[m]?chFull.monthly[m].leads:0),
        backgroundColor:'#30d158',borderRadius:4,barPercentage:.6
      }]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:tc,boxWidth:12}}},
        scales:{
          x:{grid:{color:gc},ticks:{color:tc}},
          y:{grid:{color:gc},ticks:{color:tc}}
        }}
    });
  }
}