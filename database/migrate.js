const fs = require('fs');
const path = require('path');
const db = require('../database');

const espera = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Espera que a base de dados aceite ligacoes.
 *
 * No Render isto corre no arranque do servico, que pode acontecer antes de
 * a base de dados estar pronta a receber ligacoes — sobretudo quando ambas
 * sao criadas ao mesmo tempo pelo Blueprint. Sem esta espera, o primeiro
 * arranque falha e o deploy inteiro e dado como falhado.
 */
async function aguardarBaseDeDados(tentativas = 12, intervaloMs = 5000) {
  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      await db.query('SELECT 1;');
      return;
    } catch (error) {
      if (tentativa === tentativas) throw error;
      console.log(
        `Base de dados ainda não responde (${error.code || error.message}). ` +
          `Nova tentativa em ${intervaloMs / 1000}s [${tentativa}/${tentativas}]`,
      );
      await espera(intervaloMs);
    }
  }
}

async function runMigrations() {
  await aguardarBaseDeDados();

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
