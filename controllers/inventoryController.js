const Inventory = require('../models/inventory');

// Get all inventory items
function getAllItems(req, res) {
  Inventory.getAllItems((err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch inventory items' });
    }
    res.json(items);
  });
}

// Search inventory items
function searchItems(req, res) {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  Inventory.searchItems(query, (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to search inventory' });
    }
    res.json(items);
  });
}

// Add new inventory item
function addItem(req, res) {
  const { name, category, model, imei, buy_price, quantity } = req.body;
  
  if (!name || !category || !model || !buy_price || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const item = {
    name,
    category,
    model,
    imei: category.toLowerCase() === 'phone' ? imei : null,
    buy_price: parseFloat(buy_price),
    quantity: parseInt(quantity)
  };
  
  Inventory.addItem(item, (err, id) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to add inventory item' });
    }
    res.status(201).json({ id, message: 'Item added successfully' });
  });
}

// Delete inventory item
function deleteItem(req, res) {
  const id = req.params.id;
  
  Inventory.deleteItem(id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete inventory item' });
    }
    res.json({ message: 'Item deleted successfully' });
  });
}

// Get a single inventory item by ID
function getItemById(req, res) {
  const id = req.params.id;
  
  Inventory.getItemById(id, (err, item) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch inventory item' });
    }
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  });
}

// Update inventory item
function updateItem(req, res) {
  const id = req.params.id;
  const { name, category, model, imei, buy_price, quantity } = req.body;
  
  if (!name || !category || !model || !buy_price || quantity === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const item = {
    name,
    category,
    model,
    imei: category.toLowerCase() === 'phone' ? imei : null,
    buy_price: parseFloat(buy_price),
    quantity: parseInt(quantity)
  };
  
  Inventory.updateItem(id, item, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update inventory item' });
    }
    res.json({ message: 'Item updated successfully' });
  });
}


// Add this to your exports
module.exports = {
  getAllItems,
  searchItems,
  addItem,
  deleteItem,
  getItemById, // Add this line
  updateItem    // Make sure this is also exported if you have it
};

