import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setAdminSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit per IP: 10 login attempts per hour (stricter for admin)
    const ipCheck = checkRateLimit(`admin-login:ip:${ip}`, 10, 60 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body as { email: string; password: string };
    const emailTrim = email?.trim();
    if (!emailTrim || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Rate limit per email: 3 attempts per 15 minutes (very strict for admin)
    const emailCheck = checkRateLimit(`admin-login:email:${emailTrim.toLowerCase()}`, 3, 15 * 60 * 1000);
    if (!emailCheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }
    const admin = await prisma.admin.findUnique({
      where: { email: emailTrim.toLowerCase() },
    });
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    await setAdminSession(admin.id);
    return NextResponse.json({ ok: true, admin: { id: admin.id, email: admin.email } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
