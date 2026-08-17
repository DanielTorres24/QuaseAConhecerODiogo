import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { normalizeParticipantName } from '@/lib/quiz';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || '';

  if (!name.trim()) {
    return Response.json({ available: false, error: 'O nome é obrigatório.' }, { status: 400 });
  }

  const nameKey = normalizeParticipantName(name);
  const result = await db.query('SELECT id FROM participants WHERE name_key = $1 LIMIT 1;', [nameKey]);
  const count = result.rowCount ?? 0;

  return Response.json({ available: count === 0, taken: count > 0 });
}
