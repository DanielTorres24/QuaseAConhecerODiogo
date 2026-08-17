import { createHash } from 'node:crypto';

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'diogo2026';

export function hashPassword(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function isValidAdminCredentials(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}
