import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { authSecret } from '@/lib/secrets'

const PUBLIC_PREFIXES = ['/login', '/api/', '/t/', '/s/', '/media/', '/_next/', '/favicon', '/logo.svg', '/robots.txt', '/themes/']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const host = req.headers.get('host')?.split(':')[0] || ''
  const root = process.env.STOREFRONT_ROOT_DOMAIN

  // {store}.STOREFRONT_ROOT_DOMAIN → live storefront (API calls pass through untouched).
  if (root && host.endsWith('.' + root) && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/') && !pathname.startsWith('/media/')) {
    const store = host.slice(0, -(root.length + 1))
    const url = req.nextUrl.clone()
    url.pathname = `/s/${store}${pathname}`
    return NextResponse.rewrite(url)
  }

  // API routes and public assets do their own auth.
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const token = await getToken({ req, secret: authSecret() })
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
