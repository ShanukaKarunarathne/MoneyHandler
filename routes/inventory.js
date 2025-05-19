const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Get all inventory items
router.get('/', inventoryController.getAllItems);

// Search inventory items
router.get('/search', inventoryController.searchItems);

// Add new inventory item
router.post('/', inventoryController.addItem);

// Delete inventory item
router.delete('/:id', inventoryController.deleteItem);

// Get a single inventory item
router.get('/:id', inventoryController.getItemById);

// Update inventory item
router.put('/:id', inventoryController.updateItem);

module.exports = router;
