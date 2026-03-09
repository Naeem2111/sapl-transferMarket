import { NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePositions } from "@/lib/positions";
import { parseLeagues } from "@/lib/leagues";

export async function GET() {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json({
    ...player,
    preferredPositions: parsePositions(player.preferredPositions),
    preferredLeagues: parseLeagues(player.preferredLeagues),
  });
}

export async function PATCH(request: Request) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const {
      listed,
      gamertag,
      preferredPositions,
      preferredLeagues,
      bio,
    } = body as {
      listed?: boolean;
      gamertag?: string | null;
      preferredPositions?: string[];
      preferredLeagues?: string[];
      bio?: string | null;
    };
    const data: {
      listed?: boolean;
      gamertag?: string | null;
      preferredPositions?: string;
      preferredLeagues?: string;
      bio?: string | null;
    } = {};
    if (typeof listed === "boolean") data.listed = listed;
    if (gamertag !== undefined) data.gamertag = gamertag?.trim() || null;
    if (Array.isArray(preferredPositions)) data.preferredPositions = JSON.stringify(preferredPositions);
    if (Array.isArray(preferredLeagues)) data.preferredLeagues = JSON.stringify(preferredLeagues);
    if (bio !== undefined) data.bio = bio ?? null;
    const updated = await prisma.player.update({
      where: { id: player.id },
      data,
    });
    return NextResponse.json({
      ...updated,
      preferredPositions: parsePositions(updated.preferredPositions),
      preferredLeagues: parseLeagues(updated.preferredLeagues),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
