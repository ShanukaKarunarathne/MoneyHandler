// Global variables
let inventoryItems = [];
let saleItems = [];
let expensesList = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('today-date').textContent = formatDate(today);
  document.getElementById('expense-date').value = today;
  document.getElementById('report-date').value = today;
  
  // Load dashboard data
  loadDashboardData();
  
  // Add event listener for inventory search
  document.getElementById('inventory-search').addEventListener('input', debounce(searchInventory, 300));
});

// Show section and hide others
// Show section and hide others
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Load section-specific data
    if (sectionId === 'dashboard') {
      loadDashboardData();
    } else if (sectionId === 'add-item') {
      loadInventory(); // Load inventory when Add Item tab is selected
    }
  }
  

// Format date for display
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Debounce function for search
function debounce(func, delay) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// Load dashboard data
function loadDashboardData() {
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's summary
  fetch(`/api/reports/daily/${today}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: '' }) // We'll handle the error if needed
  })
  .then(response => {
    if (response.ok) return response.json();
    return { totalSales: 0, totalExpenses: 0, profit: 0 };
  })
  .then(data => {
    document.getElementById('today-sales').textContent = data.totalSales.toFixed(2);
    document.getElementById('today-expenses').textContent = data.totalExpenses.toFixed(2);
    document.getElementById('today-profit').textContent = data.profit.toFixed(2);
  })
  .catch(error => console.error('Error loading dashboard summary:', error));
  
  // Get recent sales
  fetch('/api/sales')
    .then(response => response.json())
    .then(data => {
      const tbody = document.querySelector('#recent-sales tbody');
      tbody.innerHTML = '';
      
      data.slice(0, 10).forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${sale.id}</td>
          <td>${formatDate(sale.sale_date)}</td>
          <td>${sale.customer_name}</td>
          <td>$${sale.total_amount.toFixed(2)}</td>
          <td>
            <button onclick="viewSaleDetails(${sale.id})">View</button>
            <button onclick="deleteSale(${sale.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(error => console.error('Error loading recent sales:', error));
}

// Add Item functions
function addItemRow() {
  const itemForm = document.getElementById('item-form');
  const newRow = document.createElement('div');
  newRow.className = 'item-row';
  newRow.innerHTML = `
    <input type="text" placeholder="Name" class="name">
    <select class="category" onchange="toggleImeiField(this)">
      <option value="">Select Category</option>
      <option value="phone">Phone</option>
      <option value="accessory">Accessory</option>
      <option value="other">Other</option>
    </select>
    <input type="text" placeholder="Model" class="model">
    <input type="text" placeholder="IMEI (for phones)" class="imei" disabled>
    <input type="number" placeholder="Buy Price" class="buy-price" step="0.01">
    <input type="number" placeholder="Quantity" class="quantity" value="1" min="1">
    <button onclick="removeItemRow(this)">Remove</button>
  `;
  itemForm.appendChild(newRow);
}

function toggleImeiField(select) {
  const imeiField = select.parentElement.querySelector('.imei');
  imeiField.disabled = select.value !== 'phone';
  if (select.value !== 'phone') {
    imeiField.value = '';
  }
}

function removeItemRow(button) {
  const rows = document.querySelectorAll('.item-row');
  if (rows.length > 1) {
    button.parentElement.remove();
  } else {
    alert('You need at least one item row.');
  }
}

// Submit all items
function submitItems() {
  const items = [];
  
  document.querySelectorAll('.item-row').forEach(row => {
    const name = row.querySelector('.name').value.trim();
    const category = row.querySelector('.category').value;
    const model = row.querySelector('.model').value.trim();
    const imei = row.querySelector('.imei').value.trim();
    const buyPrice = row.querySelector('.buy-price').value;
    const quantity = row.querySelector('.quantity').value;
    
    if (name && category && model && buyPrice && quantity) {
      items.push({
        name,
        category,
        model,
        imei: category === 'phone' ? imei : null,
        buy_price: parseFloat(buyPrice),
        quantity: parseInt(quantity)
      });
    }
  });
  
  if (items.length === 0) {
    alert('Please fill in at least one item completely.');
    return;
  }
  
  // Submit items one by one
  let completed = 0;
  let errors = 0;
  
  items.forEach(item => {
    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    .then(response => {
      if (!response.ok) {
        errors++;
        throw new Error('Failed to add item');
      }
      return response.json();
    })
    .then(data => {
      completed++;
      if (completed === items.length) {
        if (errors > 0) {
          alert(`Added ${completed - errors} items. ${errors} items failed.`);
        } else {
          // No success alert, just clear the form and refresh inventory
          // Clear form
          document.querySelectorAll('.item-row').forEach((row, index) => {
            if (index > 0) {
              row.remove();
            } else {
              row.querySelector('.name').value = '';
              row.querySelector('.category').value = '';
              row.querySelector('.model').value = '';
              row.querySelector('.imei').value = '';
              row.querySelector('.buy-price').value = '';
              row.querySelector('.quantity').value = '1';
            }
          });
          
          // Refresh inventory display
          loadInventory();
        }
      }
    })
    .catch(error => {
      console.error('Error adding item:', error);
      completed++;
      errors++;
      if (completed === items.length) {
        alert(`Added ${completed - errors} items. ${errors} items failed.`);
      }
    });
  });
}


// Sell functions
function searchInventory() {
  const query = document.getElementById('inventory-search').value.trim();
  
  if (query.length < 2) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  
  fetch(`/api/inventory/search?q=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(data => {
      inventoryItems = data;
      displaySearchResults(data);
    })
    .catch(error => console.error('Error searching inventory:', error));
}

function displaySearchResults(items) {
  const resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '';
  
  if (items.length === 0) {
    resultsDiv.innerHTML = '<p>No items found.</p>';
    return;
  }
  
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Category</th>
        <th>Model</th>
        <th>IMEI</th>
        <th>Price</th>
        <th>Available</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  
  const tbody = table.querySelector('tbody');
  
  items.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.model}</td>
      <td>${item.imei || '-'}</td>
      <td>$${item.buy_price.toFixed(2)}</td>
      <td>${item.quantity}</td>
      <td>
        <button onclick="addToSale(${item.id})" ${item.quantity <= 0 ? 'disabled' : ''}>
          Add to Sale
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  resultsDiv.appendChild(table);
}

function addToSale(itemId) {
  const item = inventoryItems.find(i => i.id === itemId);
  
  if (!item || item.quantity <= 0) {
    alert('Item is out of stock.');
    return;
  }
  
  // Check if item is already in sale
  const existingItem = saleItems.find(i => i.id === itemId);
  
  if (existingItem) {
    if (existingItem.quantity >= item.quantity) {
      alert('Cannot add more of this item. Maximum quantity reached.');
      return;
    }
    existingItem.quantity++;
    existingItem.total = existingItem.quantity * existingItem.sell_price;
  } else {
    // Add new item to sale
    saleItems.push({
      id: item.id,
      name: item.name,
      model: item.model,
      imei: item.imei,
      buy_price: item.buy_price,
      sell_price: item.buy_price * 1.2, // Default markup of 20%
      quantity: 1,
      total: item.buy_price * 1.2
    });
  }
  
  updateSaleItemsTable();
}

function updateSaleItemsTable() {
  const tbody = document.querySelector('#sale-items tbody');
  tbody.innerHTML = '';
  
  if (saleItems.length === 0) {
    return;
  }
  
  saleItems.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.model}</td>
      <td>${item.imei || '-'}</td>
      <td>$${item.buy_price.toFixed(2)}</td>
      <td>
        <input type="number" value="${item.sell_price.toFixed(2)}" step="0.01" min="${item.buy_price.toFixed(2)}" 
          onchange="updateSellPrice(${index}, this.value)">
      </td>
      <td>
        <input type="number" value="${item.quantity}" min="1" 
          onchange="updateQuantity(${index}, this.value)">
      </td>
      <td>$${item.total.toFixed(2)}</td>
      <td>
        <button onclick="removeSaleItem(${index})">Remove</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function updateSellPrice(index, price) {
  price = parseFloat(price);
  if (isNaN(price)) {
    alert('Please enter a valid number for the sell price.');
    updateSaleItemsTable();
    return;
  }
  
  // Check if sell price is lower than buy price and confirm with user
  if (price < saleItems[index].buy_price) {
    if (!confirm('The sell price is lower than the buy price. This will result in a loss. Do you want to continue?')) {
      updateSaleItemsTable();
      return;
    }
  }
  
  saleItems[index].sell_price = price;
  saleItems[index].total = price * saleItems[index].quantity;
  updateSaleItemsTable();
}


function updateQuantity(index, quantity) {
  quantity = parseInt(quantity);
  if (isNaN(quantity) || quantity < 1) {
    alert('Quantity must be at least 1.');
    updateSaleItemsTable();
    return;
  }
  
  // Check available quantity
  const itemId = saleItems[index].id;
  const inventoryItem = inventoryItems.find(i => i.id === itemId);
  
  if (quantity > inventoryItem.quantity) {
    alert(`Only ${inventoryItem.quantity} available in stock.`);
    saleItems[index].quantity = inventoryItem.quantity;
  } else {
    saleItems[index].quantity = quantity;
  }
  
  saleItems[index].total = saleItems[index].sell_price * saleItems[index].quantity;
  updateSaleItemsTable();
}

function removeSaleItem(index) {
  saleItems.splice(index, 1);
  updateSaleItemsTable();
}

function processSale() {
  if (saleItems.length === 0) {
    alert('Please add items to the sale.');
    return;
  }
  
  const customerName = document.getElementById('customer-name').value.trim();
  const customerPhone = document.getElementById('customer-phone').value.trim();
  
  if (!customerName || !customerPhone) {
    alert('Please enter customer information.');
    return;
  }
  
  // Confirm before processing sale
  if (!confirm('Are you sure you want to complete this sale?')) {
    return;
  }
  
  const saleData = {
    customer_name: customerName,
    customer_phone: customerPhone,
    items: saleItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      sell_price: item.sell_price
    }))
  };
  
  fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to process sale');
    }
    return response.json();
  })
  .then(data => {
    // No success alert, just clear the form and refresh
    
    // Clear sale items
    saleItems = [];
    updateSaleItemsTable();
    
    // Clear customer info
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
    
    // Clear search
    document.getElementById('inventory-search').value = '';
    document.getElementById('search-results').innerHTML = '';
    
    // Refresh dashboard
    loadDashboardData();
  })
  .catch(error => {
    console.error('Error processing sale:', error);
    alert('Failed to process sale. Please try again.');
  });
}


// View sale details
function viewSaleDetails(saleId) {
  fetch(`/api/sales/${saleId}`)
    .then(response => response.json())
    .then(sale => {
      let details = `
        Sale #${sale.id}\n
        Date: ${formatDate(sale.sale_date)}\n
        Customer: ${sale.customer_name}\n
        Phone: ${sale.customer_phone}\n\n
        Items:\n`;
      
      sale.items.forEach(item => {
        details += `- ${item.quantity} x ${item.name} (${item.model || ''}) @ $${item.sell_price.toFixed(2)} = $${(item.quantity * item.sell_price).toFixed(2)}\n`;
      });
      
      details += `\nTotal: $${sale.total_amount.toFixed(2)}`;
      
      alert(details);
    })
    .catch(error => {
      console.error('Error fetching sale details:', error);
      alert('Failed to fetch sale details.');
    });
}

// Delete sale
function deleteSale(saleId) {
  if (!confirm('Are you sure you want to delete this sale? This will return items to inventory and cannot be undone.')) {
    return;
  }
  
  fetch(`/api/sales/${saleId}`, {
    method: 'DELETE'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to delete sale');
    }
    return response.json();
  })
  .then(data => {
    // No success alert, just refresh dashboard
    loadDashboardData();
  })
  .catch(error => {
    console.error('Error deleting sale:', error);
    alert('Failed to delete sale. Please try again.');
  });
}


// Expenses functions
function verifyExpensesPassword() {
  const password = document.getElementById('expenses-password').value;
  
  fetch('/api/expenses/all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Invalid password');
    }
    return response.json();
  })
  .then(data => {
    // Show expenses content
    document.getElementById('expenses-password-prompt').style.display = 'none';
    document.getElementById('expenses-content').style.display = 'block';
    
    // Load expenses
    expensesList = data;
    displayExpenses(data);
  })
  .catch(error => {
    console.error('Error verifying password:', error);
    alert('Invalid password. Please try again.');
  });
}

function displayExpenses(expenses) {
  const tbody = document.querySelector('#expense-list tbody');
  tbody.innerHTML = '';
  
  expenses.forEach(expense => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(expense.date)}</td>
      <td>${expense.type}</td>
      <td>$${expense.amount.toFixed(2)}</td>
      <td>
        <button onclick="editExpense(${expense.id})">Edit</button>
        <button onclick="deleteExpense(${expense.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function addExpense() {
  const type = document.getElementById('expense-type').value;
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const date = document.getElementById('expense-date').value;
  
  if (!type || isNaN(amount) || amount <= 0 || !date) {
    alert('Please fill in all expense fields correctly.');
    return;
  }
  
  // Confirm before adding expense
  if (!confirm('Are you sure you want to add this expense?')) {
    return;
  }
  
  const password = document.getElementById('expenses-password').value;
  
  fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, type, amount, date })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to add expense');
    }
    return response.json();
  })
  .then(data => {
    // No success alert, just clear form and refresh
    
    // Clear form
    document.getElementById('expense-type').value = '';
    document.getElementById('expense-amount').value = '';
    
    // Refresh expenses list
    verifyExpensesPassword();
    
    // Refresh dashboard
    loadDashboardData();
  })
  .catch(error => {
    console.error('Error adding expense:', error);
    alert('Failed to add expense. Please try again.');
  });
}

function editExpense(expenseId) {
  const expense = expensesList.find(e => e.id === expenseId);
  if (!expense) return;
  
  const newType = prompt('Enter expense type:', expense.type);
  if (!newType) return;
  
  const newAmount = parseFloat(prompt('Enter amount:', expense.amount));
  if (isNaN(newAmount) || newAmount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }
  
  const newDate = prompt('Enter date (YYYY-MM-DD):', expense.date);
  if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    alert('Please enter a valid date in YYYY-MM-DD format.');
    return;
  }
  
  const password = document.getElementById('expenses-password').value;
  
  fetch(`/api/expenses/${expenseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, type: newType, amount: newAmount, date: newDate })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update expense');
    }
    return response.json();
  })
  .then(data => {
    alert('Expense updated successfully!');
    // Refresh expenses list
    verifyExpensesPassword();
    // Refresh dashboard
    loadDashboardData();
  })

  .catch(error => {
    console.error('Error updating expense:', error);
    alert('Failed to update expense. Please try again.');
  });
}

function deleteExpense(expenseId) {
  if (!confirm('Are you sure you want to delete this expense?')) {
    return;
  }
  
  const password = document.getElementById('expenses-password').value;
  
  fetch(`/api/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }
    return response.json();
  })
  .then(data => {
    alert('Expense deleted successfully!');
    // Refresh expenses list
    verifyExpensesPassword();
    // Refresh dashboard
    loadDashboardData();
  })
  .catch(error => {
    console.error('Error deleting expense:', error);
    alert('Failed to delete expense. Please try again.');
  });
}

// Reports functions
function verifyReportsPassword() {
  const password = document.getElementById('reports-password').value;
  
  // Verify password by trying to get a report
  fetch('/api/reports/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Invalid password');
    }
    return response.json();
  })
  .then(data => {
    // Show reports content
    document.getElementById('reports-password-prompt').style.display = 'none';
    document.getElementById('reports-content').style.display = 'block';
  })
  .catch(error => {
    console.error('Error verifying password:', error);
    alert('Invalid password. Please try again.');
  });
}

// In the generateDailyReport function:
function generateDailyReport() {
  const date = document.getElementById('report-date').value;
  const password = document.getElementById('reports-password').value;
  
  // Use the correct endpoint based on whether a date is provided
  const endpoint = date ? `/api/reports/daily/${date}` : '/api/reports/daily';
  
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to generate report');
    }
    return response.json();
  })
  .then(data => {
    // Display report summary
    document.getElementById('report-summary').style.display = 'block';
    document.getElementById('report-date-display').textContent = formatDate(date || new Date().toISOString().split('T')[0]);
    document.getElementById('report-sales').textContent = data.totalSales.toFixed(2);
    document.getElementById('report-expenses').textContent = data.totalExpenses.toFixed(2);
    document.getElementById('report-profit').textContent = data.profit.toFixed(2);
  })
  .catch(error => {
    console.error('Error generating report:', error);
    alert('Failed to generate report. Please try again.');
  });
}

// Similarly update the exportReport function:
function exportReport() {
  const date = document.getElementById('report-date').value;
  const password = document.getElementById('reports-password').value;
  
  // Use the correct endpoint based on whether a date is provided
  const endpoint = date ? `/api/reports/generate/${date}` : '/api/reports/generate';
  
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to export report');
    }
    return response.json();
  })
  .then(data => {
    alert(`Report exported successfully to: ${data.filePath}`);
  })
  .catch(error => {
    console.error('Error exporting report:', error);
    alert('Failed to export report. Please try again.');
  });
}

// Load inventory items
function loadInventory() {
  fetch('/api/inventory')
    .then(response => response.json())
    .then(data => {
      displayInventory(data);
    })
    .catch(error => {
      console.error('Error loading inventory:', error);
      alert('Failed to load inventory. Please try again.');
    });
}

// Display inventory items in table
function displayInventory(items) {
  const tbody = document.querySelector('#inventory-table tbody');
  tbody.innerHTML = '';
  
  if (items.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="9" style="text-align: center;">No items in inventory</td>';
    tbody.appendChild(row);
    return;
  }
  
  items.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.model}</td>
      <td>${item.imei || '-'}</td>
      <td>$${item.buy_price.toFixed(2)}</td>
      <td>${item.quantity}</td>
      <td>${formatDate(item.created_at)}</td>
      <td>
        <button onclick="editInventoryItem(${item.id})">Edit</button>
        <button onclick="deleteInventoryItem(${item.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Edit inventory item
function editInventoryItem(id) {
  // Get the item details
  fetch(`/api/inventory/${id}`)
    .then(response => response.json())
    .then(item => {
      // Prompt for new values
      const newName = prompt('Enter name:', item.name);
      if (!newName) return;
      
      const newCategory = prompt('Enter category (phone, accessory, other):', item.category);
      if (!newCategory) return;
      
      const newModel = prompt('Enter model:', item.model);
      if (!newModel) return;
      
      let newImei = null;
      if (newCategory.toLowerCase() === 'phone') {
        newImei = prompt('Enter IMEI:', item.imei || '');
        if (!newImei) return;
      }
      
      const newBuyPrice = parseFloat(prompt('Enter buy price:', item.buy_price));
      if (isNaN(newBuyPrice) || newBuyPrice <= 0) {
        alert('Please enter a valid buy price.');
        return;
      }
      
      const newQuantity = parseInt(prompt('Enter quantity:', item.quantity));
      if (isNaN(newQuantity) || newQuantity < 0) {
        alert('Please enter a valid quantity.');
        return;
      }
      
      // Confirm before saving changes
      if (!confirm('Are you sure you want to save these changes?')) {
        return;
      }
      
      // Update the item
      fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          category: newCategory,
          model: newModel,
          imei: newImei,
          buy_price: newBuyPrice,
          quantity: newQuantity
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to update item');
        }
        return response.json();
      })
      .then(data => {
        // No success alert, just refresh inventory
        loadInventory();
      })
      .catch(error => {
        console.error('Error updating item:', error);
        alert('Failed to update item. Please try again.');
      });
    })
    .catch(error => {
      console.error('Error fetching item details:', error);
      alert('Failed to fetch item details. Please try again.');
    });
}


// Delete inventory item
function deleteInventoryItem(id) {
  if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
    return;
  }
  
  fetch(`/api/inventory/${id}`, {
    method: 'DELETE'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to delete item');
    }
    return response.json();
  })
  .then(data => {
    // No success alert, just refresh the inventory
    loadInventory();
  })
  .catch(error => {
    console.error('Error deleting item:', error);
    alert('Failed to delete item. Please try again.');
  });
}



// Initialize event listeners for category changes
document.querySelectorAll('.category').forEach(select => {
  select.addEventListener('change', function() {
    toggleImeiField(this);
  });
});

