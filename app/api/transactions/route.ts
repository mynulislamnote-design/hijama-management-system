import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, category, amount, note, date } = body;

    const tx = await db.transaction.create({
      data: {
        type: String(type || "INCOME"),
        category: String(category || "OTHER_INCOME"),
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
    const [txs, patients] = await Promise.all([
      db.transaction.findMany({ orderBy: { createdAt: "desc" } }),
      db.patient.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    // রোগীর ফি-গুলোকে স্বয়ংক্রিয়ভাবে আয়ের ট্রানজেকশন হিসেবে লেজারে অন্তর্ভুক্ত করা
    const patientFeeTransactions = (patients || [])
      .filter((p: any) => Number(p.feePaid) > 0)
      .map((p: any) => {
        const serviceName =
          p.serviceType === "RUKYAH"
            ? "শরঈ রুকিয়াহ"
            : p.serviceType === "HIJAMA"
              ? "সুন্নতি হিজামা"
              : "রুকিয়াহ + হিজামা";

        return {
          id: "pf_" + p.id,
          type: "INCOME",
          category: "PATIENT_FEE",
          amount: Number(p.feePaid),
          note: `রোগীর চিকিৎসা ফি: ${p.name} (${serviceName})`,
          date: p.sessionDate,
          createdAt: p.createdAt || p.sessionDate,
          isPatientFee: true,
        };
      });

    // সকল লেনদেন একত্র করে তারিখ অনুযায়ী সাজানো
    const allTransactions = [...(txs || []), ...patientFeeTransactions].sort(
      (a: any, b: any) => {
        return (
          (b.date || "").localeCompare(a.date || "") ||
          (b.createdAt || "").localeCompare(a.createdAt || "")
        );
      },
    );

    return NextResponse.json(allTransactions);
  } catch (error: any) {
    console.error("Transaction Fetch Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
