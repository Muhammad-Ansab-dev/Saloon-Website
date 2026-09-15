import { NextResponse } from 'next/server';
import { createSessionToken, serializeSessionCookie, validateCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const username = body.username?.trim() ?? '';
  const password = body.password ?? '';

  if (!validateCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', serializeSessionCookie(token));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', clearSessionCookieForLogout());
  return res;
}

function clearSessionCookieForLogout(): string {
  return `ph_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}