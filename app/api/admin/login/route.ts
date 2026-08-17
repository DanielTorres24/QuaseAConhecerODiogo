import { NextRequest } from 'next/server';
import { createAdminToken, isValidAdminCredentials } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!isValidAdminCredentials(username, password)) {
      return Response.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    return Response.json({ token: createAdminToken(username) });
  } catch {
    return Response.json({ error: 'Falha ao iniciar sessão.' }, { status: 500 });
  }
}
