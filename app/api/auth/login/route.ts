import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validations';
import { signIn, verifyPassword } from '@/lib/auth';

function redirectTo(req: Request, path: string) {
  return NextResponse.redirect(new URL(path, req.url), { status: 303 });
}

export async function GET(req: Request) {
  return redirectTo(req, '/login');
}

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const parsed = loginSchema.safeParse(Object.fromEntries(fd));

    if (!parsed.success) {
      return redirectTo(req, '/login?error=Invalid+login');
    }

    const user = await db.user.findUnique({ where: { email: parsed.data.email } });

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return redirectTo(req, '/login?error=Invalid+credentials');
    }

    await signIn(user.id);
    return redirectTo(req, '/dashboard');
  } catch (error) {
    console.error('Login failed', error);
    return redirectTo(req, '/login?error=Sign+in+is+temporarily+unavailable');
  }
}
