const fs = require('fs');
const path = require('path');
const { execute, db } = require('./db');

async function seed() {
  try {
    console.log('🌱 Forcing fresh seed of database...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const seedsPath = path.join(__dirname, '..', 'database', 'seeds.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const schemaStatements = schemaSql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of schemaStatements) {
      await execute(stmt);
    }

    const seedsSql = fs.readFileSync(seedsPath, 'utf8');
    const seedStatements = seedsSql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of seedStatements) {
      await execute(stmt);
    }

    console.log('✅ Database fresh seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
}

seed();
