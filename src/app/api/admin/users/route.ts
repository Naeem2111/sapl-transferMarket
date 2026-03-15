import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { parsePositions } from "@/lib/positions";
import { parseLeagues } from "@/lib/leagues";

const DEFAULT_PAGE_SIZE = 20;

// GET /api/admin/users — list all registered players and captains (with pagination)
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10)));

  try {
    const players = await prisma.player.findMany({
      where: { authPhone: { not: null } }, // only registered players
      orderBy: { createdAt: "desc" },
    });

    const captains = await prisma.captain.findMany({
      where: { approvalStatus: { notIn: ["rejected", "revoked"] } },
      orderBy: { createdAt: "desc" },
    });

    // Format players
    let playerList = players.map((p) => ({
      type: "player" as const,
      id: p.id,
      personId: p.personId,
      firstName: p.firstName,
      lastName: p.lastName,
      userName: p.userName,
      gamertag: p.gamertag || p.internalRef1 || p.internalRef2 || null,
      email: p.email,
      authPhone: p.authPhone,
      mobilePhone: p.mobilePhone,
      workPhone: p.workPhone,
      homePhone: p.homePhone,
      teams: p.teams,
      role: p.role,
      platform: p.platform,
      status: p.status,
      listed: p.listed,
      preferredPositions: parsePositions(p.preferredPositions),
      preferredLeagues: parseLeagues(p.preferredLeagues),
      bio: p.bio,
      previousClub: p.previousClub,
      internalRef1: p.internalRef1,
      internalRef2: p.internalRef2,
      createdAt: p.createdAt,
    }));

    let captainList = captains.map((c) => ({
      type: "captain" as const,
      id: c.id,
      email: c.email,
      teamName: c.teamName,
      approvalStatus: c.approvalStatus,
      listed: c.listed,
      platform: c.platform,
      preferredLeagues: parseLeagues(c.preferredLeagues),
      preferredPositions: parsePositions(c.preferredPositions),
      role: c.role,
      clubStatus: c.clubStatus,
      whatsappNumber: c.whatsappNumber,
      trialGroupLink: c.trialGroupLink,
      requirements: c.requirements,
      createdAt: c.createdAt,
    }));

    // Filter by search
    if (search) {
      playerList = playerList.filter((p) => {
        const haystack = [
          p.firstName, p.lastName, p.userName, p.gamertag,
          p.email, p.authPhone, p.mobilePhone, p.teams, p.personId,
        ].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(search);
      });

      captainList = captainList.filter((c) => {
        const haystack = [
          c.email, c.teamName, c.whatsappNumber,
        ].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(search);
      });
    }

    // Totals (after filtering, before pagination)
    const playerTotal = playerList.length;
    const captainTotal = captainList.length;
    const playerTotalPages = Math.max(1, Math.ceil(playerTotal / limit));
    const captainTotalPages = Math.max(1, Math.ceil(captainTotal / limit));

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedPlayers = playerList.slice(skip, skip + limit);
    const paginatedCaptains = captainList.slice(skip, skip + limit);

    return NextResponse.json({
      players: paginatedPlayers,
      captains: paginatedCaptains,
      playerTotal,
      captainTotal,
      playerTotalPages,
      captainTotalPages,
      page,
      limit,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/admin/users — edit a player or captain
export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, id, data } = body as {
      type: "player" | "captain";
      id: string;
      data: Record<string, unknown>;
    };

    if (!type || !id || !data) {
      return NextResponse.json({ error: "type, id, and data required" }, { status: 400 });
    }

    if (type === "player") {
      // Build safe update payload — only allow known fields
      const allowed: Record<string, unknown> = {};
      const stringFields = [
        "firstName", "lastName", "userName", "gamertag", "email",
        "mobilePhone", "workPhone", "homePhone", "teams", "role",
        "platform", "bio", "previousClub", "status",
        "internalRef1", "internalRef2",
      ];
      for (const key of stringFields) {
        if (key in data) {
          const val = data[key];
          allowed[key] = typeof val === "string" && val.trim() ? val.trim() : null;
        }
      }
      // Handle authPhone separately — strip + and non-digits
      if ("authPhone" in data) {
        const raw = typeof data.authPhone === "string" ? data.authPhone.replace(/\D/g, "") : "";
        allowed.authPhone = raw || null;
      }
      if ("listed" in data) allowed.listed = !!data.listed;
      if ("preferredPositions" in data && Array.isArray(data.preferredPositions)) {
        allowed.preferredPositions = JSON.stringify(data.preferredPositions);
      }
      if ("preferredLeagues" in data && Array.isArray(data.preferredLeagues)) {
        allowed.preferredLeagues = JSON.stringify(data.preferredLeagues);
      }

      await prisma.player.update({ where: { id }, data: allowed });
      return NextResponse.json({ ok: true });
    }

    if (type === "captain") {
      const allowed: Record<string, unknown> = {};
      const stringFields = [
        "email", "teamName", "platform", "role", "clubStatus",
        "trialGroupLink", "requirements", "whatsappNumber", "approvalStatus",
      ];
      for (const key of stringFields) {
        if (key in data) {
          const val = data[key];
          allowed[key] = typeof val === "string" && val.trim() ? val.trim() : null;
        }
      }
      if ("listed" in data) allowed.listed = !!data.listed;
      if ("preferredPositions" in data && Array.isArray(data.preferredPositions)) {
        allowed.preferredPositions = JSON.stringify(data.preferredPositions);
      }
      if ("preferredLeagues" in data && Array.isArray(data.preferredLeagues)) {
        allowed.preferredLeagues = JSON.stringify(data.preferredLeagues);
      }

      await prisma.captain.update({ where: { id }, data: allowed });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
