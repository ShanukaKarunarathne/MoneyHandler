const Expenses = require('../models/expenses');
const dotenv = require('dotenv');

dotenv.config();

// Verify password middleware
function verifyPassword(req, res, next) {
  const { password } = req.body;
  
  if (password !== process.env.REPORT_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  next();
}

// Get all expenses
function getAllExpenses(req, res) {
  Expenses.getAllExpenses((err, expenses) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch expenses' });
    }
    res.json(expenses);
  });
}

// Get expenses by date
function getExpensesByDate(req, res) {
  const date = req.params.date;
  
  Expenses.getExpensesByDate(date, (err, expenses) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch expenses for date' });
    }
    res.json(expenses);
  });
}

// Add new expense
function addExpense(req, res) {
  const { type, amount, date } = req.body;
  
  if (!type || !amount || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const expense = {
    type,
    amount: parseFloat(amount),
    date
  };
  
  Expenses.addExpense(expense, (err, id) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to add expense' });
    }
    res.status(201).json({ id, message: 'Expense added successfully' });
  });
}

// Update expense
function updateExpense(req, res) {
  const id = req.params.id;
  const { type, amount, date } = req.body;
  
  if (!type || !amount || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const expense = {
    type,
    amount: parseFloat(amount),
    date
  };
  
  Expenses.updateExpense(id, expense, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update expense' });
    }
    res.json({ message: 'Expense updated successfully' });
  });
}

// Delete expense
function deleteExpense(req, res) {
  const id = req.params.id;
  
  Expenses.deleteExpense(id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete expense' });
    }
    res.json({ message: 'Expense deleted successfully' });
  });
}

module.exports = {
  verifyPassword,
  getAllExpenses,
  getExpensesByDate,
  addExpense,
  updateExpense,
  deleteExpense
};
