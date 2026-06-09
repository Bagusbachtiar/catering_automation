const db = require('better-sqlite3')('catering.db');
const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'").get();
console.log(row.sql);
