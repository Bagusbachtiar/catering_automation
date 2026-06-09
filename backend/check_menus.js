const db = require('better-sqlite3')('catering.db');
const rows = db.prepare('SELECT name, price_per_person FROM menus').all();
console.log(JSON.stringify(rows, null, 2));
