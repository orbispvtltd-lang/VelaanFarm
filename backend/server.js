import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'velaan_farm_super_secret_key_123';
const DB_PATH = path.join(__dirname, 'database.sqlite');

const app = express();

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

// Helper functions to wrap sqlite3 methods in Promises for async/await usage
const dbRun = (query, params = []) => new Promise((resolve, reject) => {
  db.run(query, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const dbAll = (query, params = []) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

const dbGet = (query, params = []) => new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

// Database initialization
async function initializeDatabase() {
  try {
    // Create Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
      )
    `);

    // Create Products table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        variant TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT,
        description TEXT
      )
    `);

    // Create Orders table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        customer TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT NOT NULL,
        products TEXT NOT NULL,
        total REAL NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'விநியோகத்தில் (Pending)',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create Inquiries table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        message TEXT,
        date TEXT NOT NULL
      )
    `);

    console.log('Database tables verified/created successfully.');

    // Seed or Update Admin User
    const admin = await dbGet("SELECT * FROM users WHERE role = 'admin'");
    const hashedPass = await bcrypt.hash('orbis03', 10);
    if (!admin) {
      await dbRun(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ['orbis', 'orbis.hitech@gmail.com', hashedPass, 'admin']
      );
      console.log('Seeded admin user: orbis / orbis.hitech@gmail.com / orbis03');
    } else {
      await dbRun(
        "UPDATE users SET name = ?, email = ?, password = ? WHERE role = 'admin'",
        ['orbis', 'orbis.hitech@gmail.com', hashedPass]
      );
      console.log('Updated existing admin user credentials to: orbis / orbis.hitech@gmail.com / orbis03');
    }

    // Seed Products if table is empty
    const productsCount = await dbGet("SELECT COUNT(*) as count FROM products");
    if (productsCount.count === 0) {
      const initialProducts = [
        { id: 'p1', name: 'Fresh Cow Milk (பசுவின் பால்)', category: 'milk', variant: '500ml', price: 45, image: '🥛', description: 'உடலுக்கு ஆரோக்கியமான, தூய்மையான பசுவின் பால். கொமரபாளையத்தில் வெள்ளிக்கிழமை தோறும் விநியோகம்.' },
        { id: 'p2', name: 'Fresh Cow Milk (பசுவின் பால்)', category: 'milk', variant: '1L', price: 80, image: '🥛', description: 'எந்தவித கலப்படமும் இல்லாத நேரடி பண்ணை பால். கொமரபாளையத்தில் வெள்ளிக்கிழமை தோறும் விநியோகம்.' },
        { id: 'p3', name: 'Pure Cow Ghee (நெய்)', category: 'ghee', variant: '250g', price: 350, image: '🧈', description: 'பாரம்பரிய முறையில் தயாரிக்கப்பட்ட மணமுள்ள நெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
        { id: 'p4', name: 'Pure Cow Ghee (நெய்)', category: 'ghee', variant: '500g', price: 650, image: '🧈', description: 'சுவையும் மணமும் நிறைந்த தூய பசு நெய். தமிழகம் முழுவதும் கொரியர் வசதி.' },
        { id: 'p5', name: 'Pure Cow Ghee (நெய்)', category: 'ghee', variant: '1kg', price: 1200, image: '🧈', description: 'குடும்பத்திற்கு ஏற்ற பெரிய பேக். தமிழகம் முழுவதும் கொரியர் வசதி.' }
      ];

      for (const prod of initialProducts) {
        await dbRun(
          "INSERT INTO products (id, name, category, variant, price, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [prod.id, prod.name, prod.category, prod.variant, prod.price, prod.image, prod.description]
        );
      }
      console.log('Seeded initial products successfully.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// ---------- MIDDLEWARE ----------

// Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Authenticate Admin Role
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

// ---------- API ROUTES ----------

// Auth: Sign Up
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const existingUser = await dbGet("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await dbRun(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, 'user']
    );

    const user = { id: result.lastID, name, email, role: 'user' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const user = await dbGet("SELECT * FROM users WHERE email = ? OR name = ?", [email, email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Products: Get All
app.get('/api/products', async (req, res) => {
  try {
    const products = await dbAll("SELECT * FROM products");
    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Orders: Place Order
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { customer, phone, email, address, products, total } = req.body;
  if (!customer || !phone || !address || !products || !total) {
    return res.status(400).json({ error: 'Missing required order fields' });
  }

  try {
    const dateStr = new Date().toLocaleDateString('ta-IN');
    const result = await dbRun(
      `INSERT INTO orders (user_id, customer, phone, email, address, products, total, date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, customer, phone, email || null, address, products, total, dateStr, 'விநியோகத்தில் (Pending)']
    );

    res.status(201).json({
      id: result.lastID,
      user_id: req.user.id,
      customer,
      phone,
      email,
      address,
      products,
      total,
      date: dateStr,
      status: 'விநியோகத்தில் (Pending)'
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Orders: Get All (Admin only)
app.get('/api/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await dbAll("SELECT * FROM orders ORDER BY id DESC");
    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Orders: Update Status (Admin only)
app.put('/api/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const result = await dbRun(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully', id, status });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Orders: Delete Order (Admin only)
app.delete('/api/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbRun("DELETE FROM orders WHERE id = ?", [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully', id });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inquiries: Submit contact form
app.post('/api/contact', async (req, res) => {
  const { name, phone, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone are required' });
  }

  try {
    const dateStr = new Date().toLocaleDateString('ta-IN');
    await dbRun(
      "INSERT INTO inquiries (name, phone, message, date) VALUES (?, ?, ?, ?)",
      [name, phone, message || null, dateStr]
    );
    res.status(201).json({ message: 'Inquiry submitted successfully' });
  } catch (error) {
    console.error('Inquiry submit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inquiries: Get All (Admin only)
app.get('/api/contact', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const inquiries = await dbAll("SELECT * FROM inquiries ORDER BY id DESC");
    res.json(inquiries);
  } catch (error) {
    console.error('Fetch inquiries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- SERVE STATIC FILES (PRODUCTION) ----------

// 1. Serve Portal Gateway at /
app.use('/', express.static(path.join(__dirname, '../portal')));

// 2. Serve Customer Shop React App at /shop
app.use('/shop', express.static(path.join(__dirname, '../frontend/dist')));
app.get('/shop/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// 3. Serve Admin Dashboard React App at /admin
app.use('/admin', express.static(path.join(__dirname, '../admin/dist')));
app.get('/admin/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend API Server running at http://localhost:${PORT}`);
});
