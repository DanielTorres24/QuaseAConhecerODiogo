import { describe, expect, it } from 'vitest';
import { ADMIN_USERNAME, createAdminToken, verifyAdminToken } from './auth';

describe('token de administração', () => {
  it('aceita um token que acabou de emitir', () => {
    expect(verifyAdminToken(createAdminToken(ADMIN_USERNAME))).toBe(true);
  });

  it('rejeita lixo, vazio e nulo', () => {
    expect(verifyAdminToken('')).toBe(false);
    expect(verifyAdminToken(null)).toBe(false);
    expect(verifyAdminToken('qualquer-coisa')).toBe(false);
  });

  it('rejeita o formato antigo — base64 do utilizador e da hora, sem assinatura', () => {
    // Era isto que a versão anterior emitia e nunca chegava a verificar.
    const antigo = Buffer.from(`${ADMIN_USERNAME}:${Date.now()}`).toString('base64');

    expect(verifyAdminToken(antigo)).toBe(false);
  });

  it('rejeita um token com a assinatura adulterada', () => {
    const [payload] = createAdminToken(ADMIN_USERNAME).split('.');

    expect(verifyAdminToken(`${payload}.${'0'.repeat(64)}`)).toBe(false);
  });

  it('rejeita um token cuja validade foi esticada no payload', () => {
    // Assinatura válida para o payload original, mas o payload foi trocado.
    const [, signature] = createAdminToken(ADMIN_USERNAME).split('.');
    const forjado = Buffer.from(`${ADMIN_USERNAME}:${Date.now() + 10 ** 12}`).toString('base64url');

    expect(verifyAdminToken(`${forjado}.${signature}`)).toBe(false);
  });

  it('rejeita um token já expirado', () => {
    const expirado = createAdminToken(ADMIN_USERNAME, Date.now() - 9 * 60 * 60 * 1000);

    expect(verifyAdminToken(expirado)).toBe(false);
  });
});
