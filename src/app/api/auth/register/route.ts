import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setPlayerSession } from "@/lib/auth";
import { toFullNumber, normalizedFormsForMatch } from "@/lib/phone";

// Register = verify OTP then set password for the player (matched by phone from LeagueRepublic)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dialingCode, phoneNumber, otp, password } = body as {
      dialingCode: string;
      phoneNumber: string;
      otp: string;
      password: string;
    };
    const full = toFullNumber(dialingCode || "", phoneNumber || "");
    const code = (otp || "").replace(/\D/g, "");
    if (!full || !code || code.length !== 6) {
      return NextResponse.json(
        { error: "Phone number and 6-digit OTP required" },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password (min 6 characters) required" },
        { status: 400 }
      );
    }
    const pending = await prisma.pendingOtp.findUnique({
      where: { phone: full },
    });
    if (!pending) {
      return NextResponse.json(
        { error: "No OTP sent to this number. Request a new code first." },
        { status: 400 }
      );
    }
    if (pending.code !== code) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }
    if (new Date() > pending.expiresAt) {
      await prisma.pendingOtp.delete({ where: { phone: full } });
      return NextResponse.json(
        { error: "Verification code has expired. Request a new code." },
        { status: 400 }
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
        { error: "Player not found for this phone number." },
        { status: 404 }
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.player.update({
      where: { id: player.id },
      data: { authPhone: full, passwordHash },
    });
    await prisma.pendingOtp.delete({ where: { phone: full } });
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
