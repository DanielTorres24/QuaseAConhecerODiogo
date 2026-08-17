import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizeParticipantName } from '@/lib/quiz';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || '';

  if (!name.trim()) {
    return Response.json({ available: false, error: 'O nome é obrigatório.' }, { status: 400 });
  }

  const nameKey = normalizeParticipantName(name);
  const existing = await prisma.participant.findUnique({ where: { nameKey } });

  return Response.json({ available: !existing, taken: Boolean(existing) });
}
