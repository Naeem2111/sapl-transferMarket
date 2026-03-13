import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/auth/register/manual — submit a manual registration request
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit: 5 submissions per hour per IP
    const ipCheck = checkRateLimit(`manual-reg:ip:${ip}`, 5, 60 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, dialingCode, phoneNumber, email, personId, teamName, notes } =
      body as {
        firstName: string;
        lastName: string;
        dialingCode: string;
        phoneNumber: string;
        email?: string;
        personId?: string;
        teamName?: string;
        notes?: string;
      };

    // Validation
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }
    if (!phoneNumber?.trim()) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    // Check for duplicate pending request with same phone
    const phone = phoneNumber.trim().replace(/\D/g, "");
    const existing = await prisma.pendingPlayerRegistration.findFirst({
      where: {
        phoneNumber: phone,
        status: "pending",
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending registration request. Please wait for admin review." },
        { status: 409 }
      );
    }

    await prisma.pendingPlayerRegistration.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dialingCode: (dialingCode || "27").replace(/\D/g, ""),
        phoneNumber: phone,
        email: email?.trim() || null,
        personId: personId?.trim() || null,
        teamName: teamName?.trim() || null,
        notes: notes?.trim() || null,
        status: "pending",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
