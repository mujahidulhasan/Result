// script.js - loads results.json, provides search, and handles result display
let results = {};

async function loadResultsJSON() {
  try {
    // Attempt to load results.json, bypassing cache
    const r = await fetch('results.json', {cache: "no-store"});
    if (!r.ok) throw new Error('Could not load results.json');
    results = await r.json();
  } catch (e) {
    console.error("Error loading results.json:", e);
    // If loading fails, clear results to indicate no data
    results = {};
  }
}

/**
 * Creates the HTML element for a result card based on the data.
 * @param {string} roll - The roll number.
 * @param {Object} data - The result data (type, gpa/subjects).
 * @returns {HTMLElement} The created result card element.
 */
function createResultCard(roll, data) {
  const container = document.createElement('div');
  container.className = 'result-card'; // Uses the existing result-card class

  const header = document.createElement('div');
  header.className = 'result-header';
  const title = document.createElement('div');
  title.innerHTML = `<div style="font-weight:700;font-size:16px">Roll: ${roll}</div><div class="muted" style="font-size:13px">Regulation: 2022</div>`;

  const status = document.createElement('div');
  if (data.type === 'passed') {
    status.className = 'status passed';
    status.textContent = `Passed • GPA ${data.gpa}`; // Passed হলে GPA দেখাচ্ছে
  } else {
    status.className = 'status referred';
    status.textContent = `Referred`; // Referred দেখাচ্ছে
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
    item2.innerHTML = `<strong>GPA</strong><div>${data.gpa}</div>`; // Passed হলে GPA দেখাচ্ছে
  } else {
    item2.innerHTML = `<strong>Subjects</strong><div>${data.subjects.join(', ')}</div>`; // Referred হলে Subjects কোড দেখাচ্ছে
  }
  grid.appendChild(item2);

  // copy / download buttons
  const tools = document.createElement('div');
  tools.style.marginTop = '16px';
  tools.style.display = 'flex';
  tools.style.gap = '8px';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn small ghost';
  copyBtn.textContent = 'Copy JSON';
  copyBtn.onclick = () => {
    const payload = { [roll]: data };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(()=> {
      copyBtn.textContent = 'Copied!';
      setTimeout(()=> copyBtn.textContent = 'Copy JSON',1200);
    }).catch(()=> alert('Failed to copy to clipboard.'));
  };

  const dlBtn = document.createElement('button');
  dlBtn.className = 'btn small primary';
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

/**
 * Creates a card for "Not Found" results.
 * @param {string} roll - The roll number searched.
 * @returns {HTMLElement} The created "Not Found" card element.
 */
function showNotFound(roll) {
  const card = document.createElement('div');
  card.className = 'result-card';
  card.innerHTML = `<div style="font-weight:700">No result found</div><div class="muted" style="margin-top:8px">Roll ${roll} not present in results.json</div>`;
  return card;
}

/**
 * Main function to check the result based on roll number.
 */
async function checkResult() {
  const rollInput = document.getElementById('roll');
  const roll = rollInput.value.trim();
  const area = document.getElementById('resultArea');
  
  area.innerHTML = ''; // Clear previous results

  if (!roll) {
    area.appendChild(showNotFound('— please enter a roll'));
    // Basic validation: add a temporary visual cue for empty roll
    rollInput.style.border = '1px solid #ef4444';
    setTimeout(() => rollInput.style.border = '1px solid rgba(59, 130, 246, 0.2)', 1500);
    return;
  }
  
  // Ensure data is loaded
  if (Object.keys(results).length === 0) await loadResultsJSON();

  const data = results[roll];
  if (!data) {
    area.appendChild(showNotFound(roll));
    return;
  }
  
  // Show the result
  area.appendChild(createResultCard(roll, data));
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
