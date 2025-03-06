import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isRootPage = request.nextUrl.pathname === '/';

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && (isLoginPage || isRootPage)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token) {
    try {
      const tokenData = JSON.parse(token.value);
      const now = new Date().getTime();
      const hoursPassed = (now - tokenData.timestamp) / (1000 * 60 * 60);

      if (hoursPassed >= 24) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 