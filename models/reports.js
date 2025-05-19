const { db } = require('./database');
const fs = require('fs');
const path = require('path');

// Get daily summary (sales, expenses, profit)
function getDailySummary(date, callback) {
  // Get total sales for the day
  db.get(
    'SELECT SUM(total_amount) as total_sales FROM sales WHERE sale_date = ?',
    [date],
    (err, salesResult) => {
      if (err) {
        return callback(err);
      }
      
      // Get total expenses for the day
      db.get(
        'SELECT SUM(amount) as total_expenses FROM expenses WHERE date = ?',
        [date],
        (err, expensesResult) => {
          if (err) {
            return callback(err);
          }
          
          const totalSales = salesResult.total_sales || 0;
          const totalExpenses = expensesResult.total_expenses || 0;
          const profit = totalSales - totalExpenses;
          
          callback(null, {
            date,
            totalSales,
            totalExpenses,
            profit
          });
        }
      );
    }
  );
}

// Save daily report to file
function saveDailyReport(date, callback) {
  getDailySummary(date, (err, summary) => {
    if (err) {
      return callback(err);
    }
    
    const reportContent = `
Daily Report for ${date}
-----------------------
Total Sales: $${summary.totalSales.toFixed(2)}
Total Expenses: Rs.${summary.totalExpenses.toFixed(2)}
Profit: Rs.${summary.profit.toFixed(2)}
-----------------------
Generated on: ${new Date().toISOString()}
    `;
    
    const filePath = path.join(__dirname, '..', 'data', `report-${date}.txt`);
    fs.writeFile(filePath, reportContent, (err) => {
      if (err) {
        return callback(err);
      }
      callback(null, filePath);
    });
  });
}

module.exports = {
  getDailySummary,
  saveDailyReport
};
