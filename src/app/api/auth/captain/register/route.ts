import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setCaptainSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, teamName } = body as {
      email: string;
      password: string;
      teamName?: string;
    };
    const emailTrim = email?.trim();
    if (!emailTrim || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Email and password (min 6 characters) required" },
        { status: 400 }
      );
    }
    const existing = await prisma.captain.findUnique({
      where: { email: emailTrim.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 }
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const captain = await prisma.captain.create({
      data: {
        email: emailTrim.toLowerCase(),
        passwordHash,
        teamName: teamName?.trim() || null,
      },
    });
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
