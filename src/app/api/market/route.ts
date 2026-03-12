import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePositions } from "@/lib/positions";
import { parseLeagues } from "@/lib/leagues";
import { getCurrentCaptain, getCurrentAdmin } from "@/lib/auth";
import { getWhatsAppLink, getWhatsAppNumber } from "@/lib/phone";

// Only returns players who have listed themselves (listed === true).
// Public: only name + what they filled in (positions, leagues, bio). No contact info.
// Captain: also gets whatsappLink and alreadyRequestedTrial per player.
// Admin: also gets whatsappNumber (for copy-post) and previousClub.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league");
  const position = searchParams.get("position");
  const platform = searchParams.get("platform");
  const role = searchParams.get("role");

  try {
    const where: {
      listed: boolean;
      preferredLeagues?: { contains: string };
      preferredPositions?: { contains: string };
      platform?: string;
      role?: string;
    } = { listed: true };

    if (league?.trim()) {
      where.preferredLeagues = { contains: league.trim() };
    }
    if (position?.trim()) {
      where.preferredPositions = { contains: position.trim() };
    }
    if (platform?.trim()) {
      where.platform = platform.trim();
    }
    if (role?.trim()) {
      where.role = role.trim();
    }

    const captain = await getCurrentCaptain();
    const admin = await getCurrentAdmin();

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
        role: string | null;
        platform: string | null;
        preferredPositions: string[];
        preferredLeagues: string[];
        bio: string | null;
        previousClub: string | null;
        updatedAt: Date;
        whatsappLink?: string | null;
        whatsappNumber?: string | null;
        alreadyRequestedTrial?: boolean;
      } = {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        gamertag:
          (p.gamertag?.trim() || p.internalRef1?.trim() || p.internalRef2?.trim()) || null,
        role: p.role || null,
        platform: p.platform || null,
        preferredPositions: parsePositions(p.preferredPositions),
        preferredLeagues: parseLeagues(p.preferredLeagues),
        bio: p.bio,
        previousClub: p.previousClub,
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

      // Admin gets the raw number for the copy-post (never rendered on screen)
      if (admin) {
        base.whatsappNumber = getWhatsAppNumber(
          p.authPhone,
          p.mobilePhone,
          p.workPhone,
          p.homePhone
        );
      }

      return base;
    });

    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
