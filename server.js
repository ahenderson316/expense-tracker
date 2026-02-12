const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = process.env.VERCEL
  ? '/tmp/expenses.json'
  : path.join(__dirname, 'expenses.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize data file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function readExpenses() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeExpenses(expenses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}

// GET all expenses
app.get('/api/expenses', (req, res) => {
  let expenses = readExpenses();

  // Optional filters
  if (req.query.category) {
    expenses = expenses.filter(e => e.category === req.query.category);
  }
  if (req.query.month) {
    expenses = expenses.filter(e => e.date.startsWith(req.query.month));
  }

  res.json(expenses);
});

// POST create expense
app.post('/api/expenses', (req, res) => {
  const { title, amount, category, date, note } = req.body;
  if (!title || !amount || !category || !date) {
    return res.status(400).json({ error: 'title, amount, category, and date are required' });
  }
  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }
  const expenses = readExpenses();
  const newExpense = {
    id: Date.now().toString(),
    title,
    amount: parseFloat(parseFloat(amount).toFixed(2)),
    category,
    date,
    note: note || '',
    createdAt: new Date().toISOString()
  };
  expenses.unshift(newExpense);
  writeExpenses(expenses);
  res.status(201).json(newExpense);
});

// PUT update expense
app.put('/api/expenses/:id', (req, res) => {
  const expenses = readExpenses();
  const index = expenses.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Expense not found' });
  expenses[index] = { ...expenses[index], ...req.body, id: expenses[index].id };
  writeExpenses(expenses);
  res.json(expenses[index]);
});

// DELETE expense
app.delete('/api/expenses/:id', (req, res) => {
  const expenses = readExpenses();
  const filtered = expenses.filter(e => e.id !== req.params.id);
  if (filtered.length === expenses.length) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  writeExpenses(filtered);
  res.json({ message: 'Expense deleted' });
});

// GET summary stats
app.get('/api/expenses/summary', (req, res) => {
  const expenses = readExpenses();
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });
  res.json({ total: parseFloat(total.toFixed(2)), byCategory });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Expense Tracker running at http://localhost:${PORT}`);
  });
}

module.exports = app;
