import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');

  if (!auth || !auth.startsWith('Bearer ')) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const token = auth.replace('Bearer ', '');
  if (!token || token.length < 8) {
    return Response.json({ error: 'Token inválido.' }, { status: 401 });
  }

  const participantsResult = await db.query(
    `SELECT id, name, relationship, created_at AS "createdAt"
     FROM participants
     ORDER BY created_at DESC;`,
  );

  const participants = participantsResult.rows;
  const participantIds = participants.map((participant) => participant.id);

  const responsesResult = await db.query(
    `SELECT participant_id AS "participantId", question_key AS "questionKey", question_text AS "questionText", answer
     FROM responses
     WHERE participant_id = ANY($1)
     ORDER BY created_at ASC;`,
    [participantIds],
  );

  const byParticipant = new Map<number, typeof responsesResult.rows>();
  for (const row of responsesResult.rows) {
    const key = Number(row.participantId);
    const existing = byParticipant.get(key) ?? [];
    existing.push(row);
    byParticipant.set(key, existing);
  }

  const payload = participants.map((participant) => ({
    ...participant,
    responses: byParticipant.get(Number(participant.id)) ?? [],
  }));

  return Response.json({ participants: payload });
}
