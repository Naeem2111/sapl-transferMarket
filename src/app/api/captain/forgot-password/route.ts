import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { toFullNumber } from "@/lib/phone";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/captain/forgot-password — verify OTP + set new password (phone-based)
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    const ipCheck = checkRateLimit(`capt-reset:ip:${ip}`, 10, 60 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { dialingCode, phoneNumber, code, newPassword } = body as {
      dialingCode: string;
      phoneNumber: string;
      code: string;
      newPassword: string;
    };

    const full = toFullNumber(dialingCode || "", phoneNumber || "");
    if (!full) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }
    if (!code || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Verification code and new password (min 6 characters) required" }, { status: 400 });
    }

    const phoneCheck = checkRateLimit(`capt-reset:phone:${full}`, 3, 60 * 60 * 1000);
    if (!phoneCheck.allowed) {
      return NextResponse.json({ error: "Too many reset attempts. Please try again later." }, { status: 429 });
    }

    // Verify OTP
    const otp = await prisma.pendingOtp.findUnique({ where: { phone: full } });
    if (!otp) {
      return NextResponse.json({ error: "No code found. Please request a new code." }, { status: 400 });
    }
    if (new Date() > otp.expiresAt) {
      await prisma.pendingOtp.delete({ where: { phone: full } });
      return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
    }
    if (otp.code !== code.trim()) {
      return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
    }

    // Find captain by phone
    const captain = await prisma.captain.findFirst({ where: { authPhone: full } });
    if (!captain) {
      return NextResponse.json({ error: "No captain account found with this phone number." }, { status: 404 });
    }

    // Update password and clean up
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.captain.update({
      where: { id: captain.id },
      data: { passwordHash },
    });
    await prisma.pendingOtp.delete({ where: { phone: full } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
