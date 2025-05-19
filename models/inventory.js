const { db } = require('./database');

// Get all inventory items
function getAllItems(callback) {
  db.all('SELECT * FROM inventory', callback);
}

// Get inventory item by ID
// Get a single inventory item by ID
function getItemById(id, callback) {
  const query = `SELECT * FROM inventory WHERE id = ?`;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error fetching inventory item:', err.message);
      return callback(err);
    }
    callback(null, row);
  });
}

// Search inventory items
function searchItems(query, callback) {
  const searchQuery = `%${query}%`;
  db.all(
    'SELECT * FROM inventory WHERE name LIKE ? OR model LIKE ? OR imei LIKE ?',
    [searchQuery, searchQuery, searchQuery],
    callback
  );
}

// Add new inventory item
function addItem(item, callback) {
  const { name, category, model, imei, buy_price, quantity } = item;
  const date_added = new Date().toISOString().split('T')[0];
  
  db.run(
    'INSERT INTO inventory (name, category, model, imei, buy_price, quantity, date_added) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, category, model, imei, buy_price, quantity, date_added],
    function(err) {
      callback(err, this.lastID);
    }
  );
}

// Update inventory quantity
function updateQuantity(id, newQuantity, callback) {
  db.run(
    'UPDATE inventory SET quantity = ? WHERE id = ?',
    [newQuantity, id],
    callback
  );
}

// Delete inventory item
function deleteItem(id, callback) {
  db.run('DELETE FROM inventory WHERE id = ?', [id], callback);
}

// Update inventory item
function updateItem(id, item, callback) {
  const query = `
    UPDATE inventory 
    SET name = ?, category = ?, model = ?, imei = ?, buy_price = ?, quantity = ?
    WHERE id = ?
  `;
  
  db.run(
    query, 
    [item.name, item.category, item.model, item.imei, item.buy_price, item.quantity, id],
    function(err) {
      if (err) {
        console.error('Error updating inventory item:', err.message);
        return callback(err);
      }
      callback(null);
    }
  );
}


module.exports = {
    getAllItems,
    searchItems,
    addItem,
    deleteItem,
    getItemById, // Add this line
    updateItem    // Make sure this is also exported if you have it
  };