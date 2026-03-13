import { NextResponse } from "next/server";
import { getCurrentCaptain } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseLeagues } from "@/lib/leagues";
import { parsePositions } from "@/lib/positions";

export async function GET() {
  const captain = await getCurrentCaptain();
  if (!captain) {
    return NextResponse.json({ error: "Not signed in as captain" }, { status: 401 });
  }
  return NextResponse.json({
    id: captain.id,
    email: captain.email,
    teamName: captain.teamName,
    listed: captain.listed,
    approvalStatus: captain.approvalStatus,
    platform: captain.platform,
    preferredLeagues: parseLeagues(captain.preferredLeagues),
    preferredPositions: parsePositions(captain.preferredPositions),
    role: captain.role,
    clubStatus: captain.clubStatus,
    trialGroupLink: captain.trialGroupLink,
    requirements: captain.requirements,
    whatsappNumber: captain.whatsappNumber,
  });
}

export async function PATCH(request: Request) {
  const captain = await getCurrentCaptain();
  if (!captain) {
    return NextResponse.json({ error: "Not signed in as captain" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const {
      teamName,
      listed,
      platform,
      preferredLeagues,
      preferredPositions,
      role,
      clubStatus,
      trialGroupLink,
      requirements,
      whatsappNumber,
    } = body as {
      teamName?: string | null;
      listed?: boolean;
      platform?: string | null;
      preferredLeagues?: string[];
      preferredPositions?: string[];
      role?: string | null;
      clubStatus?: string | null;
      trialGroupLink?: string | null;
      requirements?: string | null;
      whatsappNumber?: string | null;
    };

    const data: Parameters<typeof prisma.captain.update>[0]["data"] = {};
    if (teamName !== undefined) data.teamName = teamName?.trim() || null;
    if (listed !== undefined) data.listed = listed;
    if (platform !== undefined) data.platform = platform?.trim() || null;
    if (Array.isArray(preferredLeagues)) data.preferredLeagues = JSON.stringify(preferredLeagues);
    if (Array.isArray(preferredPositions)) data.preferredPositions = JSON.stringify(preferredPositions);
    if (role !== undefined) data.role = role?.trim() || null;
    if (clubStatus !== undefined) data.clubStatus = clubStatus?.trim() || null;
    if (trialGroupLink !== undefined) data.trialGroupLink = trialGroupLink?.trim() || null;
    if (requirements !== undefined) data.requirements = requirements?.trim() || null;
    if (whatsappNumber !== undefined) data.whatsappNumber = whatsappNumber?.trim() || null;

    const updated = await prisma.captain.update({
      where: { id: captain.id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      teamName: updated.teamName,
      listed: updated.listed,
      approvalStatus: updated.approvalStatus,
      platform: updated.platform,
      preferredLeagues: parseLeagues(updated.preferredLeagues),
      preferredPositions: parsePositions(updated.preferredPositions),
      role: updated.role,
      clubStatus: updated.clubStatus,
      trialGroupLink: updated.trialGroupLink,
      requirements: updated.requirements,
      whatsappNumber: updated.whatsappNumber,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
