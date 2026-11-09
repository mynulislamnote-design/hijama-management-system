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
      raqiName,
      problemCategory,
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
        raqiName: String(raqiName || "প্রধান রাক্বী"),
        problemCategory: String(problemCategory || "JINN"),
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
        const welcomeMsg = `*আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট*

আসসালামু আলাইকুম ${name}!
আজ আমাদের সেন্টারে আপনার সেবা (${serviceNameBn}) সফলভাবে সম্পন্ন হয়েছে।
🩺 চিকিৎসায় ছিলেন: ${raqiName || "প্রধান রাক্বী"}
💰 পরিশোধিত ফি: ৳${feePaid}
📅 তারিখ: ${sessionDate}
${nextFollowUp ? `🔄 পরবর্তী ফলো-আপ: ${nextFollowUp}` : ""}

আল্লাহ তায়ালা আপনাকে পরিপূর্ণ শিফা দান করুন। আমিন!`;

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

// সেশন সম্পন্ন / উপস্থিতি আপডেট করার শতভাগ কার্যকরী PATCH API
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

    const today = sessionDate || new Date().toISOString().split("T")[0];
    const addFee = Number(newFee || 0);

    const sqlite = (db as any).sqlite;
    if (!sqlite) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 },
      );
    }

    // ১. রোগীর পুরানো তথ্য ফেচ করা
    const getStmt = sqlite.prepare('SELECT * FROM "Patient" WHERE "id" = ?');
    const patient: any = getStmt.get(patientId);

    if (!patient) {
      return NextResponse.json({ error: "রোগী পাওয়া যায়নি" }, { status: 404 });
    }

    const updatedTotalFee = Number(patient.feePaid || 0) + addFee;

    // ২. রোগীর ডাটাবেজ আপডেট (ফি, সেশন ডেট, ফলো-আপ ও সমস্যা নোট)
    const updateStmt = sqlite.prepare(`
      UPDATE "Patient" 
      SET "feePaid" = ?, "sessionDate" = ?, "nextFollowUp" = ?, "problem" = ?
      WHERE "id" = ?
    `);
    updateStmt.run(
      updatedTotalFee,
      today,
      nextFollowUp || null,
      String(problemUpdate || patient.problem),
      String(patientId),
    );

    // ৩. নতুন সেশনের ফি লেজারে আয় (INCOME) হিসেবে যোগ করা
    if (addFee > 0) {
      const txId = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const txStmt = sqlite.prepare(`
        INSERT INTO "Transaction" ("id", "type", "category", "amount", "note", "date", "createdAt")
        VALUES (?, 'INCOME', 'PATIENT_FEE', ?, ?, ?, ?)
      `);
      txStmt.run(
        txId,
        addFee,
        `ফলো-আপ সেশন ফি: ${patient.name}`,
        today,
        new Date().toISOString(),
      );
    }

    // ৪. রোগীকে নতুন সেশনের হোয়াটসঅ্যাপ রসিদ পাঠানো
    try {
      if (patient.phone) {
        const updateMsg = `*আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট*

আসসালামু আলাইকুম ${patient.name}!
আলহামদুলিল্লাহ, আজ (${today}) সেন্টারে আপনার সেশনটি সফলভাবে সম্পন্ন হয়েছে।
🩺 চিকিৎসায় ছিলেন: ${patient.raqiName || "প্রধান রাক্বী"}
💰 আজকের সেশন ফি: ৳${addFee} (মোট পরিশোধ: ৳${updatedTotalFee})
${nextFollowUp ? `🔄 আপনার পরবর্তী নির্ধারিত ফলো-আপ: ${nextFollowUp}` : "🔄 নিয়মিত আমল ও দোয়া চালু রাখুন।"}

আল্লাহ আপনাকে সুস্থতা দান করুন। আমিন!`;

        await sendWhatsAppMessage(patient.phone, updateMsg);
        console.log(`✅ Session update WhatsApp sent to ${patient.phone}`);
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
