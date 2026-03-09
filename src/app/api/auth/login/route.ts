import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setPlayerSession } from "@/lib/auth";
import { toFullNumber } from "@/lib/phone";

export async function POST(request: Request) {
  try {
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
    const player = await prisma.player.findUnique({
      where: { authPhone: full },
    });
    if (!player?.passwordHash) {
      return NextResponse.json({ error: "Invalid phone or not registered" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, player.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
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
