const db = require('../database');

async function getQuestions() {
  const result = await db.query(
    `SELECT * FROM questions ORDER BY id ASC;`
  );

  return result.rows;
}

async function findById(id) {
  const result = await db.query(
    `SELECT * FROM questions WHERE id = $1 LIMIT 1;`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  getQuestions,
  findById,
};
