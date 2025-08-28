import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { jwtVerify, JWTPayload } from "jose"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Allow access to auth pages and API routes
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Check for external token in cookies if NextAuth token is not present
  let externalToken = null
  if (!token) {
    const externalTokenCookie = request.cookies.get('external_token')
    if (externalTokenCookie) {
      try {
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
        const { payload } = await jwtVerify(externalTokenCookie.value, secret)
        externalToken = payload as JWTPayload
      } catch {
        // Invalid token, remove it
        const response = NextResponse.redirect(new URL('/auth/signin', request.url))
        response.cookies.delete('external_token')
        return response
      }
    }
  }

  // Redirect to login if not authenticated and trying to access dashboard
  if (!token && !externalToken && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Role-based access control for authenticated users
  if ((token || externalToken) && pathname.startsWith('/dashboard')) {
    const userRole = (token?.role || externalToken?.role) as string

    // Admin/Petugas can access all dashboard routes
    if (userRole === 'PETUGAS') {
      return NextResponse.next()
    }

    // Mahasiswa and Eksternal have limited access
    if (userRole === 'MAHASISWA' || userRole === 'EKSTERNAL') {
      // Allow access to general dashboard and booking pages
      if (
        pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/booking') ||
        pathname.startsWith('/dashboard/profile') ||
        pathname.startsWith('/dashboard/history') ||
        pathname.startsWith('/dashboard/room-monitor')
      ) {
        return NextResponse.next()
      }
      
      // Redirect to main dashboard if trying to access admin routes
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
  runtime: 'nodejs',
}