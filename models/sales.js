const { db } = require('./database');

// Get all sales
function getAllSales(callback) {
  db.all('SELECT * FROM sales ORDER BY sale_date DESC', callback);
}

// Get sales by date
function getSalesByDate(date, callback) {
  db.all('SELECT * FROM sales WHERE sale_date = ?', [date], callback);
}

// Get sale by ID with items
function getSaleById(id, callback) {
  db.get('SELECT * FROM sales WHERE id = ?', [id], (err, sale) => {
    if (err || !sale) {
      return callback(err, null);
    }
    
    db.all(
      `SELECT si.*, i.name, i.model, i.imei 
       FROM sale_items si 
       JOIN inventory i ON si.item_id = i.id 
       WHERE si.sale_id = ?`,
      [id],
      (err, items) => {
        if (err) {
          return callback(err, null);
        }
        sale.items = items;
        callback(null, sale);
      }
    );
  });
}

// Create new sale
function createSale(sale, callback) {
  const { customer_name, customer_phone, total_amount, items } = sale;
  const sale_date = new Date().toISOString().split('T')[0];
  
  db.run(
    'INSERT INTO sales (sale_date, customer_name, customer_phone, total_amount) VALUES (?, ?, ?, ?)',
    [sale_date, customer_name, customer_phone, total_amount],
    function(err) {
      if (err) {
        return callback(err);
      }
      
      const saleId = this.lastID;
      let completed = 0;
      let hasError = false;
      
      items.forEach(item => {
        db.run(
          'INSERT INTO sale_items (sale_id, item_id, quantity, sell_price) VALUES (?, ?, ?, ?)',
          [saleId, item.id, item.quantity, item.sell_price],
          (err) => {
            if (err && !hasError) {
              hasError = true;
              return callback(err);
            }
            
            // Update inventory quantity
            db.get('SELECT quantity FROM inventory WHERE id = ?', [item.id], (err, result) => {
              if (err || !result) {
                if (!hasError) {
                  hasError = true;
                  return callback(err || new Error('Inventory item not found'));
                }
                return;
              }
              
              const newQuantity = result.quantity - item.quantity;
              db.run(
                'UPDATE inventory SET quantity = ? WHERE id = ?',
                [newQuantity, item.id],
                (err) => {
                  if (err && !hasError) {
                    hasError = true;
                    return callback(err);
                  }
                  
                  completed++;
                  if (completed === items.length && !hasError) {
                    callback(null, saleId);
                  }
                }
              );
            });
          }
        );
      });
    }
  );
}

// Delete sale
function deleteSale(id, callback) {
  // First get the sale items to restore inventory
  db.all('SELECT * FROM sale_items WHERE sale_id = ?', [id], (err, saleItems) => {
    if (err) {
      return callback(err);
    }
    
    let completed = 0;
    let hasError = false;
    
    // Restore inventory quantities
    saleItems.forEach(item => {
      db.get('SELECT quantity FROM inventory WHERE id = ?', [item.item_id], (err, invItem) => {
        if (err || !invItem) {
          if (!hasError) {
            hasError = true;
            return callback(err || new Error('Inventory item not found'));
          }
          return;
        }
        
        const newQuantity = invItem.quantity + item.quantity;
        db.run(
          'UPDATE inventory SET quantity = ? WHERE id = ?',
          [newQuantity, item.item_id],
          (err) => {
            if (err && !hasError) {
              hasError = true;
              return callback(err);
            }
            
            completed++;
            if (completed === saleItems.length && !hasError) {
              // Delete sale items
              db.run('DELETE FROM sale_items WHERE sale_id = ?', [id], (err) => {
                if (err) {
                  return callback(err);
                }
                
                // Delete sale
                db.run('DELETE FROM sales WHERE id = ?', [id], callback);
              });
            }
          }
        );
      });
    });
    
    // If no items, just delete the sale
    if (saleItems.length === 0) {
      db.run('DELETE FROM sales WHERE id = ?', [id], callback);
    }
  });
}

module.exports = {
  getAllSales,
  getSalesByDate,
  getSaleById,
  createSale,
  deleteSale
};
