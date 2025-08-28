// Simple script to get latest OTP without Prisma issues
const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

// Get latest OTP for test@example.com
db.get(
  "SELECT otpCode, otpExpiry FROM User WHERE email = ? ORDER BY updatedAt DESC LIMIT 1",
  ['test@example.com'],
  (err, row) => {
    if (err) {
      console.error('Error querying database:', err.message);
    } else if (row) {
      console.log('Latest OTP:', row.otpCode);
      console.log('OTP Expiry:', row.otpExpiry);
      console.log('Current time:', new Date().toISOString());
    } else {
      console.log('No OTP found for test@example.com');
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      }
    });
  }
);