const db = require('../database');

async function saveScore({ player_id, question_id, value, metadata = {} }) {
  const result = await db.query(
    `
      INSERT INTO scores (player_id, question_id, value, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING *;
    `,
    [player_id, question_id, value, metadata]
  );

  return result.rows[0];
}

async function getLeaderboard() {
  const result = await db.query(
    `
      SELECT p.id, p.name, SUM(s.value) AS total_score
      FROM players p
      LEFT JOIN scores s ON s.player_id = p.id
      GROUP BY p.id, p.name
      ORDER BY total_score DESC, p.name ASC;
    `
  );

  return result.rows;
}

module.exports = {
  saveScore,
  getLeaderboard,
};
