import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validations';
import { signIn, verifyPassword } from '@/lib/auth';

function redirectTo(req: Request, path: string) {
  return NextResponse.redirect(new URL(path, req.url), { status: 303 });
}

function redirectToLoginError(req: Request, message: string) {
  const url = new URL('/login', req.url);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url, { status: 303 });
}

function errorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '';
}

function loginFailureMessage(error: unknown) {
  const code = errorCode(error);
  const message = errorMessage(error);

  if (message.includes('the URL must start with the protocol `postgresql://` or `postgres://`')) {
    return 'DATABASE_URL must be a PostgreSQL connection string, not a Supabase project/API URL.';
  }

  if (code === 'P1000' || code === 'P1001' || code === 'P1002') {
    return 'Database connection failed. Check DATABASE_URL in Vercel.';
  }

  if (code === 'P2021' || code === 'P2022') {
    return 'Database tables are not ready. Run the production migrations and seed data.';
  }

  if (message.includes('Production auth requires')) {
    return 'Server auth is not configured. Set AUTH_SECRET in Vercel.';
  }

  return 'Sign in is temporarily unavailable. Check the Vercel function logs.';
}

export async function GET(req: Request) {
  return redirectTo(req, '/login');
}

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const parsed = loginSchema.safeParse(Object.fromEntries(fd));

    if (!parsed.success) {
      return redirectToLoginError(req, 'Invalid login');
    }

    const user = await db.user.findUnique({ where: { email: parsed.data.email } });

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return redirectToLoginError(req, 'Invalid credentials');
    }

    await signIn(user.id);
    return redirectTo(req, '/dashboard');
  } catch (error) {
    console.error('Login failed', error);
    return redirectToLoginError(req, loginFailureMessage(error));
  }
}
