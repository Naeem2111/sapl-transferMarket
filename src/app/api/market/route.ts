import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePositions } from "@/lib/positions";
import { parseLeagues } from "@/lib/leagues";
import { getCurrentCaptain } from "@/lib/auth";
import { getWhatsAppLink } from "@/lib/phone";

// Only returns players who have listed themselves (listed === true).
// Public: only name + what they filled in (positions, leagues, bio). No contact info.
// When captain is logged in: add whatsappLink and alreadyRequestedTrial per player.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league");
  const position = searchParams.get("position");
  try {
    const where: { listed: boolean; preferredLeagues?: { contains: string }; preferredPositions?: { contains: string } } = {
      listed: true,
    };
    if (league?.trim()) {
      where.preferredLeagues = { contains: league.trim() };
    }
    if (position?.trim()) {
      where.preferredPositions = { contains: position.trim() };
    }
    const captain = await getCurrentCaptain();
    const players = await prisma.player.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      include:
        captain
          ? {
              trialRequestsAsPlayer: {
                where: { captainId: captain.id },
                select: { id: true },
              },
            }
          : undefined,
    });
    const list = players.map((p) => {
      const base: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        gamertag: string | null;
        preferredPositions: string[];
        preferredLeagues: string[];
        bio: string | null;
        updatedAt: Date;
        whatsappLink?: string | null;
        alreadyRequestedTrial?: boolean;
      } = {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        // Profile gamertag overrides; else LeagueRepublic Internal Ref 1 or 2
        gamertag:
          (p.gamertag?.trim() || p.internalRef1?.trim() || p.internalRef2?.trim()) || null,
        preferredPositions: parsePositions(p.preferredPositions),
        preferredLeagues: parseLeagues(p.preferredLeagues),
        bio: p.bio,
        updatedAt: p.updatedAt,
      };
      if (captain) {
        base.whatsappLink = getWhatsAppLink(
          p.authPhone,
          p.mobilePhone,
          p.workPhone,
          p.homePhone
        );
        base.alreadyRequestedTrial =
          "trialRequestsAsPlayer" in p &&
          Array.isArray(p.trialRequestsAsPlayer) &&
          p.trialRequestsAsPlayer.length > 0;
      }
      return base;
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
