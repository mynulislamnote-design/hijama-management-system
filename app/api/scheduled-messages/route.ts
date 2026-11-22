import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const messages = await (db as any).scheduledMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(messages || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, timeSlot, dayNumber, date, message } = body;

    if (!message) {
      return NextResponse.json({ error: "মেসেজ লিখা আবশ্যক" }, { status: 400 });
    }

    const newMessage = await (db as any).scheduledMessage.create({
      data: {
        category: category || "ALL",
        timeSlot: timeSlot || "MORNING",
        dayNumber: dayNumber ? parseInt(dayNumber) : null,
        date: date || null,
        message: String(message),
      },
    });

    return NextResponse.json(
      { success: true, message: newMessage },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "আইডি আবশ্যক" }, { status: 400 });
    }

    await (db as any).scheduledMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
