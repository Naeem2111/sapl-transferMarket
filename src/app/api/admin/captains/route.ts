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
      approvalStatus: true,
      listed: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(captains);
}

// PATCH /api/admin/captains — approve or reject a captain
export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  try {
    const { captainId, action } = (await request.json()) as {
      captainId: string;
      action: "approve" | "reject";
    };
    if (!captainId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const updated = await prisma.captain.update({
      where: { id: captainId },
      data: { approvalStatus: action === "approve" ? "approved" : "rejected" },
    });
    return NextResponse.json({ ok: true, approvalStatus: updated.approvalStatus });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
