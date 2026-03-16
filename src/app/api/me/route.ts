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
      role,
      platform,
      preferredPositions,
      preferredLeagues,
      bio,
      previousClub,
    } = body as {
      listed?: boolean;
      gamertag?: string | null;
      role?: string | null;
      platform?: string | null;
      preferredPositions?: string[];
      preferredLeagues?: string[];
      bio?: string | null;
      previousClub?: string | null;
    };

    const data: Parameters<typeof prisma.player.update>[0]["data"] = {};
    if (typeof listed === "boolean") data.listed = listed;
    if (gamertag !== undefined) data.gamertag = gamertag?.trim() || null;
    if (role !== undefined) data.role = role?.trim() || "Starter";
    if (platform !== undefined) data.platform = platform?.trim() || null;
    if (Array.isArray(preferredPositions)) data.preferredPositions = JSON.stringify(preferredPositions);
    if (Array.isArray(preferredLeagues)) data.preferredLeagues = JSON.stringify(preferredLeagues);
    if (bio !== undefined) data.bio = bio ?? null;
    if (previousClub !== undefined) data.previousClub = previousClub?.trim() || null;

    // Bump listedAt if listing is on AND last bump was >24h ago (or never)
    if (data.listed === true || (data.listed === undefined && player.listed)) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (!player.listedAt || new Date(player.listedAt) < oneDayAgo) {
        data.listedAt = new Date();
      }
    }
    // Clear listedAt when unlisting
    if (data.listed === false) {
      data.listedAt = null;
    }

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
