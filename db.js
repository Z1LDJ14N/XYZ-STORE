const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'users.json');

class Database {
  // Read database
  static readDB() {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return { users: [], transactions: [] };
    }
  }

  // Write database
  static writeDB(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error('Database write error:', err);
      return false;
    }
  }

  // Get user by email
  static getUserByEmail(email) {
    const db = this.readDB();
    return db.users.find(u => u.email === email);
  }

  // Create user
  static createUser(userData) {
    const db = this.readDB();
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString(),
      messagesCount: 0,
      lastLogin: new Date().toISOString()
    };
    db.users.push(newUser);
    this.writeDB(db);
    return newUser;
  }

  // Update user
  static updateUser(email, updateData) {
    const db = this.readDB();
    const userIndex = db.users.findIndex(u => u.email === email);
    if (userIndex !== -1) {
      db.users[userIndex] = { ...db.users[userIndex], ...updateData };
      this.writeDB(db);
      return db.users[userIndex];
    }
    return null;
  }

  // Add transaction
  static addTransaction(transactionData) {
    const db = this.readDB();
    const newTransaction = {
      id: `txn_${Date.now()}`,
      ...transactionData,
      date: new Date().toISOString()
    };
    db.transactions.push(newTransaction);
    this.writeDB(db);
    return newTransaction;
  }

  // Increment message count
  static incrementMessages(email) {
    const db = this.readDB();
    const userIndex = db.users.findIndex(u => u.email === email);
    if (userIndex !== -1) {
      db.users[userIndex].messagesCount += 1;
      this.writeDB(db);
      return db.users[userIndex].messagesCount;
    }
    return 0;
  }
}

module.exports = Database;
