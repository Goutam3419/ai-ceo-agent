import { NextRequest, NextResponse } from "next/server";

// Ye middleware har request ko check karta hai jo /admin ya /api/chat pe jaati hai.
// Agar sahi "session cookie" nahi hai, to /login pe bhej deta hai.

export function middleware(req: NextRequest) {
  const session = req.cookies.get("ceo_session")?.value;
  const isAuthed = session && session === process.env.ADMIN_PASSWORD;

  if (!isAuthed) {
    // API route ke liye JSON error, page ke liye redirect
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Login zaroori hai." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/chat/:path*",
    "/api/apply-change/:path*",
    "/api/ceo-memory/:path*",
    "/api/ceo-tasks/:path*",
    "/api/conversations/:path*",
  ],
};
