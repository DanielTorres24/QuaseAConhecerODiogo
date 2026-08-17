const db = require('../database');

async function resetData() {
  const queries = [
    'DELETE FROM scores;',
    'DELETE FROM players;',
  ];

  for (const query of queries) {
    console.log(`Executing: ${query}`);
    await db.query(query);
  }

  console.log('Transactional data reset completed. Reference seed data was preserved.');
}

resetData()
  .then(() => {
    db.pool.end();
  })
  .catch((error) => {
    console.error('Reset failed:', error);
    db.pool.end();
    process.exit(1);
  });
