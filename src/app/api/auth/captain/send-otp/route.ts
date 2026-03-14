import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toFullNumber } from "@/lib/phone";
import { generateOtpCode, getOtpExpiry } from "@/lib/otp";
import { sendWhatsApp } from "@/lib/whatsapp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/auth/captain/send-otp — send WhatsApp OTP for captain registration or password reset
// Unlike player send-otp, this does NOT check LeagueRepublic import
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    const ipCheck = checkRateLimit(`capt-otp:ip:${ip}`, 15, 60 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { dialingCode, phoneNumber } = body as {
      dialingCode: string;
      phoneNumber: string;
    };

    const full = toFullNumber(dialingCode || "", phoneNumber || "");
    if (!full) {
      return NextResponse.json({ error: "Phone number (with dialing code) required" }, { status: 400 });
    }

    const phoneCheck = checkRateLimit(`capt-otp:phone:${full}`, 5, 60 * 60 * 1000);
    if (!phoneCheck.allowed) {
      return NextResponse.json({ error: "Too many code requests. Please try again later." }, { status: 429 });
    }

    const code = generateOtpCode();
    const expiresAt = getOtpExpiry();

    await prisma.pendingOtp.upsert({
      where: { phone: full },
      create: { phone: full, code, expiresAt },
      update: { code, expiresAt },
    });

    const result = await sendWhatsApp(full, code);
    if (!result.ok) {
      return NextResponse.json({ error: "Failed to send WhatsApp message. Please try again later." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
