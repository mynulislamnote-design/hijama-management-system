import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      problem,
      serviceType,
      feePaid,
      sessionDate,
      nextFollowUp,
    } = body;

    if (!name || !phone || !feePaid) {
      return NextResponse.json(
        { error: "নাম, ফোন এবং ফি আবশ্যক!" },
        { status: 400 },
      );
    }

    const patient = await db.patient.create({
      data: {
        name: String(name),
        phone: String(phone),
        problem: String(problem || "সাধারণ সমস্যা"),
        serviceType: String(serviceType || "RUKYAH"),
        feePaid: parseFloat(feePaid),
        sessionDate: String(
          sessionDate || new Date().toISOString().split("T")[0],
        ),
        nextFollowUp: nextFollowUp ? String(nextFollowUp) : null,
      },
    });

    try {
      const phoneNumberStr = String(phone || "");
      if (phoneNumberStr) {
        const serviceNameBn =
          serviceType === "RUKYAH"
            ? "শরঈ রুকিয়াহ"
            : serviceType === "HIJAMA"
              ? "সুন্নতি হিজামা"
              : "রুকিয়াহ ও হিজামা উভয় সার্ভিস";
        const welcomeMsg = `🏥 *শরঈ রুকইয়াহ ও সুন্নতি হিজামা সেন্টার*

আসসালামু আলাইকুম ${name} সাহেব/সেবাগ্রহীতা,
আজ আমাদের সেন্টারে আপনার সেবা (${serviceNameBn}) সফলভাবে সম্পন্ন হয়েছে।
💰 ফি প্রদান করেছেন: ৳${feePaid}
📅 তারিখ: ${sessionDate}
${nextFollowUp ? `🔄 পরবর্তী ফলো-আপ: ${nextFollowUp}` : ""}

আল্লাহ আপনাকে পরিপূর্ণ শিফা দান করুন। আমিন!`;

        await sendWhatsAppMessage(phoneNumberStr, welcomeMsg);
      }
    } catch (waErr) {
      console.error("WhatsApp warning:", waErr);
    }

    return NextResponse.json({ success: true, patient }, { status: 201 });
  } catch (error: any) {
    console.error("Patient API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const patients = await db.patient.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(patients || []);
  } catch (error: any) {
    console.error("Patient Fetch Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// নতুন: ১-ক্লিক উপস্থিতি ও নতুন সেশন আপডেট করার PATCH API
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { patientId, newFee, nextFollowUp, problemUpdate, sessionDate } =
      body;

    if (!patientId) {
      return NextResponse.json(
        { error: "রোগীর আইডি আবশ্যক!" },
        { status: 400 },
      );
    }

    // রোগীর তথ্য ডাটাবেজে আপডেট
    const today = sessionDate || new Date().toISOString().split("T")[0];

    // better-sqlite3 এ সরাসরি আপডেট কোয়েরি
    const stmt = (db as any).sqlite
      ? (db as any).sqlite.prepare(`
          UPDATE "Patient" 
          SET "feePaid" = "feePaid" + ?, "sessionDate" = ?, "nextFollowUp" = ?, "problem" = ?
          WHERE "id" = ?
        `)
      : null;

    if (stmt) {
      stmt.run(
        Number(newFee || 0),
        today,
        nextFollowUp || null,
        String(problemUpdate || ""),
        String(patientId),
      );
    }

    // রোগীকে নতুন সেশনের হোয়াটসঅ্যাপ রসিদ পাঠানো
    try {
      const patientStmt = (db as any).sqlite?.prepare(
        'SELECT * FROM "Patient" WHERE "id" = ?',
      );
      const patient = patientStmt ? patientStmt.get(patientId) : null;

      if (patient && patient.phone) {
        const updateMsg = `🏥 *শরঈ রুকইয়াহ ও সুন্নতি হিজামা সেন্টার*

আসসালামু আলাইকুম ${patient.name}!
আলহামদুলিল্লাহ, আজ (${today}) সেন্টারে আপনার সেশনটি সফলভাবে সম্পন্ন হয়েছে।
💰 আজকের সেশন ফি: ৳${newFee}
${nextFollowUp ? `🔄 আপনার পরবর্তী নির্ধারিত ফলো-আপ: ${nextFollowUp}` : "🔄 নিয়মিত আমল ও দোয়া চালু রাখুন।"}

আল্লাহ আপনাকে সুস্থতা দান করুন। আমিন!`;

        await sendWhatsAppMessage(patient.phone, updateMsg);
      }
    } catch (waErr) {
      console.error("WhatsApp Session Receipt Error:", waErr);
    }

    return NextResponse.json({
      success: true,
      message: "সেশন সফলভাবে সম্পন্ন ও আপডেট হয়েছে!",
    });
  } catch (error: any) {
    console.error("Patient Session Update Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update session" },
      { status: 500 },
    );
  }
}
