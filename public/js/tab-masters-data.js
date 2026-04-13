// Плагин: Данные мастеров — загрузка CSV файлов
addTab({
  name: 'Данные мастеров',
  init(el) {
    el.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:0 2rem">
        <div class="report-header"><div><h1>Данные мастеров</h1><p id="md-sub">Загрузите CSV файлы с мастерами</p></div></div>
        <div id="md-drop" class="drop-zone" onclick="document.getElementById('md-input').click()">
          <div class="icon">👷</div><h3>Перетащите CSV файлы сюда</h3>
          <p>Файлы по годам · автоопределение колонки даты регистрации</p>
          <input type="file" id="md-input" multiple accept=".csv,.xlsx,.xls" style="display:none">
        </div>
        <div id="md-dash"></div>
      </div>`;
    const dz = document.getElementById('md-drop');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over') });
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); handleMasterFiles(e.dataTransfer.files) });
    document.getElementById('md-input').addEventListener('change', e => { handleMasterFiles(e.target.files); e.target.value = '' });
    renderMasterData();
  }
});

function getMasterStore() { try { return JSON.parse(localStorage.getItem('ustabor_masters') || '{}'); } catch(e) { return {} } }
function saveMasterStore(d) { localStorage.setItem('ustabor_masters', JSON.stringify(d)) }

function findMasterDateCol(headers) {
  const dateNames = ['date','created_at','registration_date','registered_at','reg_date','signup_date','created','datetime','timestamp','дата','дата_регистрации','дата регистрации','зарегистрирован','registered'];
  const h = headers.map(x => String(x||'').trim().toLowerCase());
  for (const dn of dateNames) { const i = h.indexOf(dn); if (i >= 0) return i }
  for (let i = 0; i < h.length; i++) { if (h[i].includes('date') || h[i].includes('дата') || h[i].includes('created')) return i }
  return -1;
}

function parseMasterDate(s) {
  if (!s) return null;
  const str = String(s).trim();
  let d = new Date(str);
  if (!isNaN(d)) return d;
  const m1 = str.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})$/);
  if (m1) { let yr = parseInt(m1[3]); if (yr < 100) yr += 2000; d = new Date(yr, parseInt(m1[2])-1, parseInt(m1[1])); if (!isNaN(d)) return d }
  const m2 = str.match(/^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})/);
  if (m2) { d = new Date(parseInt(m2[1]), parseInt(m2[2])-1, parseInt(m2[3])); if (!isNaN(d)) return d }
  return null;
}

async function handleMasterFiles(files) {
  const store = getMasterStore();
  let count = 0, totalRows = 0;
  for (const file of files) {
    let rows;
    if (file.name.endsWith('.csv')) { rows = parseCSV(await file.text()) }
    else { const wb = XLSX.read(await file.arrayBuffer(), {type:'array'}); rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1}) }
    if (rows.length < 2) continue;
    const dateIdx = findMasterDateCol(rows[0]);
    if (dateIdx < 0) { alert('Не найден столбец даты в: ' + file.name); continue }
    const monthly = {};
    let fr = 0;
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[dateIdx]) continue;
      const d = parseMasterDate(row[dateIdx]);
      if (!d) continue;
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      if (!monthly[key]) monthly[key] = 0;
      monthly[key]++;
      fr++;
    }
    Object.entries(monthly).forEach(([key, cnt]) => {
      if (!store[key]) store[key] = 0;
      store[key] += cnt;
    });
    count++;
    totalRows += fr;
  }
  saveMasterStore(store);
  renderMasterData();
  if (count) alert(count + ' файл(ов), ' + fmt(totalRows) + ' мастеров');
}

function deleteMasterData() {
  if (confirm('Удалить все данные мастеров?')) {
    localStorage.removeItem('ustabor_masters');
    renderMasterData();
  }
}

function renderMasterData() {
  const el = document.getElementById('md-dash');
  if (!el) return;
  const store = getMasterStore();
  const keys = Object.keys(store).sort();
  const total = Object.values(store).reduce((s,v) => s+v, 0);
  document.getElementById('md-sub').textContent = keys.length ? fmt(total) + ' мастеров · ' + keys.length + ' мес.' : 'Загрузите CSV файлы';
  let h = '';
  if (keys.length) {
    const years = new Set(); keys.forEach(k => years.add(k.split('-')[0]));
    h += `<div class="metrics-grid">
      <div class="mc"><div class="l">Всего мастеров</div><div class="v vb">${fmtM(total)}</div><div class="c c-neutral">${keys.length} мес.</div></div>
      <div class="mc"><div class="l">Годов данных</div><div class="v vp">${[...years].length}</div><div class="c c-neutral">${[...years].sort().join(', ')}</div></div>
      <div class="mc"><div class="l">Среднее в мес.</div><div class="v vg">${fmt(Math.round(total/keys.length))}</div><div class="c c-neutral">рег/мес</div></div>
      <div class="mc"><div class="l" style="cursor:pointer;color:#ff453a" onclick="deleteMasterData()">🗑️ Очистить всё</div><div class="v va">${fmt(total)}</div><div class="c c-neutral">нажмите чтобы удалить</div></div>
    </div>`;
    h += `<div class="tb"><h3>Загруженные данные</h3><table><thead><tr><th>Месяц</th><th class="n">Мастеров</th><th class="n">% от общего</th></tr></thead><tbody>`;
    keys.forEach(k => {
      const [yr, mo] = k.split('-');
      h += `<tr><td>${MF[parseInt(mo)-1]} ${yr}</td><td class="n">${fmt(store[k])}</td><td class="n">${(store[k]/total*100).toFixed(1)}%</td></tr>`;
    });
    h += `</tbody></table></div>`;
  }
  el.innerHTML = h;
}