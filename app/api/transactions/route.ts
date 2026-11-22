import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    // সরাসরি MySQL ডাটাবেজ লেভেলে তারিখ ও সময় অনুযায়ী সাজানো হবে (কোনো JS ক্র্যাশ হবে না)
    const transactions = await db.transaction.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(transactions || []);
  } catch (error: any) {
    console.error("Transaction Fetch Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, category, amount, note, date } = body;

    if (!amount || !type || !category) {
      return NextResponse.json(
        { error: "ধরন, খাত এবং টাকার পরিমাণ আবশ্যক!" },
        { status: 400 },
      );
    }

    const todayDate = date || new Date().toISOString().split("T")[0];

    const transaction = await db.transaction.create({
      data: {
        type: String(type),
        category: String(category),
        amount: Number(amount),
        note: note ? String(note).trim() : null,
        date: String(todayDate),
      },
    });

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error: any) {
    console.error("Transaction Create Error:", error);
    return NextResponse.json(
      { error: error?.message || "লেনদেন সংরক্ষণ করা যায়নি" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "আইডি আবশ্যক!" }, { status: 400 });
    }

    await db.transaction.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Transaction Delete Error:", error);
    return NextResponse.json(
      { error: error?.message || "ডিলিট করা যায়নি" },
      { status: 500 },
    );
  }
}
