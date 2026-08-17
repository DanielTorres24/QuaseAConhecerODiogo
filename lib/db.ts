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

const toLowerNameKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

export const prisma = {
  participant: {
    async findUnique({ where }: { where: { nameKey?: string } }) {
      if (!where?.nameKey) {
        return null;
      }

      const result = await query('SELECT * FROM participants WHERE name_key = $1 LIMIT 1;', [where.nameKey]);
      return result.rows[0] ?? null;
    },
    async create({ data }: { data: { name: string; nameKey?: string; relationship?: string | null } }) {
      const normalizedName = data.name.trim();
      const nameKey = data.nameKey ?? toLowerNameKey(normalizedName);

      const result = await query(
        `INSERT INTO participants (name, name_key, relationship, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, name, name_key AS "nameKey", relationship, created_at AS "createdAt";`,
        [normalizedName, nameKey, data.relationship ?? null],
      );

      return result.rows[0] ?? null;
    },
    async findMany({ orderBy, include }: { orderBy?: { createdAt?: 'desc' | 'asc' }; include?: { responses?: boolean } } = {}) {
      const rows = await query(
        `SELECT id, name, relationship, created_at AS "createdAt"
         FROM participants
         ORDER BY created_at ${orderBy?.createdAt === 'asc' ? 'ASC' : 'DESC'};`,
      );

      if (include?.responses) {
        const responseRows = await query(
          `SELECT participant_id AS "participantId", question_key AS "questionKey", question_text AS "questionText", answer
           FROM responses
           WHERE participant_id = ANY ($1)
           ORDER BY created_at ASC;`,
          [rows.rows.map((row: ParticipantRow) => row.id)],
        );

        const byParticipant = new Map<number, ResponseRow[]>();
        for (const row of responseRows.rows as ResponseRow[]) {
          const key = Number(row.participantId);
          const existing = byParticipant.get(key) ?? [];
          existing.push(row);
          byParticipant.set(key, existing);
        }

        return rows.rows.map((row: ParticipantRow) => ({ ...row, responses: byParticipant.get(Number(row.id)) ?? [] }));
      }

      return rows.rows;
    },
  },
  response: {
    async createMany({ data }: { data: Array<{ participantId: number; questionKey: string; questionText: string; answer: string }> }) {
      if (!data.length) {
        return { count: 0 };
      }

      const values: unknown[] = [];
      const placeholders: string[] = [];

      data.forEach((entry, index) => {
        const offset = index * 4;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
        values.push(entry.participantId, entry.questionKey, entry.questionText, entry.answer);
      });

      const result = await query(
        `INSERT INTO responses (participant_id, question_key, question_text, answer, created_at)
         VALUES ${placeholders.join(', ')};`,
        values,
      );

      return { count: result.rowCount ?? data.length };
    },
  },
};

export default db;
