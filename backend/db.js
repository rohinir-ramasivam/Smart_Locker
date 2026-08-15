const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'locker_system.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Failed to open SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database at', DB_PATH);
  }
});

// Enable Foreign Key constraints in SQLite
db.run('PRAGMA foreign_keys = ON;');

// Helper to run query returning Promise
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper to run single row query returning Promise
function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper to run write/update query returning Promise
function execute(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Initialize tables and seed data if database is empty
async function initDb() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const seedsPath = path.join(__dirname, '..', 'database', 'seeds.sql');

  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = schemaSql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await execute(stmt);
    }
    console.log('✅ Database schema verified.');
  }

  // Check if users exist; if not, seed data
  const usersCount = await getOne('SELECT COUNT(*) as count FROM users');
  if (usersCount && usersCount.count === 0 && fs.existsSync(seedsPath)) {
    console.log('🌱 Seeding initial database data...');
    const seedsSql = fs.readFileSync(seedsPath, 'utf8');
    const seedStatements = seedsSql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of seedStatements) {
      await execute(stmt);
    }
    console.log('✅ Database seeded successfully.');
  }
}

module.exports = {
  db,
  query,
  getOne,
  execute,
  initDb
};
