const Reports = require('../models/reports');
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

// Get daily summary
function getDailySummary(req, res) {
  // If date is not in params, use today's date
  const date = req.params.date || new Date().toISOString().split('T')[0];
  
  Reports.getDailySummary(date, (err, summary) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to generate daily summary' });
    }
    res.json(summary);
  });
}

// Generate and save daily report
function generateDailyReport(req, res) {
  // If date is not in params, use today's date
  const date = req.params.date || new Date().toISOString().split('T')[0];
  
  Reports.saveDailyReport(date, (err, filePath) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to generate daily report' });
    }
    res.json({ 
      message: 'Daily report generated successfully',
      filePath
    });
  });
}


module.exports = {
  verifyPassword,
  getDailySummary,
  generateDailyReport
};
