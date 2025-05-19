const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Get all sales
router.get('/', salesController.getAllSales);

// Get sales by date
router.get('/date/:date', salesController.getSalesByDate);

// Get sale details
router.get('/:id', salesController.getSaleDetails);

// Create new sale
router.post('/', salesController.createSale);

// Delete sale
router.delete('/:id', salesController.deleteSale);

module.exports = router;
