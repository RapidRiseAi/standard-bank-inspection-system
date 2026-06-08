import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'crypto';
import { db } from './db';

const COOKIE = 'buildinspect_session';

const secret = () => {
  const configuredSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV !== 'production') return 'development-demo-secret-change-me';
  throw new Error('Production auth requires AUTH_SECRET, NEXTAUTH_SECRET, or SUPABASE_SERVICE_ROLE_KEY.');
};

function signature(value: string) {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

function encode(id: string) {
  return `${id}.${signature(id)}`;
}

function decode(token?: string) {
  if (!token) return null;
  const [id, sig] = token.split('.');
  if (!id || !sig) return null;
  const expected = signature(id);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? id : null;
  } catch {
    return null;
  }
}

export async function hashPassword(p: string) {
  return bcrypt.hash(p, 12);
}

export async function verifyPassword(p: string, h: string) {
  return bcrypt.compare(p, h);
}

export async function signIn(userId: string) {
  (await cookies()).set(COOKIE, encode(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

export async function currentUser() {
  const id = decode((await cookies()).get(COOKIE)?.value);
  if (!id) return null;
  return db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true } });
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) redirect('/login');
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== 'ADMIN') redirect('/dashboard');
  return u;
}
