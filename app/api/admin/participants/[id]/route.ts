import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { isAuthorizedRequest } from '@/lib/auth';

/**
 * Apaga o questionario de uma pessoa — para o caso de alguem se enganar.
 * As respostas vao atras por ON DELETE CASCADE.
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedRequest(request)) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await context.params;
  const participantId = Number(id);

  if (!Number.isInteger(participantId) || participantId <= 0) {
    return Response.json({ error: 'Identificador inválido.' }, { status: 400 });
  }

  const result = await db.query('DELETE FROM participants WHERE id = $1;', [participantId]);

  if (!result.rowCount) {
    return Response.json({ error: 'Participante não encontrado.' }, { status: 404 });
  }

  return Response.json({ ok: true });
}
