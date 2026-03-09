import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";

// Expects multipart form with file field "csv" (LeagueRepublic PERSON export)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("csv");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
    }
    const text = await file.text();
    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];
    const headers = rows[0] ? Object.keys(rows[0]) : [];
    const map = (row: Record<string, string>, key: string) => row[key]?.trim() ?? null;
    const mapStr = (row: Record<string, string>, key: string) => row[key]?.trim() ?? "";
    let created = 0;
    let updated = 0;
    for (const row of rows) {
      const personId = map(row, "Person ID") || map(row, "Person Id") || "";
      if (!personId) continue;
      const firstName = map(row, "First Name");
      const lastName = map(row, "Last Name");
      const email = map(row, "Email Addr");
      const userName = map(row, "User Name");
      const role = mapStr(row, "Role") || "Player";
      const teams = map(row, "Teams");
      const activeFrom = map(row, "Active From");
      const activeTo = map(row, "Active To");
      const workPhone = map(row, "Work Phone");
      const homePhone = map(row, "Home Phone");
      const mobilePhone = map(row, "Mobile Phone");
      const status = map(row, "Status");
      const dob = map(row, "DOB");
      const houseNo = map(row, "House No.");
      const houseName = map(row, "House Name");
      const addr1 = map(row, "Addr 1");
      const addr2 = map(row, "Addr 2");
      const addr3 = map(row, "Addr 3");
      const city = map(row, "City");
      const county = map(row, "County");
      const postcode = map(row, "Postcode");
      const internalRef1 = map(row, "Internal Ref 1");
      const internalRef2 = map(row, "Internal Ref 2");
      const existing = await prisma.player.findUnique({ where: { personId } });
      const payload = {
        role,
        firstName,
        lastName,
        email,
        userName,
        teams,
        activeFrom,
        activeTo,
        workPhone,
        homePhone,
        mobilePhone,
        status,
        dob,
        houseNo,
        houseName,
        addr1,
        addr2,
        addr3,
        city,
        county,
        postcode,
        internalRef1,
        internalRef2,
      };
      if (existing) {
        await prisma.player.update({
          where: { personId },
          data: payload,
        });
        updated++;
      } else {
        await prisma.player.create({
          data: { personId, ...payload },
        });
        created++;
      }
    }
    return NextResponse.json({ ok: true, created, updated, rows: rows.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
