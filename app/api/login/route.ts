import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Galat password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  // httpOnly cookie => JavaScript se access nahi hoti, chori hona mushkil hai
  res.cookies.set("ceo_session", password, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 din tak login yaad rahega
  });

  return res;
}
