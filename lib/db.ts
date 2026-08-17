import 'dotenv/config';
import { Pool } from 'pg';

const { DATABASE_URL, NODE_ENV } = process.env;

type ParticipantRow = {
  id: number;
  name: string;
  relationship: string | null;
  createdAt: string;
};

type ResponseRow = {
  participantId: number;
  questionKey: string;
  questionText: string;
  answer: string;
};

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined. Please set it in your .env file before starting the app.');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
export const db = { query, pool };

export default db;
