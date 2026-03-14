import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { toFullNumber } from "@/lib/phone";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/auth/captain/register — register with email + phone (OTP already verified) + password
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipCheck = checkRateLimit(`capt-reg:ip:${ip}`, 5, 60 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { email, password, teamName, dialingCode, phoneNumber, otp } = body as {
      email: string;
      password: string;
      teamName?: string;
      dialingCode: string;
      phoneNumber: string;
      otp: string;
    };

    const emailTrim = email?.trim();
    if (!emailTrim || !password || password.length < 6) {
      return NextResponse.json({ error: "Email and password (min 6 characters) required" }, { status: 400 });
    }

    const full = toFullNumber(dialingCode || "", phoneNumber || "");
    if (!full) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const code = (otp || "").replace(/\D/g, "");
    if (code.length !== 6) {
      return NextResponse.json({ error: "6-digit verification code required" }, { status: 400 });
    }

    // Verify OTP
    const pending = await prisma.pendingOtp.findUnique({ where: { phone: full } });
    if (!pending) {
      return NextResponse.json({ error: "No code sent to this number. Request a new code first." }, { status: 400 });
    }
    if (pending.code !== code) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }
    if (new Date() > pending.expiresAt) {
      await prisma.pendingOtp.delete({ where: { phone: full } });
      return NextResponse.json({ error: "Code has expired. Request a new one." }, { status: 400 });
    }

    // Check for existing captain with this email
    const existing = await prisma.captain.findUnique({
      where: { email: emailTrim.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.captain.create({
      data: {
        email: emailTrim.toLowerCase(),
        passwordHash,
        teamName: teamName?.trim() || null,
        authPhone: full,
        whatsappNumber: `+${full}`, // also set as their WhatsApp contact number
        approvalStatus: "pending",
      },
    });

    // Clean up OTP
    await prisma.pendingOtp.delete({ where: { phone: full } });

    return NextResponse.json({ ok: true, pending: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
