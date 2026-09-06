import { type NextRequest, NextResponse } from 'next/server'

// Routes yang bisa diakses tanpa login
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]

// Routes yang hanya bisa diakses super admin
const SUPER_ADMIN_PATHS = ['/super-admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Lewati semua API routes (BFF proxy)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Lewati static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get('rentos_access_token')?.value
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Jika belum login dan bukan public route → redirect ke login
  if (!accessToken && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    // Simpan intended URL untuk redirect setelah login
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Jika sudah login dan mencoba akses public route → redirect ke dashboard
  if (accessToken && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Super admin routes — cek role dari cookie
  if (pathname.startsWith('/super-admin')) {
    const role = request.cookies.get('rentos_role')?.value
    if (role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match semua request path kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
