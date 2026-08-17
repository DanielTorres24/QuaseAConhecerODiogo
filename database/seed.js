const fs = require('fs');
const path = require('path');
const db = require('../database');

async function runSeed() {
  const seedDir = path.join(__dirname, 'seed');
  const files = fs
    .readdirSync(seedDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(seedDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Running seed: ${file}`);
    await db.query(sql);
  }

  console.log('Seed completed successfully.');
}

runSeed()
  .then(() => {
    console.log('Closing database pool.');
    db.pool.end();
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    db.pool.end();
    process.exit(1);
  });
