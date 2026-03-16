import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

// GET /api/admin/captains — list all captains (admin only)
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  const captains = await prisma.captain.findMany({
    select: {
      id: true,
      email: true,
      teamName: true,
      authPhone: true,
      approvalStatus: true,
      listed: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(captains);
}

// PATCH /api/admin/captains — approve, reject, revoke, or reapprove a captain
export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  try {
    const { captainId, action } = (await request.json()) as {
      captainId: string;
      action: "approve" | "reject" | "revoke" | "reapprove";
    };
    if (!captainId || !["approve", "reject", "revoke", "reapprove"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      revoke: "revoked",
      reapprove: "pending",
    };

    const updated = await prisma.captain.update({
      where: { id: captainId },
      data: { approvalStatus: statusMap[action] },
    });
    return NextResponse.json({ ok: true, approvalStatus: updated.approvalStatus });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/captains — permanently delete a captain
export async function DELETE(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  try {
    const { captainId } = (await request.json()) as { captainId: string };
    if (!captainId) {
      return NextResponse.json({ error: "captainId required" }, { status: 400 });
    }
    await prisma.captain.delete({ where: { id: captainId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
