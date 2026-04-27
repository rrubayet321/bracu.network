import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAdminEmail } from '@/lib/auth/admin-allowlist';
import { rateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Rate-limit /join submissions ─────────────────────────────────
  // Only POST (form submission) — GET is the page load, no limit needed.
  if (pathname === '/join' && request.method === 'POST') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'anonymous';

    const result = rateLimit(`join:${ip}`, {
      limit: 5,          // 5 submissions…
      windowMs: 60_000,  // …per minute per IP
    });

    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many submissions. Please wait a moment and try again.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // ── 2. Rate-limit /admin/login attempts ─────────────────────────────
  if (pathname === '/admin/login' && request.method === 'POST') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'anonymous';

    const result = rateLimit(`admin-login:${ip}`, {
      limit: 10,          // 10 attempts…
      windowMs: 300_000,  // …per 5 minutes per IP
    });

    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many login attempts. Please wait before trying again.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  // ── 3. Protect /admin/* routes (existing auth check) ────────────────
  let supabaseResponse = NextResponse.next({ request });

  if (pathname.startsWith('/admin')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // getUser() validates with Supabase Auth server — cannot be spoofed
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isLoginRoute = pathname.startsWith('/admin/login');

    // Unauthenticated → login (except already on login page)
    if (!user && !isLoginRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated but email not in ADMIN_EMAILS → cannot access admin UI
    if (user && !isLoginRoute && !isAdminEmail(user.email)) {
      const home = request.nextUrl.clone();
      home.pathname = '/';
      home.search = '';
      return NextResponse.redirect(home);
    }

    // Already signed in as an allowed admin → skip login form
    if (user && isLoginRoute && isAdminEmail(user.email)) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = '/admin';
      adminUrl.search = '';
      return NextResponse.redirect(adminUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/join',
    '/admin/:path*',
    // Exclude static assets and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
