import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { toFullNumber } from "@/lib/phone";

// GET /api/admin/pending-players — list all pending player registrations
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const registrations = await prisma.pendingPlayerRegistration.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Look up personId for any linked players
  const linkedIds = registrations.map((r) => r.linkedPlayerId).filter(Boolean) as string[];
  const linkedPlayers = linkedIds.length > 0
    ? await prisma.player.findMany({
        where: { id: { in: linkedIds } },
        select: { id: true, personId: true, firstName: true, lastName: true },
      })
    : [];
  const playerMap = new Map(linkedPlayers.map((p) => [p.id, p]));

  const result = registrations.map((r) => {
    const linked = r.linkedPlayerId ? playerMap.get(r.linkedPlayerId) : null;
    return {
      ...r,
      linkedPersonId: linked?.personId || null,
      linkedPlayerName: linked ? [linked.firstName, linked.lastName].filter(Boolean).join(" ") : null,
    };
  });

  return NextResponse.json(result);
}

// PATCH /api/admin/pending-players — approve, reject, or link a pending registration
export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { registrationId, action, adminNotes, linkedPersonId } = body as {
      registrationId: string;
      action: "approve" | "reject";
      adminNotes?: string;
      linkedPersonId?: string; // LeagueRepublic personId to link to
    };

    if (!registrationId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const registration = await prisma.pendingPlayerRegistration.findUnique({
      where: { id: registrationId },
    });
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (action === "approve") {
      // If admin provided a personId to link to, verify it exists and update the player's phone
      let linkedPlayerId: string | null = null;

      if (linkedPersonId?.trim()) {
        const player = await prisma.player.findUnique({
          where: { personId: linkedPersonId.trim() },
        });
        if (!player) {
          return NextResponse.json(
            { error: `No player found with Person ID "${linkedPersonId.trim()}". Check the ID and try again.` },
            { status: 400 }
          );
        }

        // Normalise the phone and update the player record so OTP works next time
        const fullPhone = toFullNumber(
          registration.dialingCode,
          registration.phoneNumber
        );

        await prisma.player.update({
          where: { id: player.id },
          data: {
            // Set mobilePhone to the normalised number so send-otp can match it
            mobilePhone: fullPhone || registration.phoneNumber,
          },
        });

        linkedPlayerId = player.id;
      }

      await prisma.pendingPlayerRegistration.update({
        where: { id: registrationId },
        data: {
          status: "approved",
          adminNotes: adminNotes?.trim() || null,
          linkedPlayerId,
          reviewedAt: new Date(),
        },
      });
    } else {
      // Reject
      await prisma.pendingPlayerRegistration.update({
        where: { id: registrationId },
        data: {
          status: "rejected",
          adminNotes: adminNotes?.trim() || null,
          reviewedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/pending-players — delete resolved registrations
export async function DELETE(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  try {
    const { registrationId, clearAll } = (await request.json()) as {
      registrationId?: string;
      clearAll?: boolean;
    };

    if (clearAll) {
      // Delete all resolved (non-pending) registrations
      await prisma.pendingPlayerRegistration.deleteMany({
        where: { status: { not: "pending" } },
      });
      return NextResponse.json({ ok: true });
    }

    if (registrationId) {
      await prisma.pendingPlayerRegistration.delete({
        where: { id: registrationId },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "registrationId or clearAll required" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
