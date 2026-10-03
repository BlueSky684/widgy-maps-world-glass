import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import {EncryptJWT, jwtDecrypt} from 'jose';

export const SESSION_COOKIE = '__Host-calendar-session';
export const ORIGIN = 'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
export class BridgeError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
export function origin() {
  const value = process.env.CALENDAR_ORIGIN || ORIGIN;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.origin !== value) throw new BridgeError('server_configuration', 503);
  return value;
}
function encryptionKey() {
  const value = process.env.CALENDAR_SEAL_KEY || '';
  if (!/^[a-fA-F0-9]{64}$/.test(value)) throw new BridgeError('server_configuration', 503);
  return Buffer.from(value, 'hex');
}
export function readiness() {
  let base = false;
  try { encryptionKey(); origin(); base = (process.env.CALENDAR_SETUP_KEY || '').length >= 43; } catch {}
  return {base, google: base && Boolean(process.env.CALENDAR_GOOGLE_CLIENT_ID && process.env.CALENDAR_GOOGLE_CLIENT_SECRET)};
}
export function randomKey() { return randomBytes(32).toString('base64url'); }
export function same(a, b) {
  return timingSafeEqual(createHash('sha256').update(String(a || '')).digest(), createHash('sha256').update(String(b || '')).digest());
}
export async function seal(data, audience, lifetime = '30d') {
  return new EncryptJWT({data, version: process.env.CALENDAR_TOKEN_VERSION || '1'})
    .setProtectedHeader({alg:'dir', enc:'A256GCM'})
    .setIssuer(origin()).setAudience(audience).setIssuedAt().setExpirationTime(lifetime)
    .encrypt(encryptionKey());
}
export async function unseal(token, audience) {
  if (typeof token !== 'string' || token.length > 12000) throw new BridgeError('unauthorized', 401);
  try {
    const {payload} = await jwtDecrypt(token, encryptionKey(), {
      issuer:origin(), audience, keyManagementAlgorithms:['dir'], contentEncryptionAlgorithms:['A256GCM']
    });
    if (payload.version !== (process.env.CALENDAR_TOKEN_VERSION || '1')) throw Error('revoked');
    return payload.data;
  } catch { throw new BridgeError('unauthorized', 401); }
}
export async function session(req) {
  const cookies = Object.fromEntries(String(req.headers?.cookie || '').split(';').map(s => {
    const i = s.indexOf('='); return [s.slice(0, i).trim(), s.slice(i + 1)];
  }));
  return unseal(cookies[SESSION_COOKIE], 'calendar-setup');
}
export async function setSession(res, data) {
  const token = await seal(data, 'calendar-setup');
  if (token.length > 3700) throw new BridgeError('selection_too_large');
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`);
}
export function privateHeaders(res) {
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control','no-store');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
}
export function checkPost(req) {
  if (req.method !== 'POST') throw new BridgeError('method_not_allowed',405);
  if (req.headers?.origin !== origin()) throw new BridgeError('invalid_origin',403);
  if (!String(req.headers?.['content-type']).startsWith('application/json')) throw new BridgeError('invalid_content_type',415);
}
export function body(req) {
  if (Number(req.headers?.['content-length'] || 0) > 20000) throw new BridgeError('request_too_large',413);
  let result;
  try { result = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { throw new BridgeError('invalid_request'); }
  if (!result || typeof result !== 'object' || Array.isArray(result) || JSON.stringify(result).length > 20000) throw new BridgeError('invalid_request');
  return result;
}
