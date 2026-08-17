import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { allQuestions, normalizeParticipantName } from '@/lib/quiz';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const answers = body.answers || {};

    if (!name) {
      return Response.json({ error: 'O nome é obrigatório.' }, { status: 400 });
    }

    const nameKey = normalizeParticipantName(name);
    const existing = await db.query('SELECT id FROM participants WHERE name_key = $1 LIMIT 1;', [nameKey]);

    if (existing.rowCount && existing.rowCount > 0) {
      return Response.json({ error: 'Este nome já foi usado. Escolha outro.' }, { status: 409 });
    }

    const participantResult = await db.query(
      `INSERT INTO participants (name, name_key, relationship, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, name, name_key AS "nameKey", relationship, created_at AS "createdAt";`,
      [name, nameKey, null],
    );

    const participant = participantResult.rows[0];
    const payload = allQuestions.map((question) => ({
      participantId: participant.id,
      questionKey: question.key,
      questionText: question.label,
      answer: String(answers[question.key] ?? ''),
    }));

    if (payload.length > 0) {
      const values: unknown[] = [];
      const placeholders: string[] = [];

      payload.forEach((entry, index) => {
        const offset = index * 4;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
        values.push(entry.participantId, entry.questionKey, entry.questionText, entry.answer);
      });

      await db.query(
        `INSERT INTO responses (participant_id, question_key, question_text, answer, created_at)
         VALUES ${placeholders.join(', ')};`,
        values,
      );
    }

    return Response.json({ ok: true, participantId: participant.id });
  } catch (error) {
    console.error('Submission error', error);
    return Response.json({ error: 'Não foi possível guardar o palpite.' }, { status: 500 });
  }
}
