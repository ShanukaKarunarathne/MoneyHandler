const Sales = require('../models/sales');
const Inventory = require('../models/inventory');
const fs = require('fs');
const path = require('path');

// Get all sales
function getAllSales(req, res) {
  Sales.getAllSales((err, sales) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch sales' });
    }
    res.json(sales);
  });
}

// Get sales by date
function getSalesByDate(req, res) {
  const date = req.params.date;
  
  Sales.getSalesByDate(date, (err, sales) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch sales for date' });
    }
    res.json(sales);
  });
}

// Get sale details
function getSaleDetails(req, res) {
  const id = req.params.id;
  
  Sales.getSaleById(id, (err, sale) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch sale details' });
    }
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  });
}

// Create new sale
function createSale(req, res) {
  const { customer_name, customer_phone, items } = req.body;
  
  if (!customer_name || !customer_phone || !items || !items.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Calculate total amount
  let total_amount = 0;
  items.forEach(item => {
    total_amount += item.quantity * item.sell_price;
  });
  
  const sale = {
    customer_name,
    customer_phone,
    total_amount,
    items
  };
  
  Sales.createSale(sale, (err, saleId) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create sale' });
    }
    
    // Generate receipt
    generateReceipt(saleId, sale, (err, receiptPath) => {
      if (err) {
        console.error('Failed to generate receipt:', err);
      }
      
      res.status(201).json({ 
        id: saleId, 
        message: 'Sale created successfully',
        receipt: receiptPath
      });
    });
  });
}

// Generate receipt
function generateReceipt(saleId, sale, callback) {
  const today = new Date().toISOString().split('T')[0];
  const receiptContent = `
SALES RECEIPT
-------------
Receipt #: ${saleId}
Date: ${today}
Customer: ${sale.customer_name}
Phone: ${sale.customer_phone}

ITEMS:
${sale.items.map(item => `${item.quantity} x ${item.name || 'Item'} (${item.model || ''}) @ $${item.sell_price.toFixed(2)} = $${(item.quantity * item.sell_price).toFixed(2)}`).join('\n')}

TOTAL: Rs.${sale.total_amount.toFixed(2)}
-------------
Thank you for your business!
  `;
  
  const receiptPath = path.join(__dirname, '..', 'data', `receipt-${saleId}-${today}.txt`);
  fs.writeFile(receiptPath, receiptContent, (err) => {
    callback(err, receiptPath);
  });
}

// Delete sale
function deleteSale(req, res) {
  const id = req.params.id;
  
  Sales.deleteSale(id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete sale' });
    }
    res.json({ message: 'Sale deleted successfully' });
  });
}

module.exports = {
  getAllSales,
  getSalesByDate,
  getSaleDetails,
  createSale,
  deleteSale
};
