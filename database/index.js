const { Pool } = require('pg');
require('dotenv').config();

const { DATABASE_URL, NODE_ENV } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined. Please set it in your .env file before starting the app.');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
