import { NextRequest } from 'next/server';
import { isValidAdminCredentials } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!isValidAdminCredentials(username, password)) {
      return Response.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    return Response.json({ token });
  } catch (error) {
    return Response.json({ error: 'Falha ao iniciar sessão.' }, { status: 500 });
  }
}
