import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'diogo2026';

/**
 * Chave usada para assinar o token de sessao. Se ADMIN_SECRET nao estiver
 * definida, cai na password — o que basta aqui, porque a password ja e o
 * unico segredo do lado do servidor.
 */
const SECRET = process.env.ADMIN_SECRET || ADMIN_PASSWORD;

/** Validade da sessao de administracao. */
const TTL_MS = 8 * 60 * 60 * 1000;

export function isValidAdminCredentials(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

function sign(payload: string) {
  return createHmac('sha256', SECRET).update(payload).digest('hex');
}

/**
 * Token assinado: "<payload em base64url>.<assinatura>". Sem a chave do
 * servidor nao e possivel forjar um, ao contrario do token anterior, que
 * era so o utilizador e a hora em base64 e nunca chegava a ser verificado.
 */
export function createAdminToken(username: string, now = Date.now()) {
  const payload = `${username}:${now + TTL_MS}`;
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${sign(payload)}`;
}

export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return false;

  let payload: string;
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return false;
  }

  const expected = sign(payload);
  const givenBytes = Buffer.from(signature, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');

  // timingSafeEqual exige o mesmo comprimento; um tamanho diferente ja e falha.
  if (givenBytes.length !== expectedBytes.length) return false;
  if (!timingSafeEqual(givenBytes, expectedBytes)) return false;

  const [username, expiresAt] = payload.split(':');
  if (username !== ADMIN_USERNAME) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry > Date.now();
}

/** Le e valida o cabecalho Authorization de um pedido de administracao. */
export function isAuthorizedRequest(request: Request): boolean {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return false;
  return verifyAdminToken(header.slice('Bearer '.length).trim());
}
