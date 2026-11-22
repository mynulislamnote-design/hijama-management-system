import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// প্রিজমা মডেল খুঁজে নেওয়ার নিরাপদ ফাংশন
function getScheduledMessageModel() {
  const client = db as any;
  return client.scheduledMessage || client.ScheduledMessage || null;
}

export async function GET() {
  try {
    const model = getScheduledMessageModel();
    if (!model) {
      console.error("ScheduledMessage model not found on db client");
      return NextResponse.json([], { status: 200 });
    }

    const messages = await model.findMany({
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

    const model = getScheduledMessageModel();
    if (!model) {
      return NextResponse.json(
        {
          error: "ডাটাবেজ মডেল লোড হতে পারেনি! দয়া করে সার্ভার রিস্টার্ট করুন।",
        },
        { status: 500 },
      );
    }

    const newMessage = await model.create({
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

    const model = getScheduledMessageModel();
    if (!model) {
      return NextResponse.json(
        { error: "ডাটাবেজ মডেল লোড হতে পারেনি!" },
        { status: 500 },
      );
    }

    await model.delete({
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
