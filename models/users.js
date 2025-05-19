const { db } = require('./database');
const bcrypt = require('bcrypt');

// Add a user
function addUser(username, password, callback) {
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return callback(err);
    }
    
    db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, hash],
      function(err) {
        callback(err, this.lastID);
      }
    );
  });
}

// Verify user credentials
function verifyUser(username, password, callback) {
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return callback(err);
      }
      
      if (!user) {
        return callback(null, false);
      }
      
      bcrypt.compare(password, user.password_hash, (err, result) => {
        if (err) {
          return callback(err);
        }
        callback(null, result);
      });
    }
  );
}

module.exports = {
  addUser,
  verifyUser
};
