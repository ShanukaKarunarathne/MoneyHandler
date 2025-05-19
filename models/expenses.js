const { db } = require('./database');

// Get all expenses
function getAllExpenses(callback) {
  db.all('SELECT * FROM expenses ORDER BY date DESC', callback);
}

// Get expenses by date
function getExpensesByDate(date, callback) {
  db.all('SELECT * FROM expenses WHERE date = ?', [date], callback);
}

// Add new expense
function addExpense(expense, callback) {
  const { type, amount, date } = expense;
  
  db.run(
    'INSERT INTO expenses (type, amount, date) VALUES (?, ?, ?)',
    [type, amount, date],
    function(err) {
      callback(err, this.lastID);
    }
  );
}

// Update expense
function updateExpense(id, expense, callback) {
  const { type, amount, date } = expense;
  
  db.run(
    'UPDATE expenses SET type = ?, amount = ?, date = ? WHERE id = ?',
    [type, amount, date, id],
    callback
  );
}

// Delete expense
function deleteExpense(id, callback) {
  db.run('DELETE FROM expenses WHERE id = ?', [id], callback);
}

module.exports = {
  getAllExpenses,
  getExpensesByDate,
  addExpense,
  updateExpense,
  deleteExpense
};
