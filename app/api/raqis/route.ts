import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const raqis = await (db as any).raqi.findMany();
    return NextResponse.json(raqis);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch raqis" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name) {
      return NextResponse.json(
        { error: "রাক্বীর নাম আবশ্যক!" },
        { status: 400 },
      );
    }

    const newRaqi = await (db as any).raqi.create({
      data: { name: String(name), phone: phone ? String(phone) : "" },
    });

    return NextResponse.json({ success: true, raqi: newRaqi }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "রাক্বী যোগ করা সম্ভব হয়নি" },
      { status: 500 },
    );
  }
}
// রাক্বী ডিলিট করার API
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "আইডি দেওয়া হয়নি" }, { status: 400 });
    }

    const sqlite = (db as any).sqlite;
    if (sqlite) {
      const stmt = sqlite.prepare('DELETE FROM "Raqi" WHERE "id" = ?');
      stmt.run(String(id));
    }

    return NextResponse.json({
      success: true,
      message: "রাক্বী সফলভাবে মুছে ফেলা হয়েছে",
    });
  } catch (error) {
    return NextResponse.json({ error: "ডিলিট ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
