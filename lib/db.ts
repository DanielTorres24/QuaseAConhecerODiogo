import 'dotenv/config';
import { Pool } from 'pg';

/**
 * A ligacao e criada a primeira consulta, nao ao importar o modulo.
 *
 * O `next build` importa as rotas para as analisar, por isso ligar aqui em
 * cima fazia o build inteiro falhar quando DATABASE_URL nao esta definida —
 * com um erro que nada tem a ver com o que se passa. Assim, o build corre
 * sempre e a falta de configuracao aparece a primeira consulta, onde faz
 * sentido e vira erro 500 legivel.
 */
let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const { DATABASE_URL, NODE_ENV } = process.env;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL não está definida. Configura-a no .env (local) ou nas variáveis de ambiente do Render.');
  }

  pool = new Pool({
    connectionString: DATABASE_URL,
    // O Postgres do Render exige TLS e usa certificado proprio.
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  return pool;
}

export const query = (text: string, params?: unknown[]) => getPool().query(text, params);

export const db = { query };

export default db;
