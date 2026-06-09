require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Config ─────────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'catering123';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'catering-token-2024';

// ─── Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Multer Config (Banner Uploads) ─────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads', 'banners');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `banner-${Date.now()}${ext}`);
  },
});

const bannerUpload = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'));
    }
  },
});

// ─── Database Setup ─────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'catering.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    event_date TEXT,
    event_type TEXT,
    quantity INTEGER DEFAULT 0,
    menu_choice TEXT,
    address TEXT,
    special_requests TEXT,
    estimated_value REAL DEFAULT 0,
    status TEXT DEFAULT 'confirmed',
    payment_status TEXT DEFAULT 'pending',
    internal_notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price_per_person REAL DEFAULT 0,
    active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS menu_banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

// Try to add image_url if it doesn't exist
try {
  db.exec('ALTER TABLE menus ADD COLUMN image_url TEXT;');
} catch (e) {
  // column likely already exists
}

// Try to add menu_items if it doesn't exist
try {
  db.exec('ALTER TABLE orders ADD COLUMN menu_items TEXT;');
} catch (e) {}

// Try to rename guest_count to quantity
try {
  db.exec('ALTER TABLE orders RENAME COLUMN guest_count TO quantity;');
} catch (e) {}

// Drop event_type column
try {
  db.exec('ALTER TABLE orders DROP COLUMN event_type;');
} catch (e) {}

// Add delivery_time column
try {
  db.exec('ALTER TABLE orders ADD COLUMN delivery_time TEXT;');
} catch (e) {}

// Add form_phone column
try {
  db.exec('ALTER TABLE orders ADD COLUMN form_phone TEXT;');
} catch (e) {}

// ─── Auth Middleware ─────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── Auth Routes ────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ token: AUTH_TOKEN });
  }
  return res.status(401).json({ error: 'Invalid password' });
});

// ─── Order Routes ───────────────────────────────────────────────────

// GET /api/orders — list with pagination, search, status filter
app.get('/api/orders', requireAuth, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const dateFrom = req.query.date_from || '';
    const dateTo = req.query.date_to || '';
    const sortBy = req.query.sort_by || 'created_at';
    const sortDir = (req.query.sort_dir || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Whitelist sortable columns
    const sortableColumns = ['order_id', 'customer_name', 'customer_phone', 'event_date', 'quantity', 'menu_choice', 'estimated_value', 'status', 'created_at'];
    const safeSortBy = sortableColumns.includes(sortBy) ? sortBy : 'created_at';

    let where = '1=1';
    const params = [];

    if (search) {
      where += ' AND (customer_name LIKE ? OR order_id LIKE ? OR customer_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    if (dateFrom) {
      where += ' AND event_date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND event_date <= ?';
      params.push(dateTo);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM orders WHERE ${where}`);
    const { total } = countStmt.get(...params);

    const dataStmt = db.prepare(
      `SELECT * FROM orders WHERE ${where} ORDER BY ${safeSortBy} ${sortDir} LIMIT ? OFFSET ?`
    );
    const orders = dataStmt.all(...params, limit, offset);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders — create (no auth, for n8n webhook)
app.post('/api/orders', (req, res) => {
  try {
    const {
      order_id,
      customer_name,
      customer_phone,
      form_phone,
      event_date,
      delivery_time,
      guest_count,
      quantity,
      menu_choice,
      menu_items,
      address,
      special_requests,
      special_request,
      specialRequests,
      estimated_value,
    } = req.body;

    const finalSpecialRequests = special_requests || special_request || specialRequests || '';
    const finalQuantity = quantity || guest_count || 0;
    
    let finalMenuItemsStr = '';
    let parsedMenuItems = menu_items;

    if (typeof parsedMenuItems === 'string') {
      try { parsedMenuItems = JSON.parse(parsedMenuItems); } catch(e) { parsedMenuItems = null; }
    }
    let finalEstimatedValue = parseFloat(estimated_value) || 0;

    if (Array.isArray(parsedMenuItems)) {
      let calcTotalValue = 0;
      const enhancedItems = parsedMenuItems.map(item => {
        let price = 0;
        if (item.menu) {
           const menuRow = db.prepare('SELECT price_per_person FROM menus WHERE TRIM(LOWER(name)) = ?').get(item.menu.trim().toLowerCase());
           if (menuRow) {
             price = menuRow.price_per_person || 0;
           }
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
      
      // Auto-compute estimated_value if not explicitly provided or if it's 0
      if (finalEstimatedValue === 0) {
        finalEstimatedValue = calcTotalValue;
      }
    } else {
      finalMenuItemsStr = typeof menu_items === 'object' ? JSON.stringify(menu_items) : (menu_items || '');
    }

    if (!customer_name) {
      return res.status(400).json({ error: 'customer_name is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO orders (order_id, customer_name, customer_phone, form_phone, event_date, delivery_time, quantity, menu_choice, menu_items, address, special_requests, estimated_value)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      order_id || `ORD-${Date.now()}`,
      customer_name,
      customer_phone || '',
      form_phone || '',
      event_date || '',
      delivery_time || '',
      finalQuantity,
      menu_choice || '',
      finalMenuItemsStr,
      address || '',
      finalSpecialRequests,
      finalEstimatedValue
    );

    const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', requireAuth, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id
app.put('/api/orders/:id', requireAuth, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const fields = [
      'customer_name', 'customer_phone', 'form_phone', 'event_date', 'delivery_time',
      'quantity', 'menu_choice', 'menu_items', 'address', 'special_requests',
      'estimated_value', 'status', 'payment_status', 'internal_notes',
    ];

    // Map guest_count to quantity if provided instead
    if (req.body.guest_count !== undefined && req.body.quantity === undefined) {
      req.body.quantity = req.body.guest_count;
    }

    // Map alias if present
    if (req.body.special_request !== undefined && req.body.special_requests === undefined) {
      req.body.special_requests = req.body.special_request;
    }
    if (req.body.specialRequests !== undefined && req.body.special_requests === undefined) {
      req.body.special_requests = req.body.specialRequests;
    }
    if (req.body.menu_items !== undefined && typeof req.body.menu_items === 'object') {
      req.body.menu_items = JSON.stringify(req.body.menu_items);
    }

    const updates = [];
    const values = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now', 'localtime')");
    values.push(req.params.id);

    db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/orders/:id
app.delete('/api/orders/:id', requireAuth, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Stats Route ────────────────────────────────────────────────────
app.get('/api/stats', requireAuth, (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Today's stats
    const todayStats = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(estimated_value), 0) as total
      FROM orders WHERE date(created_at) = ?
    `).get(today);

    // Weekly breakdown (last 7 days)
    const weekly = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM orders
      WHERE created_at >= datetime('now', '-7 days', 'localtime')
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all();

    // Menu breakdown
    const menuBreakdown = db.prepare(`
      SELECT menu_choice, COUNT(*) as count
      FROM orders
      WHERE menu_choice != ''
      GROUP BY menu_choice
      ORDER BY count DESC
    `).all();

    res.json({
      today: todayStats,
      weekly,
      menuBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Menu Routes ────────────────────────────────────────────────────
app.get('/api/menus', requireAuth, (req, res) => {
  try {
    const menus = db.prepare('SELECT * FROM menus ORDER BY sort_order ASC, id ASC').all();
    res.json(menus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menus', requireAuth, (req, res) => {
  try {
    const { name, description, price_per_person, active, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const stmt = db.prepare(`
      INSERT INTO menus (name, description, price_per_person, active, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      description || '',
      price_per_person || 0,
      active !== undefined ? active : 1,
      sort_order || 0
    );

    const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menus/:id', requireAuth, (req, res) => {
  try {
    const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(req.params.id);
    if (!menu) return res.status(404).json({ error: 'Menu not found' });

    const fields = ['name', 'description', 'price_per_person', 'active', 'sort_order'];
    const updates = [];
    const values = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    db.prepare(`UPDATE menus SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM menus WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/menus/:id', requireAuth, (req, res) => {
  try {
    const menu = db.prepare('SELECT * FROM menus WHERE id = ?').get(req.params.id);
    if (!menu) return res.status(404).json({ error: 'Menu not found' });

    db.prepare('DELETE FROM menus WHERE id = ?').run(req.params.id);
    res.json({ message: 'Menu deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/menus/public — no auth, for n8n to read active menus
app.get('/api/menus/public', (req, res) => {
  try {
    const menus = db.prepare('SELECT * FROM menus WHERE active = 1 ORDER BY sort_order ASC, id ASC').all();
    res.json({ menus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Menu Banner Routes ─────────────────────────────────────────

// GET /api/menu-banner — public, returns the active banner (for WhatsApp bot)
app.get('/api/menu-banner', (req, res) => {
  try {
    const banner = db.prepare('SELECT * FROM menu_banners WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1').get();
    if (!banner) return res.json({ banner: null });
    // Build full URL
    const fullUrl = `${req.protocol}://${req.get('host')}${banner.image_url}`;
    res.json({ banner: { ...banner, full_url: fullUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/menu-banners — auth, returns all banners for dashboard
app.get('/api/menu-banners', requireAuth, (req, res) => {
  try {
    const banners = db.prepare('SELECT * FROM menu_banners ORDER BY created_at DESC').all();
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/menu-banner — auth, upload a new banner image
app.post('/api/menu-banner', requireAuth, (req, res) => {
  bannerUpload.single('image')(req, res, (uploadErr) => {
    if (uploadErr) {
      if (uploadErr.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 5 MB limit' });
      }
      return res.status(400).json({ error: uploadErr.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    try {
      const imageUrl = `/uploads/banners/${req.file.filename}`;

      // Deactivate all existing banners
      db.prepare('UPDATE menu_banners SET is_active = 0, updated_at = datetime(\'now\', \'localtime\')').run();

      // Insert new banner as active
      const stmt = db.prepare('INSERT INTO menu_banners (image_url, is_active) VALUES (?, 1)');
      const result = stmt.run(imageUrl);

      const banner = db.prepare('SELECT * FROM menu_banners WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(banner);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// PUT /api/menu-banner/:id/toggle — auth, toggle active state
app.put('/api/menu-banner/:id/toggle', requireAuth, (req, res) => {
  try {
    const banner = db.prepare('SELECT * FROM menu_banners WHERE id = ?').get(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    const newState = banner.is_active ? 0 : 1;

    if (newState === 1) {
      // Deactivate all others first
      db.prepare('UPDATE menu_banners SET is_active = 0, updated_at = datetime(\'now\', \'localtime\')').run();
    }

    db.prepare('UPDATE menu_banners SET is_active = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(newState, req.params.id);

    const updated = db.prepare('SELECT * FROM menu_banners WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/menu-banner/:id — auth, hard delete banner
app.delete('/api/menu-banner/:id', requireAuth, (req, res) => {
  try {
    const banner = db.prepare('SELECT * FROM menu_banners WHERE id = ?').get(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    // Delete file from disk
    const filePath = path.join(__dirname, banner.image_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM menu_banners WHERE id = ?').run(req.params.id);
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Holiday Routes ──────────────────────────────────────────────

// GET all holidays (auth required)
app.get('/api/holidays', requireAuth, (req, res) => {
  try {
    const holidays = db.prepare('SELECT * FROM holidays ORDER BY date ASC').all();
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create holiday (auth required)
app.post('/api/holidays', requireAuth, (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });
    const stmt = db.prepare('INSERT INTO holidays (date, reason) VALUES (?, ?)');
    const result = stmt.run(date, reason || '');
    const holiday = db.prepare('SELECT * FROM holidays WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(holiday);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'This date is already marked as holiday' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE holiday (auth required)
app.delete('/api/holidays/:id', requireAuth, (req, res) => {
  try {
    const holiday = db.prepare('SELECT * FROM holidays WHERE id = ?').get(req.params.id);
    if (!holiday) return res.status(404).json({ error: 'Holiday not found' });
    db.prepare('DELETE FROM holidays WHERE id = ?').run(req.params.id);
    res.json({ message: 'Holiday deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET holidays (public, no auth - for n8n AI bot to check)
app.get('/api/holidays/public', (req, res) => {
  try {
    const holidays = db.prepare('SELECT date, reason FROM holidays ORDER BY date ASC').all();
    res.json({ holidays });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if a specific date is a holiday (public, no auth)
app.get('/api/holidays/check/:date', (req, res) => {
  try {
    const holiday = db.prepare('SELECT * FROM holidays WHERE date = ?').get(req.params.date);
    res.json({ isHoliday: !!holiday, holiday: holiday || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍽️  Catering server running at http://localhost:${PORT}`);
});
