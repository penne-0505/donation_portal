import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PLATFORM_HEADER = 'x-platform-target';
const VARY_HEADER = 'Vary';

function detectPlatform(userAgent: string): 'mac' | 'win' | 'linux' {
  const ua = userAgent.toLowerCase();

  if (ua.includes('windows')) {
    return 'win';
  }

  if (
    ua.includes('macintosh') ||
    ua.includes('mac os x') ||
    ua.includes('ipad') ||
    ua.includes('iphone')
  ) {
    return 'mac';
  }

  if (ua.includes('android') || ua.includes('cros') || ua.includes('linux')) {
    return 'linux';
  }

  return 'mac';
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') ?? '';
  const platform = detectPlatform(userAgent);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PLATFORM_HEADER, platform);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const existingVary = response.headers.get(VARY_HEADER);
  response.headers.set(VARY_HEADER, existingVary ? `${existingVary}, User-Agent` : 'User-Agent');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|fonts).*)'],
};
