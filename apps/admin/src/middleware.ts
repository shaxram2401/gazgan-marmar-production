import { NextRequest, NextResponse } from 'next/server';

const COOKIE = process.env.SESSION_COOKIE_NAME || '__gm_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname.startsWith('/login');
  const hasSession = req.cookies.has(COOKIE);

  // Already logged in — redirect away from /login
  if (isLogin && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Protected area
  const isProtected = !isLogin && !pathname.startsWith('/api/auth') && !pathname.startsWith('/_next');
  if (isProtected && !hasSession) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'
  ]
};
