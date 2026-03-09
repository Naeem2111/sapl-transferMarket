import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPlayer } from "@/lib/auth";

// PATCH: player accepts or declines a trial request
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Sign in as a player" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const { status } = body as { status: "accepted" | "declined" };
    if (status !== "accepted" && status !== "declined") {
      return NextResponse.json({ error: "status must be accepted or declined" }, { status: 400 });
    }
    const trial = await prisma.trialRequest.findFirst({
      where: { id, playerId: player.id },
    });
    if (!trial) {
      return NextResponse.json({ error: "Trial request not found" }, { status: 404 });
    }
    await prisma.trialRequest.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
