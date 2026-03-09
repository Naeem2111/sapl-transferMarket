import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCaptain } from "@/lib/auth";
import { getCurrentPlayer } from "@/lib/auth";

// GET: as captain -> my trial requests; as player -> trial requests for me
export async function GET() {
  const captain = await getCurrentCaptain();
  const player = await getCurrentPlayer();
  if (captain) {
    const list = await prisma.trialRequest.findMany({
      where: { captainId: captain.id },
      orderBy: { createdAt: "desc" },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            preferredPositions: true,
            preferredLeagues: true,
          },
        },
      },
    });
    return NextResponse.json(
      list.map((r) => ({
        id: r.id,
        playerId: r.playerId,
        player: r.player,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt,
      }))
    );
  }
  if (player) {
    const list = await prisma.trialRequest.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: "desc" },
      include: {
        captain: {
          select: {
            id: true,
            email: true,
            teamName: true,
          },
        },
      },
    });
    return NextResponse.json(
      list.map((r) => ({
        id: r.id,
        captainId: r.captainId,
        captain: r.captain,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt,
      }))
    );
  }
  return NextResponse.json({ error: "Sign in as captain or player" }, { status: 401 });
}
