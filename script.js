// script.js - loads results.json, provides search, theme toggle, demo download
let results = {};

async function loadResultsJSON() {
  try {
    const r = await fetch('results.json', {cache: "no-store"});
    if (!r.ok) throw new Error('Could not load results.json');
    results = await r.json();
  } catch (e) {
    console.error(e);
    results = {};
  }
}

function createResultCard(roll, data) {
  const container = document.createElement('div');
  container.className = 'result-card glass';

  const header = document.createElement('div');
  header.className = 'result-header';
  const title = document.createElement('div');
  title.innerHTML = `<div style="font-weight:700;font-size:16px">Roll: ${roll}</div><div class="muted" style="font-size:13px">Regulation: 2022</div>`;

  const status = document.createElement('div');
  if (data.type === 'passed') {
    status.className = 'status passed';
    status.textContent = `Passed • GPA ${data.gpa}`;
  } else {
    status.className = 'status referred';
    status.textContent = `Referred`;
  }

  header.appendChild(title);
  header.appendChild(status);
  container.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'result-grid';

  const item1 = document.createElement('div');
  item1.className = 'item';
  item1.innerHTML = `<strong>Status</strong><div>${data.type === 'passed' ? 'Passed' : 'Referred'}</div>`;
  grid.appendChild(item1);

  const item2 = document.createElement('div');
  item2.className = 'item';
  if (data.type === 'passed') {
    item2.innerHTML = `<strong>GPA</strong><div>${data.gpa}</div>`;
  } else {
    item2.innerHTML = `<strong>Subjects</strong><div>${data.subjects.join(', ')}</div>`;
  }
  grid.appendChild(item2);

  // copy / download buttons
  const tools = document.createElement('div');
  tools.style.marginTop = '12px';
  tools.style.display = 'flex';
  tools.style.gap = '8px';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn small ghost';
  copyBtn.textContent = 'Copy JSON';
  copyBtn.onclick = () => {
    const payload = { [roll]: data };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(()=> {
      copyBtn.textContent = 'Copied';
      setTimeout(()=> copyBtn.textContent = 'Copy JSON',1200);
    });
  };

  const dlBtn = document.createElement('button');
  dlBtn.className = 'btn small';
  dlBtn.textContent = 'Download JSON';
  dlBtn.onclick = () => {
    const payload = { [roll]: data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${roll}_result.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  tools.appendChild(copyBtn);
  tools.appendChild(dlBtn);
  container.appendChild(grid);
  container.appendChild(tools);

  return container;
}

function showNotFound(roll) {
  const card = document.createElement('div');
  card.className = 'result-card glass';
  card.innerHTML = `<div style="font-weight:700">No result found</div><div class="muted" style="margin-top:8px">Roll ${roll} not present in results.json</div>`;
  return card;
}

async function checkResult() {
  const roll = document.getElementById('roll').value.trim();
  const area = document.getElementById('resultArea');
  area.innerHTML = '';
  if (!roll) {
    area.appendChild(showNotFound('— please enter a roll'));
    return;
  }

  if (Object.keys(results).length === 0) await loadResultsJSON();

  const data = results[roll];
  if (!data) {
    area.appendChild(showNotFound(roll));
    return;
  }
  area.appendChild(createResultCard(roll, data));
}

// theme toggle
function applyTheme(light) {
  document.body.classList.toggle('theme-light', light);
  document.body.classList.toggle('theme-dark', !light);
  localStorage.setItem('bteb_theme_light', light ? '1' : '0');
}

document.addEventListener('DOMContentLoaded', async () => {
  // load results once in background
  loadResultsJSON();

  // wire buttons
  document.getElementById('checkBtn').addEventListener('click', checkResult);
  document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('roll').value = '';
    document.getElementById('resultArea').innerHTML = '';
  });

  // theme
  const toggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('bteb_theme_light');
  const useLight = saved === '1' ? true : false;
  applyTheme(useLight);
  toggle.checked = useLight;
  toggle.addEventListener('change', ()=> applyTheme(toggle.checked));

  // demo download link
  document.getElementById('downloadDemoJSON').addEventListener('click', (e)=>{
    e.preventDefault();
    fetch('results.json').then(r=>r.blob()).then(blob=>{
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'results.json';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }).catch(()=> alert('Could not download results.json (missing?)'));
  });

  // quick-search when pressing Enter
  document.getElementById('roll').addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') checkResult();
  });
});
