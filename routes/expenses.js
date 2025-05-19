const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expensesController');

// Get all expenses (password protected)
router.post('/all', expensesController.verifyPassword, expensesController.getAllExpenses);

// Get expenses by date (password protected)
router.post('/date/:date', expensesController.verifyPassword, expensesController.getExpensesByDate);

// Add new expense (password protected)
router.post('/', expensesController.verifyPassword, expensesController.addExpense);

// Update expense (password protected)
router.put('/:id', expensesController.verifyPassword, expensesController.updateExpense);

// Delete expense (password protected)
router.delete('/:id', expensesController.verifyPassword, expensesController.deleteExpense);

module.exports = router;
