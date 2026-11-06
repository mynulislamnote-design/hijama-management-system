import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, category, amount, note, date } = body;

    const tx = await db.transaction.create({
      data: {
        type: String(type || "INCOME"),
        category: String(category || "PATIENT_FEE"),
        amount: parseFloat(amount),
        note: note ? String(note) : null,
        date: String(date || new Date().toISOString().split("T")[0]),
      },
    });
    return NextResponse.json({ success: true, tx }, { status: 201 });
  } catch (error: any) {
    console.error("Transaction API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const txs = await db.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(txs || []);
  } catch (error: any) {
    console.error("Transaction Fetch Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
