import { db } from '@/lib/db';
import { buildStats, type Tally } from '@/lib/stats';

/**
 * Resumo agregado mostrado no ecra final, depois de a pessoa submeter.
 * Devolve apenas contagens — nunca nomes nem respostas individuais.
 */
export async function GET() {
  try {
    const [tallyResult, totalResult] = await Promise.all([
      db.query(
        `SELECT question_key AS "questionKey", answer, COUNT(*)::int AS count
           FROM responses
          WHERE answer <> ''
          GROUP BY question_key, answer;`,
      ),
      db.query('SELECT COUNT(*)::int AS total FROM participants;'),
    ]);

    const tallies = tallyResult.rows as Tally[];
    const totalParticipants = Number(totalResult.rows[0]?.total ?? 0);

    return Response.json(buildStats(tallies, totalParticipants));
  } catch (error) {
    console.error('Stats error', error);
    return Response.json({ error: 'Não foi possível calcular as estatísticas.' }, { status: 500 });
  }
}
