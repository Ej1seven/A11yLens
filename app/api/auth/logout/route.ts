import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, deleteSessionByToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await deleteSessionByToken(token);
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
    clearSessionCookie(response);
    return response;
  }
}
