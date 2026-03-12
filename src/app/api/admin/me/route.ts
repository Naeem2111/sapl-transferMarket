import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not signed in as admin" }, { status: 401 });
  }
  return NextResponse.json({ id: admin.id, email: admin.email });
}
