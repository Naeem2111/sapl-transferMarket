import { NextResponse, type NextRequest } from "next/server";

const NEW_SITE_URL =
  process.env.NEXT_PUBLIC_NEW_SAPL_URL || "https://sapl-platform.vercel.app";

export function middleware(request: NextRequest) {
  const targetUrl = new URL(NEW_SITE_URL);

  if (request.nextUrl.host === targetUrl.host) {
    return NextResponse.next();
  }

  return NextResponse.redirect(targetUrl);
}

export const config = {
  matcher: [
    /*
     * Redirect old frontend pages while leaving build assets and API routes alone.
     * API access remains available for controlled migration/backups if needed.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
