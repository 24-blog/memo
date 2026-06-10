// ── Clock ──────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('clock-date').textContent = `${y}/${mo}/${d}`;
  document.getElementById('clock-time').textContent = `${h}:${mi}`;
  document.getElementById('clock-sec').textContent = `:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Memo ───────────────────────────────────────────────
const MEMO_KEY = 'pwa_memo_v1';
const textarea = document.getElementById('memo-area');
const statusEl = document.getElementById('memo-status');
let saveTimer = null;

function loadMemo() {
  const saved = localStorage.getItem(MEMO_KEY);
  if (saved !== null) textarea.value = saved;
}

function saveMemo() {
  localStorage.setItem(MEMO_KEY, textarea.value);
  statusEl.textContent = '保存済み';
  statusEl.classList.remove('saving');
  statusEl.classList.add('saved');
  setTimeout(() => {
    statusEl.textContent = '自動保存';
    statusEl.classList.remove('saved');
  }, 1500);
}

textarea.addEventListener('input', () => {
  statusEl.textContent = '保存中…';
  statusEl.classList.add('saving');
  statusEl.classList.remove('saved');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveMemo, 800);
});

document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([textarea.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  a.href = url;
  a.download = `memo_${ts}.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

loadMemo();

// ── Calculator ─────────────────────────────────────────
let calcExpr = '';
let calcDisplay = '0';
let justCalc = false;

const display = document.getElementById('calc-display');

function updateDisplay(val) {
  display.textContent = val;
  // shrink font for long numbers
  display.style.fontSize = val.length > 10 ? '1.2rem' : '';
}

function calcPress(val) {
  if (val === 'AC') {
    calcExpr = '';
    calcDisplay = '0';
    justCalc = false;
    updateDisplay('0');
    return;
  }

  if (val === '±') {
    if (calcDisplay !== '0') {
      calcDisplay = calcDisplay.startsWith('-') ? calcDisplay.slice(1) : '-' + calcDisplay;
      updateDisplay(calcDisplay);
    }
    return;
  }

  if (val === '%') {
    try {
      const n = parseFloat(calcDisplay) / 100;
      calcDisplay = String(n);
      updateDisplay(calcDisplay);
    } catch(e) {}
    return;
  }

  if (val === '=') {
    try {
      // Replace display operators with JS operators
      const expr = calcExpr
        .replace(/÷/g, '/')
        .replace(/×/g, '*')
        .replace(/−/g, '-');
      // Safety: only allow digits, operators, dot, parens
      if (!/^[\d\s\+\-\*\/\.]+$/.test(expr)) {
        updateDisplay('Error');
        calcExpr = '';
        calcDisplay = '0';
        return;
      }
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + expr + ')')();
      if (!isFinite(result)) {
        updateDisplay('Error');
        calcExpr = '';
        calcDisplay = '0';
        return;
      }
      // Format: avoid floating point noise
      const formatted = parseFloat(result.toFixed(10)).toString();
      calcDisplay = formatted;
      calcExpr = formatted;
      justCalc = true;
      updateDisplay(formatted);
    } catch(e) {
      updateDisplay('Error');
      calcExpr = '';
      calcDisplay = '0';
    }
    return;
  }

  const isOp = ['÷', '×', '+', '−'].includes(val);

  if (isOp) {
    justCalc = false;
    // Replace trailing operator if already there
    calcExpr = calcExpr.replace(/[÷×+−]$/, '') + val;
    calcDisplay = val;
    updateDisplay(calcDisplay);
    return;
  }

  // Digit or dot
  if (justCalc) {
    // Start fresh after =
    calcExpr = val === '.' ? '0.' : val;
    calcDisplay = calcExpr;
    justCalc = false;
  } else {
    // Check if last char was an operator
    const lastIsOp = /[÷×+−]$/.test(calcExpr);
    if (lastIsOp) {
      calcDisplay = val === '.' ? '0.' : val;
    } else {
      if (val === '.' && calcDisplay.includes('.')) return;
      calcDisplay = calcDisplay === '0' && val !== '.' ? val : calcDisplay + val;
    }
    calcExpr += val;
  }
  updateDisplay(calcDisplay);
}

// Button click delegation
document.getElementById('calc-grid').addEventListener('click', e => {
  const btn = e.target.closest('.calc-btn');
  if (!btn) return;
  calcPress(btn.dataset.val);
});
