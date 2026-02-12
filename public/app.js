const API = '/api/expenses';

const CATEGORY_COLORS = {
  Food:          '#f59e0b',
  Transport:     '#3b82f6',
  Housing:       '#8b5cf6',
  Entertainment: '#ec4899',
  Health:        '#10b981',
  Shopping:      '#f97316',
  Other:         '#6b7280'
};

let expenses = [];
let editingId = null;
let donutChart = null;
let barChart = null;

// DOM refs
const expenseList = document.getElementById('expenseList');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('modal');
const expenseForm = document.getElementById('expenseForm');
const filterCategory = document.getElementById('filterCategory');
const filterMonth = document.getElementById('filterMonth');

// Set default month filter to current month
const now = new Date();
filterMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;
document.getElementById('headerMonth').textContent =
  now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

// Modal controls
document.getElementById('openModal').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', closeModal);

function openModal(expense = null) {
  editingId = expense ? expense.id : null;
  document.getElementById('modalTitle').textContent = expense ? 'Edit Expense' : 'New Expense';
  document.getElementById('titleInput').value = expense ? expense.title : '';
  document.getElementById('amountInput').value = expense ? expense.amount : '';
  document.getElementById('dateInput').value = expense ? expense.date : new Date().toISOString().split('T')[0];
  document.getElementById('categoryInput').value = expense ? expense.category : '';
  document.getElementById('noteInput').value = expense ? expense.note : '';
  modal.classList.remove('hidden');
  document.getElementById('titleInput').focus();
}

function closeModal() {
  modal.classList.add('hidden');
  expenseForm.reset();
  editingId = null;
}

// Form submit
expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('titleInput').value.trim(),
    amount: parseFloat(document.getElementById('amountInput').value),
    date: document.getElementById('dateInput').value,
    category: document.getElementById('categoryInput').value,
    note: document.getElementById('noteInput').value.trim()
  };

  if (editingId) {
    await fetch(`${API}/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
  closeModal();
  loadExpenses();
});

// Load all expenses
async function loadExpenses() {
  const res = await fetch(API);
  expenses = await res.json();
  renderAll();
}

function renderAll() {
  renderStats();
  renderList();
  renderCharts();
}

function renderStats() {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const month = filterMonth.value;
  const monthExpenses = expenses.filter(e => e.date.startsWith(month));
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const avg = expenses.length ? total / expenses.length : 0;

  document.getElementById('totalSpent').textContent = `$${total.toFixed(2)}`;
  document.getElementById('monthTotal').textContent = `$${monthTotal.toFixed(2)}`;
  document.getElementById('txCount').textContent = expenses.length;
  document.getElementById('avgAmount').textContent = `$${avg.toFixed(2)}`;
}

function getFiltered() {
  const cat = filterCategory.value;
  const month = filterMonth.value;
  return expenses.filter(e => {
    const matchCat = cat === 'all' || e.category === cat;
    const matchMonth = !month || e.date.startsWith(month);
    return matchCat && matchMonth;
  });
}

function renderList() {
  const filtered = getFiltered();
  expenseList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  filtered.forEach(expense => {
    expenseList.appendChild(createExpenseItem(expense));
  });
}

function createExpenseItem(expense) {
  const item = document.createElement('div');
  item.className = 'expense-item';
  const color = CATEGORY_COLORS[expense.category] || '#6b7280';

  item.innerHTML = `
    <div class="category-dot" style="background:${color}"></div>
    <div class="expense-info">
      <div class="expense-title">${escapeHtml(expense.title)}</div>
      <div class="expense-meta">${expense.category} &bull; ${formatDate(expense.date)}${expense.note ? ` &bull; ${escapeHtml(expense.note)}` : ''}</div>
    </div>
    <div class="expense-amount">-$${expense.amount.toFixed(2)}</div>
    <div class="expense-actions">
      <button class="btn-icon edit-btn">Edit</button>
      <button class="btn-icon delete delete-btn">Delete</button>
    </div>
  `;

  item.querySelector('.edit-btn').addEventListener('click', () => openModal(expense));
  item.querySelector('.delete-btn').addEventListener('click', () => deleteExpense(expense.id));
  return item;
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  await fetch(`${API}/${id}`, { method: 'DELETE' });
  loadExpenses();
}

function renderCharts() {
  const byCategory = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  // Donut chart
  const donutCtx = document.getElementById('donutChart').getContext('2d');
  if (donutChart) donutChart.destroy();

  const cats = Object.keys(byCategory);
  donutChart = new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: cats,
      datasets: [{
        data: cats.map(c => byCategory[c].toFixed(2)),
        backgroundColor: cats.map(c => CATEGORY_COLORS[c] || '#6b7280'),
        borderColor: '#161b22',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#8b949e', font: { size: 11 }, padding: 12 }
        }
      }
    }
  });

  // Bar chart - last 6 months
  const barCtx = document.getElementById('barChart').getContext('2d');
  if (barChart) barChart.destroy();

  const months = getLast6Months();
  const monthlyTotals = months.map(m =>
    expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0)
  );

  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: months.map(m => {
        const [y, mo] = m.split('-');
        return new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }),
      datasets: [{
        label: 'Total Spent',
        data: monthlyTotals,
        backgroundColor: 'rgba(16,185,129,0.6)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: '#21262d' },
          ticks: { color: '#8b949e' }
        },
        y: {
          grid: { color: '#21262d' },
          ticks: {
            color: '#8b949e',
            callback: val => `$${val}`
          }
        }
      }
    }
  });
}

function getLast6Months() {
  const months = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}`);
  }
  return months;
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

filterCategory.addEventListener('change', renderList);
filterMonth.addEventListener('change', () => { renderStats(); renderList(); });

// Init
loadExpenses();
