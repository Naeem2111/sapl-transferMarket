import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLeagues } from "@/lib/leagues";
import { parsePositions } from "@/lib/positions";
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
      },
      orderBy: { createdAt: "asc" },
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
          preferredLeagues: parseLeagues(c.preferredLeagues),
          preferredPositions: parsePositions(c.preferredPositions),
          role: c.role,
          clubStatus: c.clubStatus,
          trialGroupLink: player || admin ? c.trialGroupLink : null,
          requirements: c.requirements,
          whatsappLink,
          whatsappNumber: admin ? c.whatsappNumber : null,
        };
      })
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
