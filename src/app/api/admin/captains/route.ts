import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseLeagues } from "@/lib/leagues";
import { parsePositions } from "@/lib/positions";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not signed in as admin" }, { status: 401 });
  }

  const captains = await prisma.captain.findMany({
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
    captains.map((c) => ({
      ...c,
      preferredLeagues: parseLeagues(c.preferredLeagues),
      preferredPositions: parsePositions(c.preferredPositions),
    }))
  );
}
