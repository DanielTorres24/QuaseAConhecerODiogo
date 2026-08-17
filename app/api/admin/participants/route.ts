import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { isAuthorizedRequest } from '@/lib/auth';

const unauthorized = () => Response.json({ error: 'Não autorizado.' }, { status: 401 });

export async function GET(request: NextRequest) {
  if (!isAuthorizedRequest(request)) return unauthorized();

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
     ORDER BY id ASC;`,
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

/**
 * Apaga TODOS os participantes. As respostas desaparecem com eles, por via
 * do ON DELETE CASCADE. A confirmacao e feita na interface; aqui exigimos
 * um token valido, sem o qual isto seria um botao de destruicao aberto.
 */
export async function DELETE(request: NextRequest) {
  if (!isAuthorizedRequest(request)) return unauthorized();

  const result = await db.query('DELETE FROM participants;');

  return Response.json({ ok: true, deleted: result.rowCount ?? 0 });
}
