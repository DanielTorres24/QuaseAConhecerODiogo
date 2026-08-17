import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { allQuestions, normalizeParticipantName } from '@/lib/quiz';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const relationship = String(body.relationship || '').trim();
    const answers = body.answers || {};

    if (!name) {
      return Response.json({ error: 'O nome é obrigatório.' }, { status: 400 });
    }

    const nameKey = normalizeParticipantName(name);
    const existing = await prisma.participant.findUnique({ where: { nameKey } });

    if (existing) {
      return Response.json({ error: 'Este nome já foi usado. Escolha outro.' }, { status: 409 });
    }

    const participant = await prisma.participant.create({
      data: {
        name,
        nameKey,
        relationship: relationship || null,
      },
    });

    const payload = allQuestions.map((question) => ({
      participantId: participant.id,
      questionKey: question.key,
      questionText: question.label,
      answer: String(answers[question.key] ?? ''),
    }));

    await prisma.response.createMany({
      data: payload,
    });

    return Response.json({ ok: true, participantId: participant.id });
  } catch (error) {
    console.error('Submission error', error);
    return Response.json({ error: 'Não foi possível guardar o palpite.' }, { status: 500 });
  }
}
