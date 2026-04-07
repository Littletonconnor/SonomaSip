import { NextRequest, NextResponse } from 'next/server';
import { globalLimiter } from '@/lib/rate-limit';

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

function rateLimitResponse(retryAfter: number) {
  return new NextResponse('Too Many Requests', {
    status: 429,
    headers: {
      'Retry-After': String(retryAfter),
      'Content-Type': 'text/plain',
    },
  });
}

export function middleware(request: NextRequest) {
  const ip = getIp(request);

  const { allowed, retryAfter } = globalLimiter.check(ip);
  if (!allowed) return rateLimitResponse(retryAfter);

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|hero/|icons/).*)'],
};
