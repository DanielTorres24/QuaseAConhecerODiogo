import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');

  if (!auth || !auth.startsWith('Bearer ')) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const token = auth.replace('Bearer ', '');
  if (!token || token.length < 8) {
    return Response.json({ error: 'Token inválido.' }, { status: 401 });
  }

  const participants = await prisma.participant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { responses: true },
  });

  return Response.json({ participants });
}
