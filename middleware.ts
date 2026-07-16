import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";
import { SESSION_COOKIE } from "./lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public access to dedicated admin login page (§2.2)
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect all other /admin/* routes
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const session = await verifyToken(token);
    if (!session) {
      // Invalid/expired token
      const response = NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    if (session.role !== "admin") {
      // Customer trying to access admin — §2.2: redirect back to customer
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
