import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clubs — returns distinct previousClub values for autocomplete
export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: { previousClub: { not: null } },
      select: { previousClub: true },
      distinct: ["previousClub"],
    });

    // Also pull team names from captains for a fuller list
    const captains = await prisma.captain.findMany({
      where: { teamName: { not: null } },
      select: { teamName: true },
    });

    const clubSet = new Set<string>();
    for (const p of players) {
      if (p.previousClub?.trim()) clubSet.add(p.previousClub.trim());
    }
    for (const c of captains) {
      if (c.teamName?.trim()) clubSet.add(c.teamName.trim());
    }

    const clubs = Array.from(clubSet).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    return NextResponse.json(clubs);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 500 });
  }
}
