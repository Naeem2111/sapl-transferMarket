import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLeagues } from "@/lib/leagues";
import { parsePositions } from "@/lib/positions";
import { parsePlatforms } from "@/lib/platforms";
import { getCurrentPlayer, getCurrentAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const player = await getCurrentPlayer();
    const admin = await getCurrentAdmin();

    const captains = await prisma.captain.findMany({
      where: {
        approvalStatus: "approved",
        listed: true,
      },
      select: {
        id: true,
        email: true,
        teamName: true,
        platform: true,
        preferredLeagues: true,
        preferredPositions: true,
        role: true,
        clubStatus: true,
        trialGroupLink: true,
        requirements: true,
        whatsappNumber: true,
        listedAt: true,
        updatedAt: true,
      },
      orderBy: [{ listedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    });

    return NextResponse.json(
      captains.map((c) => {
        const whatsappLink =
          (player || admin) && c.whatsappNumber
            ? `https://wa.me/${c.whatsappNumber.replace(/\D/g, "")}`
            : null;

        return {
          id: c.id,
          email: c.email,
          teamName: c.teamName,
          platform: c.platform,
          platforms: parsePlatforms(c.platform),
          preferredLeagues: parseLeagues(c.preferredLeagues),
          preferredPositions: parsePositions(c.preferredPositions),
          role: c.role,
          clubStatus: c.clubStatus,
          trialGroupLink: player || admin ? c.trialGroupLink : null,
          requirements: c.requirements,
          whatsappLink,
          whatsappNumber: admin ? c.whatsappNumber : null,
          listedAt: c.listedAt || c.updatedAt,
        };
      })
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
