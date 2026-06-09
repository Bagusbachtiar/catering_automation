const db = require('better-sqlite3')('catering.db');
const req = {
  body: {
    order_id: 'ORD-TEST-5',
    customer_name: 'test5',
    guest_count: 3,
    menu_items: [{"menu":"Dimsum Original","quantity":1},{"menu":"Dimsum Mentai","quantity":2}]
  }
};

const {
  order_id,
  customer_name,
  guest_count,
  menu_items,
  estimated_value,
} = req.body;

let finalMenuItemsStr = '';
let parsedMenuItems = menu_items;

if (typeof parsedMenuItems === 'string') {
  try { parsedMenuItems = JSON.parse(parsedMenuItems); } catch(e) { parsedMenuItems = null; }
}

console.log("Parsed Menu Items Type:", typeof parsedMenuItems, "IsArray:", Array.isArray(parsedMenuItems), "Value:", parsedMenuItems);

let finalEstimatedValue = parseFloat(estimated_value) || 0;

if (Array.isArray(parsedMenuItems)) {
  let calcTotalValue = 0;
  const enhancedItems = parsedMenuItems.map(item => {
    let price = 0;
    if (item.menu) {
       const menuRow = db.prepare('SELECT price_per_person FROM menus WHERE TRIM(LOWER(name)) = ?').get(item.menu.trim().toLowerCase());
       if (menuRow) price = menuRow.price_per_person || 0;
    }
    const qty = parseInt(item.quantity) || 1;
    const subtotal = price * qty;
    calcTotalValue += subtotal;
    
    return {
      menu: item.menu,
      quantity: qty,
      price_per_person: price,
      subtotal: subtotal
    };
  });
  finalMenuItemsStr = JSON.stringify(enhancedItems);
  
  if (finalEstimatedValue === 0) {
    finalEstimatedValue = calcTotalValue;
  }
} else {
  finalMenuItemsStr = typeof menu_items === 'object' ? JSON.stringify(menu_items) : (menu_items || '');
}

console.log("finalMenuItemsStr:", finalMenuItemsStr);
console.log("finalEstimatedValue:", finalEstimatedValue);
