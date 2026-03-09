import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCaptain } from "@/lib/auth";

// POST: captain creates a trial request for a player
export async function POST(request: Request) {
  const captain = await getCurrentCaptain();
  if (!captain) {
    return NextResponse.json({ error: "Sign in as a captain to request trials" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { playerId, message } = body as { playerId: string; message?: string };
    if (!playerId?.trim()) {
      return NextResponse.json({ error: "playerId required" }, { status: 400 });
    }
    const player = await prisma.player.findUnique({
      where: { id: playerId.trim() },
    });
    if (!player || !player.listed) {
      return NextResponse.json({ error: "Player not found or not listed" }, { status: 404 });
    }
    const existing = await prisma.trialRequest.findUnique({
      where: {
        captainId_playerId: { captainId: captain.id, playerId: player.id },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already requested this player to trial" },
        { status: 409 }
      );
    }
    const req = await prisma.trialRequest.create({
      data: {
        captainId: captain.id,
        playerId: player.id,
        message: message?.trim() || null,
      },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
          },
        },
      },
    });
    return NextResponse.json(req);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
