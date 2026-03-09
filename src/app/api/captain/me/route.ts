import { NextResponse } from "next/server";
import { getCurrentCaptain } from "@/lib/auth";

export async function GET() {
  const captain = await getCurrentCaptain();
  if (!captain) {
    return NextResponse.json({ error: "Not signed in as captain" }, { status: 401 });
  }
  return NextResponse.json({
    id: captain.id,
    email: captain.email,
    teamName: captain.teamName,
  });
}
