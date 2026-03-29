import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secure-secret-key-change-in-prod';
const key = new TextEncoder().encode(JWT_SECRET);

const publicRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  // Allow auth API routes to pass through
  if (isAuthApi) {
    return NextResponse.next();
  }

  // Verify JWT token
  let isValid = false;
  if (token) {
    try {
      await jwtVerify(token, key, { algorithms: ['HS256'] });
      isValid = true;
    } catch (e) {
      isValid = false;
    }
  }

  // Handle protected API routes
  if (isApiRoute && !isValid) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Handle UI routes
  if (!isApiRoute) {
    if (!isValid && !isPublicRoute) {
      // Redirect to login if unauthenticated on a private route
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (isValid && isPublicRoute) {
      // Redirect to dashboard if authenticated and trying to access login
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-*).*)',
  ],
};
