const fs = require('fs');
const path = require('path');
const db = require('../database');

async function runMigrations() {
  const migrationDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Running migration: ${file}`);
    await db.query(sql);
  }

  console.log('All migrations completed successfully.');
}

runMigrations()
  .then(() => {
    console.log('Closing database pool.');
    db.pool.end();
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    db.pool.end();
    process.exit(1);
  });
