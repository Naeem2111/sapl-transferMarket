import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setCaptainSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit per IP: 20 login attempts per hour
    const ipCheck = checkRateLimit(`capt-login:ip:${ip}`, 20, 60 * 60 * 1000);
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
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Rate limit per email: 5 login attempts per 15 minutes
    const emailCheck = checkRateLimit(`capt-login:email:${emailTrim.toLowerCase()}`, 5, 15 * 60 * 1000);
    if (!emailCheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const captain = await prisma.captain.findUnique({
      where: { email: emailTrim.toLowerCase() },
    });
    if (!captain) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, captain.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (captain.approvalStatus === "pending") {
      return NextResponse.json(
        { error: "Your account is pending approval. You'll be able to sign in once an admin approves your registration." },
        { status: 403 }
      );
    }
    if (captain.approvalStatus === "rejected") {
      return NextResponse.json(
        { error: "Your registration was not approved. Please contact the league admin." },
        { status: 403 }
      );
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
