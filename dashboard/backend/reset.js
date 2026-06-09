const Database = require('better-sqlite3');
const db = new Database('catering.db');

db.exec("DELETE FROM orders");
db.exec("DELETE FROM menus");
db.exec("DELETE FROM settings");
db.exec("DELETE FROM sqlite_sequence");

console.log('Database cleared!');
db.close();