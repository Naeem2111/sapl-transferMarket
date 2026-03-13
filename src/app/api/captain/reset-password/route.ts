import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit per IP: 10 requests per hour
    const ipCheck = checkRateLimit(`capt-set-pw:ip:${ip}`, 10, 60 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { token, newPassword } = (await request.json()) as {
      token: string;
      newPassword: string;
    };

    if (!token || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Token and new password (min 6 characters) required" }, { status: 400 });
    }

    // Rate limit per token: 5 attempts per 15 minutes
    const tokenCheck = checkRateLimit(`capt-set-pw:token:${token}`, 5, 15 * 60 * 1000);
    if (!tokenCheck.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new reset link." },
        { status: 429 }
      );
    }

    const record = await prisma.captainResetToken.findUnique({ where: { token } });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }
    if (new Date() > record.expiresAt) {
      await prisma.captainResetToken.delete({ where: { token } });
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.captain.update({
      where: { id: record.captainId },
      data: { passwordHash },
    });
    await prisma.captainResetToken.delete({ where: { token } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
