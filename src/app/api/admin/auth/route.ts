import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "kl_admin_session";

function getExpectedSecret(): string {
  return process.env.ADMIN_SECRET_KEY || "kreatiflabs2026";
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);

  if (session && session.value === getExpectedSecret()) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false });
}

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password || password !== getExpectedSecret()) {
      return NextResponse.json(
        { error: "Password atau PIN admin salah." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, getExpectedSecret(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Login berhasil" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ success: true, message: "Logout berhasil" });
}
