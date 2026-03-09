import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setCaptainSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };
    const emailTrim = email?.trim();
    if (!emailTrim || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }
    const captain = await prisma.captain.findUnique({
      where: { email: emailTrim.toLowerCase() },
    });
    if (!captain) {
      return NextResponse.json({ error: "No account with this email" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, captain.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    await setCaptainSession(captain.id);
    return NextResponse.json({
      ok: true,
      captain: {
        id: captain.id,
        email: captain.email,
        teamName: captain.teamName,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
