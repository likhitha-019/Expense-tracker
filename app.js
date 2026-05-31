/* ═══════════════════════════════════════════════════
   SpendSmart – app.js
   ═══════════════════════════════════════════════════ */

'use strict';

// ── Constants ──────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#7c5cfc','#3b82f6','#10b981','#f59e0b','#ef4444',
  '#ec4899','#06b6d4','#8b5cf6','#f97316','#14b8a6'
];

const CATEGORY_COLORS = {
  '🍔 Food & Dining':      '#f59e0b',
  '🚌 Transport':          '#3b82f6',
  '🛒 Groceries':          '#10b981',
  '🎬 Entertainment':      '#ec4899',
  '🏥 Health & Medical':   '#ef4444',
  '🛍️ Shopping':           '#8b5cf6',
  '📚 Education':          '#06b6d4',
  '🏠 Rent & Utilities':   '#f97316',
  '✈️ Travel':             '#14b8a6',
  '💻 Tech & Subscriptions':'#7c5cfc',
  '🎁 Gifts':              '#e879f9',
  '💰 Other':              '#94a3b8',
};

// ── Default People (always seeded on first launch) ────────────────────────
const DEFAULT_PEOPLE = [];

// ── Version reset (bump this string to force a fresh start) ─────────────────
const APP_VERSION = 'v5';
if (localStorage.getItem('ss_version') !== APP_VERSION) {
  localStorage.removeItem('ss_expenses');
  localStorage.removeItem('ss_people');
  localStorage.setItem('ss_version', APP_VERSION);
}

// ── State ───────────────────────────────────────────────────────────────────
let expenses = JSON.parse(localStorage.getItem('ss_expenses') || '[]');
let people   = JSON.parse(localStorage.getItem('ss_people')   || '[]');
let deleteTargetId = null;
let selectedAvatarColor = AVATAR_COLORS[0];

// Chart instances
let chartCategory   = null;
let chartPerson     = null;
let chartTrend      = null;
let chartAnCat      = null;
let chartAnPerson   = null;
let chartAnWeekly   = null;
let chartAnMonthly  = null;

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0, 10);

function saveData() {
  localStorage.setItem('ss_expenses', JSON.stringify(expenses));
  localStorage.setItem('ss_people',   JSON.stringify(people));
}

function getPersonColor(name) {
  const p = people.find(x => x.name === name);
  return p ? p.color : '#94a3b8';
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  t.innerHTML = `<span>${icons[type]}</span> ${msg}`;
  t.className = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ── Theme Toggle ──────────────────────────────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');

function applyTheme(dark) {
  document.body.classList.toggle('dark-theme', dark);
  themeIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
  themeToggle.title   = dark ? 'Switch to Light Theme' : 'Switch to Dark Theme';
  localStorage.setItem('ss_theme', dark ? 'dark' : 'light');
}

// Load saved theme
applyTheme(localStorage.getItem('ss_theme') === 'dark');

themeToggle.addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('dark-theme'));
});

// ── Date Display ─────────────────────────────────────────────────────────────
document.getElementById('todayDate').textContent =
  new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

// ── Navigation ───────────────────────────────────────────────────────────────
function navigate(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`section-${sectionId}`).classList.add('active');
  document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
  const titles = {
    'dashboard':   'Dashboard',
    'add-expense': 'Add Expense',
    'history':     'History',
    'analytics':   'Analytics',
    'people':      'People',
    'reports':     'Reports',
  };
  document.getElementById('topbarTitle').textContent = titles[sectionId] || '';

  if (sectionId === 'dashboard')   renderDashboard();
  if (sectionId === 'history')     renderHistory();
  if (sectionId === 'analytics')   renderAnalytics();
  if (sectionId === 'people')      renderPeople();
  if (sectionId === 'add-expense') renderAddExpense();
  if (sectionId === 'reports')     renderReports();

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigate(item.dataset.section);
  });
});

document.querySelectorAll('.see-all').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    navigate(a.dataset.section);
  });
});

// Hamburger
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  const open = document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').style.display = open ? 'block' : 'none';
});

document.getElementById('sidebarOverlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
});

// ── People Selects ────────────────────────────────────────────────────────────
function refreshPersonSelects() {
  const selects = ['personSelect', 'filterPerson', 'analyticsPerson'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.value;
    const prefix = id === 'personSelect' ? '<option value="">Select person…</option>'
                 : id === 'filterPerson'  ? '<option value="">All People</option>'
                 : '<option value="all">All People</option>';
    el.innerHTML = prefix + people.map(p =>
      `<option value="${p.name}">${p.name}</option>`
    ).join('');
    if (val) el.value = val;
  });
}

// ── Add Expense Form ──────────────────────────────────────────────────────────
function renderAddExpense() {
  // Set today's date as default
  const di = document.getElementById('dateInput');
  if (!di.value) di.value = today();
  refreshPersonSelects();
  // Always reset person to empty placeholder on page load
  document.getElementById('personSelect').value = '';
  updateQuickStats();
}

function updateQuickStats() {
  const now = new Date();
  const todayStr = today();
  const weekAgo  = new Date(now - 7*86400000).toISOString().slice(0,10);
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const todayTotal = expenses.filter(e => e.date === todayStr).reduce((s,e) => s+e.amount, 0);
  const weekTotal  = expenses.filter(e => e.date >= weekAgo).reduce((s,e) => s+e.amount, 0);
  const monthTotal = expenses.filter(e => e.date.startsWith(monthStr)).reduce((s,e) => s+e.amount, 0);

  document.getElementById('qsToday').textContent = fmt(todayTotal);
  document.getElementById('qsWeek').textContent  = fmt(weekTotal);
  document.getElementById('qsMonth').textContent = fmt(monthTotal);

  // Top categories
  const catMap = {};
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category]||0) + e.amount; });
  const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0,5);
  document.getElementById('qsCategoryList').innerHTML = sorted.map(([cat, amt]) =>
    `<div class="qs-cat-item"><span>${cat}</span><strong>${fmt(amt)}</strong></div>`
  ).join('') || '<p style="font-size:.8rem;color:var(--text-muted);margin-top:.5rem">No data yet</p>';
}

// Validation
function validateForm() {
  let valid = true;
  const fields = [
    { id: 'personSelect',   errId: 'err-person',   msg: 'Please select a person' },
    { id: 'categorySelect', errId: 'err-category', msg: 'Please select a category' },
    { id: 'amountInput',    errId: 'err-amount',   msg: 'Please enter a valid amount' },
    { id: 'dateInput',      errId: 'err-date',     msg: 'Please pick a date' },
  ];
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    const err = document.getElementById(f.errId);
    const val = el.value.trim();
    if (!val || (f.id === 'amountInput' && (isNaN(val) || Number(val) <= 0))) {
      err.textContent = f.msg;
      el.style.borderColor = 'var(--red)';
      valid = false;
    } else {
      err.textContent = '';
      el.style.borderColor = '';
    }
  });
  return valid;
}

document.getElementById('expenseForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm()) return;

  const expense = {
    id:       uid(),
    person:   document.getElementById('personSelect').value,
    category: document.getElementById('categorySelect').value,
    amount:   parseFloat(document.getElementById('amountInput').value),
    date:     document.getElementById('dateInput').value,
    note:     document.getElementById('noteInput').value.trim(),
  };

  expenses.unshift(expense);
  saveData();
  showToast(`Expense of ${fmt(expense.amount)} added!`);

  // Reset form
  document.getElementById('expenseForm').reset();
  document.getElementById('dateInput').value = today();
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-group input, .form-group select').forEach(el => el.style.borderColor = '');

  updateQuickStats();
});

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard() {
  const todayStr = today();
  const totalSpent  = expenses.reduce((s,e) => s+e.amount, 0);
  const todayExp    = expenses.filter(e => e.date === todayStr);
  const todayTotal  = todayExp.reduce((s,e) => s+e.amount, 0);

  document.getElementById('totalSpent').textContent = fmt(totalSpent);
  document.getElementById('todaySpent').textContent = fmt(todayTotal);
  document.getElementById('todayCount').textContent = `${todayExp.length} transaction${todayExp.length !== 1 ? 's' : ''}`;

  // Top category
  const catMap = {};
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category]||0) + e.amount; });
  const topCat = Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('topCategory').textContent = topCat ? topCat[0].split(' ').slice(1).join(' ') : '—';
  document.getElementById('topCategoryAmt').textContent = topCat ? fmt(topCat[1]) : '';

  // Top spender
  const personMap = {};
  expenses.forEach(e => { personMap[e.person] = (personMap[e.person]||0) + e.amount; });
  const topPerson = Object.entries(personMap).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('topSpender').textContent   = topPerson ? topPerson[0] : '—';
  document.getElementById('topSpenderAmt').textContent = topPerson ? fmt(topPerson[1]) : '';

  renderCategoryChart();
  renderPersonChart();
  renderTrendChart();
  renderRecentList();
}

function buildChartDefaults() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#6b7280', font: { family: 'Inter', size: 11 }, padding: 12 } },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1e1b4b',
        bodyColor: '#6b7280',
        borderColor: 'rgba(99,102,241,0.15)',
        borderWidth: 1,
        boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
        callbacks: { label: ctx => ' ₹' + Number(ctx.parsed.y || ctx.parsed).toLocaleString('en-IN') }
      }
    },
    scales: {
      x: { ticks: { color:'#6b7280', font:{family:'Inter',size:11} }, grid: { color:'rgba(99,102,241,.06)' } },
      y: { ticks: { color:'#6b7280', font:{family:'Inter',size:11}, callback: v => '₹'+v.toLocaleString('en-IN') }, grid: { color:'rgba(99,102,241,.06)' }, beginAtZero: true }
    }
  };
}

function renderCategoryChart() {
  const catMap = {};
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category]||0) + e.amount; });
  const labels = Object.keys(catMap);
  const data   = Object.values(catMap);
  const colors = labels.map(l => CATEGORY_COLORS[l] || '#94a3b8');

  if (chartCategory) chartCategory.destroy();
  const ctx = document.getElementById('categoryChart').getContext('2d');
  chartCategory = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Amount (₹)',
        data,
        backgroundColor: colors.map(c => c + 'cc'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: { ...buildChartDefaults(), plugins: { ...buildChartDefaults().plugins, legend: { display: false } } }
  });
}

function renderPersonChart() {
  const personMap = {};
  expenses.forEach(e => { personMap[e.person] = (personMap[e.person]||0) + e.amount; });
  const labels = Object.keys(personMap);
  const data   = Object.values(personMap);
  const colors = labels.map(n => getPersonColor(n));

  if (chartPerson) chartPerson.destroy();
  const ctx = document.getElementById('personChart').getContext('2d');
  chartPerson = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Amount (₹)',
        data,
        backgroundColor: colors.map(c => c + 'cc'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: { ...buildChartDefaults(), plugins: { ...buildChartDefaults().plugins, legend: { display: false } } }
  });
}

function renderTrendChart() {
  const days = 14;
  const labels = [];
  const data   = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const str = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
    labels.push(label);
    data.push(expenses.filter(e => e.date === str).reduce((s,e) => s+e.amount, 0));
  }

  if (chartTrend) chartTrend.destroy();
  const ctx = document.getElementById('trendChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(99,102,241,0.35)');
  gradient.addColorStop(1, 'rgba(99,102,241,0.0)');

  chartTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Daily Spend (₹)',
        data,
        borderColor: '#6366f1',
        backgroundColor: gradient,
        borderWidth: 2.5,
        pointBackgroundColor: '#7c5cfc',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      }]
    },
    options: buildChartDefaults()
  });
}

function renderRecentList() {
  const container = document.getElementById('recentList');
  const recent = expenses.slice(0, 8);
  if (!recent.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No expenses yet. Add your first one!</p></div>`;
    return;
  }
  container.innerHTML = recent.map(e => txHTML(e)).join('');
  container.querySelectorAll('.tx-delete').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
  });
}

function txHTML(e) {
  const color = getPersonColor(e.person);
  const initials = getInitials(e.person);
  const dateStr = new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  return `
    <div class="tx-item" data-id="${e.id}">
      <div class="tx-avatar" style="background:${color}">${initials}</div>
      <div class="tx-info">
        <div class="tx-person">${e.person}</div>
        <div class="tx-cat-note">${e.category}${e.note ? ' · ' + e.note : ''}</div>
      </div>
      <div class="tx-right">
        <div class="tx-amount">${fmt(e.amount)}</div>
        <div class="tx-date">${dateStr}</div>
      </div>
      <button class="tx-delete" data-id="${e.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
    </div>
  `;
}

// ── History ───────────────────────────────────────────────────────────────────
function renderHistory() {
  refreshPersonSelects();
  applyHistoryFilters();
}

function applyHistoryFilters() {
  const search   = document.getElementById('searchInput').value.toLowerCase();
  const person   = document.getElementById('filterPerson').value;
  const category = document.getElementById('filterCategory').value;
  const sort     = document.getElementById('filterSort').value;

  let filtered = expenses.filter(e => {
    const matchSearch = !search ||
      e.person.toLowerCase().includes(search) ||
      e.category.toLowerCase().includes(search) ||
      (e.note && e.note.toLowerCase().includes(search));
    const matchPerson   = !person   || e.person === person;
    const matchCategory = !category || e.category === category;
    return matchSearch && matchPerson && matchCategory;
  });

  filtered.sort((a, b) => {
    if (sort === 'date-desc')   return b.date.localeCompare(a.date);
    if (sort === 'date-asc')    return a.date.localeCompare(b.date);
    if (sort === 'amount-desc') return b.amount - a.amount;
    if (sort === 'amount-asc')  return a.amount - b.amount;
    return 0;
  });

  const total = filtered.reduce((s,e) => s+e.amount, 0);
  document.getElementById('historySummaryBar').innerHTML =
    `<span>${filtered.length} result${filtered.length !== 1?'s':''}</span>
     <span>Total: <strong>${fmt(total)}</strong></span>`;

  const container = document.getElementById('historyList');
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No expenses match your filters.</p></div>`;
    return;
  }
  container.innerHTML = filtered.map(e => txHTML(e)).join('');
  container.querySelectorAll('.tx-delete').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
  });
}

['searchInput','filterPerson','filterCategory','filterSort'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', applyHistoryFilters);
  document.getElementById(id)?.addEventListener('change', applyHistoryFilters);
});

document.getElementById('clearFilters').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterPerson').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterSort').value = 'date-desc';
  applyHistoryFilters();
});

// ── Analytics ─────────────────────────────────────────────────────────────────
function renderAnalytics() {
  populateAnalyticsMonths();
  refreshPersonSelects();
  buildAnalyticsCharts();
}

function populateAnalyticsMonths() {
  const months = [...new Set(expenses.map(e => e.date.slice(0,7)))].sort().reverse();
  const sel = document.getElementById('analyticsMonth');
  const val = sel.value;
  sel.innerHTML = '<option value="all">All Time</option>' +
    months.map(m => {
      const [y,mo] = m.split('-');
      const label = new Date(y, mo-1, 1).toLocaleDateString('en-IN', { month:'long', year:'numeric' });
      return `<option value="${m}">${label}</option>`;
    }).join('');
  if (val) sel.value = val;
}

function getAnalyticsFiltered() {
  const month  = document.getElementById('analyticsMonth').value;
  const person = document.getElementById('analyticsPerson').value;
  return expenses.filter(e => {
    const mOk = month  === 'all' || e.date.startsWith(month);
    const pOk = person === 'all' || e.person === person;
    return mOk && pOk;
  });
}

function buildAnalyticsCharts() {
  const filtered = getAnalyticsFiltered();

  // Category bar
  const catMap = {};
  filtered.forEach(e => { catMap[e.category] = (catMap[e.category]||0) + e.amount; });
  const catLabels = Object.keys(catMap).sort((a,b) => catMap[b]-catMap[a]);
  const catData   = catLabels.map(l => catMap[l]);
  const catColors = catLabels.map(l => CATEGORY_COLORS[l] || '#94a3b8');

  if (chartAnCat) chartAnCat.destroy();
  chartAnCat = new Chart(document.getElementById('analyticsCategoryChart'), {
    type: 'bar',
    data: { labels: catLabels, datasets: [{
      label: '₹', data: catData,
      backgroundColor: catColors.map(c=>c+'cc'),
      borderColor: catColors, borderWidth:2, borderRadius:6, borderSkipped:false
    }]},
    options: { ...buildChartDefaults(), plugins:{...buildChartDefaults().plugins, legend:{display:false}} }
  });

  // Person doughnut
  const pMap = {};
  filtered.forEach(e => { pMap[e.person] = (pMap[e.person]||0) + e.amount; });
  const pLabels = Object.keys(pMap);
  const pData   = pLabels.map(n => pMap[n]);
  const pColors = pLabels.map(n => getPersonColor(n));

  if (chartAnPerson) chartAnPerson.destroy();
  chartAnPerson = new Chart(document.getElementById('analyticsPersonChart'), {
    type: 'doughnut',
    data: { labels: pLabels, datasets: [{
      data: pData,
      backgroundColor: pColors.map(c=>c+'cc'),
      borderColor: pColors, borderWidth:2
    }]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position:'bottom', labels:{color:'#8892a4',font:{family:'Inter',size:11},padding:10} },
        tooltip: {
          backgroundColor:'#ffffff', titleColor:'#1e1b4b', bodyColor:'#6b7280',
          borderColor:'rgba(99,102,241,.15)', borderWidth:1,
          callbacks:{ label: ctx => ` ${ctx.label}: ₹${Number(ctx.parsed).toLocaleString('en-IN')}` }
        }
      }
    }
  });

  // Weekly bar
  const weeks = 8;
  const wLabels = [], wData = [];
  for (let i = weeks-1; i >= 0; i--) {
    const wStart = new Date(Date.now() - (i*7+6)*86400000).toISOString().slice(0,10);
    const wEnd   = new Date(Date.now() - i*7*86400000).toISOString().slice(0,10);
    wLabels.push(`W-${i===0?'Now':i}`);
    wData.push(filtered.filter(e => e.date>=wStart && e.date<=wEnd).reduce((s,e)=>s+e.amount,0));
  }

  if (chartAnWeekly) chartAnWeekly.destroy();
  const wCtx = document.getElementById('analyticsWeeklyChart').getContext('2d');
  const wGrad = wCtx.createLinearGradient(0,0,0,200);
  wGrad.addColorStop(0,'rgba(59,130,246,0.5)');
  wGrad.addColorStop(1,'rgba(59,130,246,0.0)');
  chartAnWeekly = new Chart(wCtx, {
    type: 'bar',
    data: { labels: wLabels, datasets:[{
      label:'Weekly Spend (₹)', data: wData,
      backgroundColor: wGrad, borderColor:'#3b82f6',
      borderWidth:2, borderRadius:6, borderSkipped:false
    }]},
    options: buildChartDefaults()
  });

  // Monthly bar (last 12 months)
  const mLabels = [], mData = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key   = d.toISOString().slice(0,7);
    const label = d.toLocaleDateString('en-IN',{month:'short',year:'2-digit'});
    mLabels.push(label);
    mData.push(filtered.filter(e => e.date.startsWith(key)).reduce((s,e)=>s+e.amount,0));
  }
  if (chartAnMonthly) chartAnMonthly.destroy();
  const mCtx = document.getElementById('analyticsMonthlyChart').getContext('2d');
  const mGrad = mCtx.createLinearGradient(0,0,0,200);
  mGrad.addColorStop(0,'rgba(99,102,241,0.55)');
  mGrad.addColorStop(1,'rgba(99,102,241,0.05)');
  chartAnMonthly = new Chart(mCtx, {
    type: 'bar',
    data: { labels: mLabels, datasets:[{
      label:'Monthly Spend (₹)', data: mData,
      backgroundColor: mGrad, borderColor:'#6366f1',
      borderWidth:2, borderRadius:8, borderSkipped:false
    }]},
    options: buildChartDefaults()
  });

  // Heatmap
  renderHeatmap(filtered);
}

function renderHeatmap(filtered) {
  const cats = [...new Set(filtered.map(e => e.category))].sort();
  const persons = [...new Set(filtered.map(e => e.person))].sort();
  if (!cats.length || !persons.length) {
    document.getElementById('heatmapContainer').innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;padding:1rem">Not enough data for heatmap.</p>';
    return;
  }

  const matrix = {};
  persons.forEach(p => { matrix[p] = {}; cats.forEach(c => { matrix[p][c] = 0; }); });
  filtered.forEach(e => { if (matrix[e.person]) matrix[e.person][e.category] = (matrix[e.person][e.category]||0) + e.amount; });

  const allVals = filtered.map(e => e.amount);
  const maxVal  = allVals.reduce((a,b)=>a+b, 0) / (persons.length * cats.length) * 3 || 1;

  const head = `<tr><th>Person</th>${cats.map(c=>`<th>${c}</th>`).join('')}</tr>`;
  const rows = persons.map(p =>
    `<tr>
      <td style="font-weight:600;color:${getPersonColor(p)}">${p}</td>
      ${cats.map(c => {
        const val = matrix[p][c];
        const intensity = Math.min(val / maxVal, 1);
        const bg = val > 0 ? `rgba(124,92,252,${0.1 + intensity*0.7})` : 'transparent';
        return `<td><div class="heatmap-cell" style="background:${bg}">${val>0?fmt(val):'—'}</div></td>`;
      }).join('')}
    </tr>`
  ).join('');

  document.getElementById('heatmapContainer').innerHTML =
    `<table class="heatmap-table"><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

['analyticsMonth','analyticsPerson'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', buildAnalyticsCharts);
});

// ── People ────────────────────────────────────────────────────────────────────
function renderPeople() {
  const grid = document.getElementById('peopleGrid');
  if (!people.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">👤</div><p>No people added yet. Add someone to start tracking!</p></div>`;
    return;
  }
  grid.innerHTML = people.map(p => {
    const total = expenses.filter(e => e.person === p.name).reduce((s,e) => s+e.amount, 0);
    const count = expenses.filter(e => e.person === p.name).length;
    const last  = expenses.filter(e => e.person === p.name)[0];
    const lastDate = last ? new Date(last.date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '—';
    return `
      <div class="person-card">
        <div class="person-avatar-lg" style="background:${p.color}">${getInitials(p.name)}</div>
        <div class="person-name-lg">${p.name}</div>
        <div class="person-total">${fmt(total)}</div>
        <div class="person-stats">${count} expenses · Last: ${lastDate}</div>
        <button class="person-delete-btn" data-name="${p.name}"><i class="fas fa-trash-alt"></i> Remove</button>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.person-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      if (people.find(p => p.name === name)?.isDefault) {
        showToast('Cannot remove a default person!', 'error');
        return;
      }
      if (expenses.some(e => e.person === name)) {
        showToast('Cannot remove — this person has expenses!', 'error');
        return;
      }
      people = people.filter(p => p.name !== name);
      saveData();
      refreshPersonSelects();
      renderPeople();
      showToast(`${name} removed.`, 'info');
    });
  });
}

// ── Add Person Modal ──────────────────────────────────────────────────────────
function openPersonModal() {
  selectedAvatarColor = AVATAR_COLORS[0];
  document.getElementById('newPersonName').value = '';
  renderColorSwatches();
  document.getElementById('personModal').classList.add('open');
  document.getElementById('newPersonName').focus();
}

function renderColorSwatches() {
  document.getElementById('colorSwatches').innerHTML = AVATAR_COLORS.map((c, i) =>
    `<div class="color-swatch${i===0?' selected':''}" data-color="${c}" style="background:${c}"></div>`
  ).join('');
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      selectedAvatarColor = sw.dataset.color;
    });
  });
}

function closePersonModal() {
  document.getElementById('personModal').classList.remove('open');
}

document.getElementById('addPersonBtn').addEventListener('click', openPersonModal);
document.getElementById('addPersonMainBtn').addEventListener('click', openPersonModal);
document.getElementById('closePersonModal').addEventListener('click', closePersonModal);
document.getElementById('cancelPersonModal').addEventListener('click', closePersonModal);

document.getElementById('confirmPersonModal').addEventListener('click', () => {
  const name = document.getElementById('newPersonName').value.trim();
  if (!name) { showToast('Please enter a name', 'error'); return; }
  if (people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    showToast('Person already exists!', 'error'); return;
  }
  people.push({ name, color: selectedAvatarColor });
  saveData();
  refreshPersonSelects();
  // Auto-select the new person in the Add Expense form
  const ps = document.getElementById('personSelect');
  if (ps) ps.value = name;
  closePersonModal();
  showToast(`${name} added & selected!`);
  if (document.getElementById('section-people').classList.contains('active')) renderPeople();
});

document.getElementById('newPersonName').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('confirmPersonModal').click();
});

// ── Delete Modal ──────────────────────────────────────────────────────────────
function openDeleteModal(id) {
  deleteTargetId = id;
  document.getElementById('deleteModal').classList.add('open');
}

function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById('deleteModal').classList.remove('open');
}

document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
document.getElementById('cancelDeleteModal').addEventListener('click', closeDeleteModal);

document.getElementById('confirmDeleteModal').addEventListener('click', () => {
  if (!deleteTargetId) return;
  expenses = expenses.filter(e => e.id !== deleteTargetId);
  saveData();
  closeDeleteModal();
  showToast('Expense deleted.', 'info');

  const active = document.querySelector('.section.active');
  if (active.id === 'section-dashboard')   renderDashboard();
  if (active.id === 'section-history')     renderHistory();
  if (active.id === 'section-analytics')   renderAnalytics();
  if (active.id === 'section-add-expense') updateQuickStats();
});

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ── Export CSV ────────────────────────────────────────────────────────────────
document.getElementById('exportBtn').addEventListener('click', () => {
  if (!expenses.length) { showToast('No data to export!', 'error'); return; }
  const header = 'Date,Person,Category,Amount,Note';
  const rows = expenses.map(e =>
    `${e.date},"${e.person}","${e.category}",${e.amount},"${e.note||''}"`
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `spendsmart-export-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported to CSV!');
});

// ── Seed Demo Data (first launch) ─────────────────────────────────────────────
function seedDemoData() {
  if (people.length || expenses.length) return;
  people = [];
  expenses = [];
  saveData();
}

// ── Reports ───────────────────────────────────────────────────────────────────
let reportCatChart    = null;
let reportPersonChart = null;

function getReportDateRange() {
  const period = document.getElementById('reportPeriod').value;
  const now    = new Date();
  let from, to;
  if (period === 'this-week') {
    const day = now.getDay() || 7;
    from = new Date(now); from.setDate(now.getDate() - day + 1);
    to   = new Date(now); to.setDate(from.getDate() + 6);
  } else if (period === 'last-week') {
    const day = now.getDay() || 7;
    from = new Date(now); from.setDate(now.getDate() - day - 6);
    to   = new Date(now); to.setDate(now.getDate() - day);
  } else if (period === 'this-month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === 'last-month') {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to   = new Date(now.getFullYear(), now.getMonth(), 0);
  } else {
    from = new Date(document.getElementById('reportFrom').value || today());
    to   = new Date(document.getElementById('reportTo').value   || today());
  }
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
    label: from.toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})
         + ' – '
         + to.toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})
  };
}

function renderReports() {
  refreshPersonSelects();
  // Sync reportPerson dropdown
  const rp = document.getElementById('reportPerson');
  rp.innerHTML = '<option value="all">All People</option>' +
    people.map(p => `<option value="${p.name}">${p.name}</option>`).join('');

  // Show/hide custom range inputs
  document.getElementById('reportPeriod').addEventListener('change', function() {
    const show = this.value === 'custom';
    document.getElementById('customRangeGroup').style.display  = show ? '' : 'none';
    document.getElementById('customRangeGroup2').style.display = show ? '' : 'none';
  });

  buildReport();
}

function buildReport() {
  const range    = getReportDateRange();
  const person   = document.getElementById('reportPerson').value;

  const filtered = expenses.filter(e => {
    const inRange  = e.date >= range.from && e.date <= range.to;
    const inPerson = person === 'all' || e.person === person;
    return inRange && inPerson;
  });

  // Header
  const periodLabel = document.getElementById('reportPeriod');
  const pText = periodLabel.options[periodLabel.selectedIndex].text;
  document.getElementById('reportTitle').textContent =
    (person === 'all' ? 'All People' : person) + ' — ' + pText + ' Report';
  document.getElementById('reportSubtitle').textContent = range.label;
  document.getElementById('reportGenDate').textContent =
    new Date().toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});

  // Summary cards
  const total   = filtered.reduce((s,e) => s+e.amount, 0);
  const count   = filtered.length;
  const avg     = count ? total / count : 0;
  const catMap  = {};
  filtered.forEach(e => { catMap[e.category] = (catMap[e.category]||0) + e.amount; });
  const topCat  = Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];

  document.getElementById('reportSummaryCards').innerHTML = `
    <div class="report-stat-card">
      <div class="report-stat-label">Total Spent</div>
      <div class="report-stat-value">${fmt(total)}</div>
    </div>
    <div class="report-stat-card green">
      <div class="report-stat-label">Transactions</div>
      <div class="report-stat-value">${count}</div>
    </div>
    <div class="report-stat-card orange">
      <div class="report-stat-label">Avg per Transaction</div>
      <div class="report-stat-value">${fmt(avg)}</div>
    </div>
    <div class="report-stat-card blue">
      <div class="report-stat-label">Top Category</div>
      <div class="report-stat-value" style="font-size:1rem">${topCat ? topCat[0] : '—'}</div>
    </div>
  `;

  // Category chart
  const catLabels = Object.keys(catMap).sort((a,b)=>catMap[b]-catMap[a]);
  const catData   = catLabels.map(l => catMap[l]);
  const catColors = catLabels.map(l => CATEGORY_COLORS[l] || '#94a3b8');
  if (reportCatChart) reportCatChart.destroy();
  reportCatChart = new Chart(document.getElementById('reportCatChart'), {
    type: 'bar',
    data: { labels: catLabels, datasets: [{
      label: 'Amount (₹)', data: catData,
      backgroundColor: catColors.map(c=>c+'cc'),
      borderColor: catColors, borderWidth: 2, borderRadius: 6, borderSkipped: false
    }]},
    options: { ...buildChartDefaults(), plugins: { ...buildChartDefaults().plugins, legend: { display: false } } }
  });

  // Person chart
  const pMap = {};
  filtered.forEach(e => { pMap[e.person] = (pMap[e.person]||0) + e.amount; });
  const pLabels = Object.keys(pMap);
  const pData   = pLabels.map(n => pMap[n]);
  const pColors = pLabels.map(n => getPersonColor(n));
  if (reportPersonChart) reportPersonChart.destroy();
  reportPersonChart = new Chart(document.getElementById('reportPersonChart'), {
    type: 'doughnut',
    data: { labels: pLabels, datasets: [{
      data: pData,
      backgroundColor: pColors.map(c=>c+'cc'),
      borderColor: pColors, borderWidth: 2
    }]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position:'bottom', labels:{color:'#8892a4',font:{family:'Inter',size:11},padding:10} },
        tooltip: { backgroundColor:'#ffffff', titleColor:'#1e1b4b', bodyColor:'#6b7280',
          borderColor:'rgba(99,102,241,.15)', borderWidth:1,
          callbacks:{ label: ctx => ` ${ctx.label}: ₹${Number(ctx.parsed).toLocaleString('en-IN')}` }
        }
      }
    }
  });

  // Table
  if (!filtered.length) {
    document.getElementById('reportTableBody').innerHTML =
      `<tr><td colspan="5" class="report-empty"><i class="fas fa-inbox"></i>No expenses in this period.</td></tr>`;
    document.getElementById('reportTableFoot').innerHTML = '';
    return;
  }
  const sorted = [...filtered].sort((a,b) => b.date.localeCompare(a.date));
  document.getElementById('reportTableBody').innerHTML = sorted.map(e => `
    <tr>
      <td>${new Date(e.date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
      <td>${e.person}</td>
      <td>${e.category}</td>
      <td>${e.note || '—'}</td>
      <td class="report-amount">${fmt(e.amount)}</td>
    </tr>
  `).join('');
  document.getElementById('reportTableFoot').innerHTML =
    `<tr><td colspan="4"><strong>Total</strong></td><td class="report-amount">${fmt(total)}</td></tr>`;
}

document.getElementById('generateReportBtn').addEventListener('click', buildReport);

// ── PDF Download
document.getElementById('downloadPdfBtn').addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const preview = document.getElementById('reportPreview');
  showToast('Generating PDF…', 'info');

  try {
    const canvas = await html2canvas(preview, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW   = pdf.internal.pageSize.getWidth();
    const pageH   = pdf.internal.pageSize.getHeight();
    const imgW    = pageW;
    const imgH    = (canvas.height * imgW) / canvas.width;
    let   posY    = 0;

    // Multi-page support
    while (posY < imgH) {
      if (posY > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -posY, imgW, imgH);
      posY += pageH;
    }

    const range = getReportDateRange();
    pdf.save(`SpendSmart-Report-${range.from}-to-${range.to}.pdf`);
    showToast('PDF downloaded!');
  } catch (err) {
    console.error(err);
    showToast('PDF generation failed. Try again.', 'error');
  }
});

// ── Share Report
document.getElementById('shareReportBtn').addEventListener('click', async () => {
  const range = getReportDateRange();
  const filtered = expenses.filter(e => e.date >= range.from && e.date <= range.to);
  const total    = filtered.reduce((s,e) => s+e.amount, 0);
  const count    = filtered.length;

  const text = `💸 SpendSmart Report\n` +
    `Period: ${range.label}\n` +
    `Total Spent: ${fmt(total)}\n` +
    `Transactions: ${count}\n` +
    `\nGenerated by SpendSmart Expense Tracker`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'SpendSmart Report', text });
    } catch (_) {}
  } else {
    await navigator.clipboard.writeText(text);
    showToast('Report summary copied to clipboard!', 'info');
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
seedDemoData();
refreshPersonSelects();
renderAddExpense();
renderDashboard();
