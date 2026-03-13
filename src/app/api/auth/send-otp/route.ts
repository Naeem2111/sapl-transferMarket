import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toFullNumber, normalizedFormsForMatch } from "@/lib/phone";
import { generateOtpCode, getOtpExpiry } from "@/lib/otp";
import { sendWhatsApp } from "@/lib/whatsapp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit per IP: 15 requests per hour
    const ipCheck = checkRateLimit(`otp:ip:${ip}`, 15, 60 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { dialingCode, phoneNumber } = body as {
      dialingCode: string;
      phoneNumber: string;
    };
    const full = toFullNumber(dialingCode || "", phoneNumber || "");
    if (!full) {
      return NextResponse.json(
        { error: "Phone number (with dialing code) required" },
        { status: 400 }
      );
    }

    // Rate limit per phone: 5 requests per hour
    const phoneCheck = checkRateLimit(`otp:phone:${full}`, 5, 60 * 60 * 1000);
    if (!phoneCheck.allowed) {
      return NextResponse.json(
        { error: "Too many code requests for this number. Please try again later." },
        { status: 429 }
      );
    }
    const allPlayers = await prisma.player.findMany({
      where: {
        OR: [
          { mobilePhone: { not: null } },
          { workPhone: { not: null } },
          { homePhone: { not: null } },
        ],
      },
    });
    const player = allPlayers.find((p) => {
      const phones = [p.mobilePhone, p.workPhone, p.homePhone].filter(Boolean) as string[];
      for (const ph of phones) {
        const forms = normalizedFormsForMatch(ph);
        if (forms.includes(full)) return true;
      }
      return false;
    });
    if (!player) {
      return NextResponse.json(
        { error: "No player found with this phone number. Your number must be in the LeagueRepublic import." },
        { status: 404 }
      );
    }
    const code = generateOtpCode();
    const expiresAt = getOtpExpiry();
    await prisma.pendingOtp.upsert({
      where: { phone: full },
      create: { phone: full, code, expiresAt },
      update: { code, expiresAt },
    });
    const waResult = await sendWhatsApp(
      full,
      `Your SAPL Transfer Market verification code is: ${code}. It expires in 10 minutes.`
    );
    if (!waResult.ok) {
      return NextResponse.json(
        { error: "Failed to send WhatsApp message. Please try again later." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
