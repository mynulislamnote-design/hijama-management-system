import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// Next.js বিল্ড টাইমে প্রি-রেন্ডার এরর বন্ধ করার নিশ্চিত উপায়
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const messages = await db.scheduledMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(messages || []);
  } catch (error: any) {
    console.error("GET Scheduled Messages Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, timeSlot, dayNumber, date, message } = body;

    if (!message || !String(message).trim()) {
      return NextResponse.json(
        { error: "মেসেজের বার্তা লেখা আবশ্যক!" },
        { status: 400 },
      );
    }

    const newMessage = await db.scheduledMessage.create({
      data: {
        category: String(category || "ALL"),
        timeSlot: String(timeSlot || "MORNING"),
        dayNumber:
          dayNumber !== undefined && dayNumber !== null && dayNumber !== ""
            ? Number(dayNumber)
            : null,
        date: date ? String(date) : null,
        message: String(message).trim(),
      },
    });

    return NextResponse.json(
      { success: true, message: newMessage },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST Scheduled Message Error:", error);
    return NextResponse.json(
      { error: error?.message || "মেসেজ সংরক্ষণ ব্যর্থ হয়েছে" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, category, timeSlot, dayNumber, date, message } = body;

    if (!id || !message || !String(message).trim()) {
      return NextResponse.json(
        { error: "আইডি এবং মেসেজ বার্তা আবশ্যক!" },
        { status: 400 },
      );
    }

    const updated = await db.scheduledMessage.update({
      where: { id: String(id) },
      data: {
        category: String(category || "ALL"),
        timeSlot: String(timeSlot || "MORNING"),
        dayNumber:
          dayNumber !== undefined && dayNumber !== null && dayNumber !== ""
            ? Number(dayNumber)
            : null,
        date: date ? String(date) : null,
        message: String(message).trim(),
      },
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error: any) {
    console.error("PUT Scheduled Message Error:", error);
    return NextResponse.json(
      { error: error?.message || "মেসেজ আপডেট করা যায়নি" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "মেসেজ আইডি আবশ্যক!" },
        { status: 400 },
      );
    }

    await db.scheduledMessage.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Scheduled Message Error:", error);
    return NextResponse.json(
      { error: error?.message || "ডিলিট করা যায়নি" },
      { status: 500 },
    );
  }
}
