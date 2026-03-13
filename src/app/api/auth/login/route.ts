import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setPlayerSession } from "@/lib/auth";
import { toFullNumber } from "@/lib/phone";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit per IP: 20 login attempts per hour
    const ipCheck = checkRateLimit(`player-login:ip:${ip}`, 20, 60 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { dialingCode, phoneNumber, password } = body as {
      dialingCode: string;
      phoneNumber: string;
      password: string;
    };
    const full = toFullNumber(dialingCode || "", phoneNumber || "");
    if (!full || !password) {
      return NextResponse.json(
        { error: "Phone number and password required" },
        { status: 400 }
      );
    }

    // Rate limit per phone: 5 login attempts per 15 minutes
    const phoneCheck = checkRateLimit(`player-login:phone:${full}`, 5, 15 * 60 * 1000);
    if (!phoneCheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts for this number. Please try again later." },
        { status: 429 }
      );
    }

    const player = await prisma.player.findUnique({
      where: { authPhone: full },
    });
    if (!player?.passwordHash) {
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, player.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
    }
    await setPlayerSession(player.id);
    return NextResponse.json({
      ok: true,
      player: {
        id: player.id,
        personId: player.personId,
        firstName: player.firstName,
        lastName: player.lastName,
        userName: player.userName,
        email: player.email,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
