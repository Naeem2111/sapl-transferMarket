import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };
    const emailTrim = email?.trim();
    if (!emailTrim || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
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
