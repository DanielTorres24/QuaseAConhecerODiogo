const db = require('../database');

async function createPlayer({ name, email = null, metadata = {} }) {
  const result = await db.query(
    `
      INSERT INTO players (name, email, metadata)
      VALUES ($1, $2, $3::jsonb)
      RETURNING *;
    `,
    [name, email, metadata]
  );

  return result.rows[0];
}

async function findByName(name) {
  const result = await db.query(
    `SELECT * FROM players WHERE name = $1 LIMIT 1;`,
    [name]
  );

  return result.rows[0] || null;
}

async function findAllPlayers() {
  const result = await db.query(
    `SELECT * FROM players ORDER BY created_at DESC;`
  );

  return result.rows;
}

module.exports = {
  createPlayer,
  findByName,
  findAllPlayers,
};
