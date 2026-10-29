import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "commerce_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const session = request.cookies.get(SESSION_COOKIE_NAME);
    if (session?.value) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
