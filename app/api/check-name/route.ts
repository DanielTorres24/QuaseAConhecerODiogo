import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { normalizeParticipantName } from '@/lib/quiz';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || '';

  if (!name.trim()) {
    return Response.json({ available: false, error: 'O nome é obrigatório.' }, { status: 400 });
  }

  try {
    const nameKey = normalizeParticipantName(name);
    const result = await db.query('SELECT id FROM participants WHERE name_key = $1 LIMIT 1;', [nameKey]);
    const count = result.rowCount ?? 0;

    return Response.json({ available: count === 0, taken: count > 0 });
  } catch (error) {
    // Sem isto a rota rebentava e devolvia um 500 sem corpo; o cliente nao
    // conseguia ler nada e mostrava sempre "verifica a ligação", mesmo
    // quando o problema era a base de dados nao ter tabelas.
    console.error('Check-name error', error);

    return Response.json(
      { available: false, error: 'O servidor não conseguiu verificar o nome. Avisa quem organiza a festa.' },
      { status: 503 },
    );
  }
}
