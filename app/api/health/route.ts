import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

/**
 * Sem parametros, responde sempre 200 sem tocar na base de dados — e o
 * healthCheckPath do Render, e o servico nao deve ser dado como morto so
 * porque a base de dados gratuita adormeceu.
 *
 * Com ?db=1, diz em que estado esta a base de dados. Serve para diagnosticar
 * um deploy sem precisar dos logs: distingue "nao esta configurada" de
 * "nao liga" e de "liga mas nao tem tabelas" — que e o que acontece quando
 * as migracoes nao correram.
 */
export async function GET(request: NextRequest) {
  if (!request.nextUrl.searchParams.has('db')) {
    return Response.json({ ok: true, status: 'ready' });
  }

  if (!process.env.DATABASE_URL) {
    return Response.json(
      { ok: false, db: 'sem-configuracao', dica: 'Define DATABASE_URL nas variáveis de ambiente.' },
      { status: 503 },
    );
  }

  try {
    const result = await db.query(
      `SELECT (SELECT count(*) FROM participants)::int AS participantes,
              (SELECT count(*) FROM responses)::int AS respostas;`,
    );

    return Response.json({ ok: true, db: 'ok', ...result.rows[0] });
  } catch (error) {
    const code = (error as { code?: string }).code;

    // 42P01 = tabela inexistente. E o sintoma de as migracoes nao terem corrido.
    if (code === '42P01') {
      return Response.json(
        { ok: false, db: 'sem-tabelas', code, dica: 'Corre "npm run migrate" (o startCommand já o faz).' },
        { status: 503 },
      );
    }

    console.error('Health check da base de dados falhou', error);

    return Response.json(
      { ok: false, db: 'sem-ligacao', code, dica: 'Verifica DATABASE_URL e se a base de dados está a correr.' },
      { status: 503 },
    );
  }
}
