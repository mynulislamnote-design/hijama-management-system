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

    const todayDate = sessionDate || new Date().toISOString().split("T")[0];

    // ১. পেশেন্ট তৈরি
    const patient = await db.patient.create({
      data: {
        name: String(name),
        phone: String(phone),
        problem: String(problem || "সাধারণ সমস্যা"),
        serviceType: String(serviceType || "RUKYAH"),
        feePaid: parseFloat(feePaid),
        sessionDate: String(todayDate),
        nextFollowUp: nextFollowUp ? String(nextFollowUp) : null,
        raqiName: String(raqiName || "প্রধান রাক্বী"),
        problemCategory: String(problemCategory || "JINN"),
      },
    });

    // ২. লেজারে আয় (Transaction) হিসেবে যুক্ত করা
    try {
      await db.transaction.create({
        data: {
          type: "INCOME",
          category: "PATIENT_FEE",
          amount: parseFloat(feePaid),
          note: `প্রাথমিক রেজিস্ট্রেশন ও ফি: ${name}`,
          date: todayDate,
        },
      });
    } catch (txErr) {
      console.error("Auto Transaction Create Warning:", txErr);
    }

    // ৩. ক্যাটাগরি ভিত্তিক স্বাগতম মেসেজ তৈরি
    try {
      const phoneNumberStr = String(phone || "");
      if (phoneNumberStr) {
        const serviceNameBn =
          serviceType === "RUKYAH"
            ? "শরঈ রুকিয়াহ"
            : serviceType === "HIJAMA"
              ? "সুন্নতি হিজামা"
              : "রুকিয়াহ ও হিজামা উভয় সেবা";

        let adviceText = "";
        if (problemCategory === "SIHR") {
          adviceText =
            "\n\n💡 *প্রাথমিক পরামর্শ:* রুকইয়াহ তেল ও পানি ব্যবহার শুরু করুন এবং প্রতিদিন সূরা বাকারার শেষ দুই আয়াত পাঠ করুন।";
        } else if (problemCategory === "JINN") {
          adviceText =
            "\n\n💡 *হিফাযতের পরামর্শ:* পাঁচ ওয়াক্ত সালাত শেষে এবং শোয়ার আগে আয়াতুল কুরসী তিলাওয়াত করুন।";
        } else if (problemCategory === "AYN") {
          adviceText =
            "\n\n💡 *বদনজর মুক্তির পরামর্শ:* সকাল-সন্ধ্যায় তিন কুল পড়ে ফুঁ দিন এবং মাসনুন দোয়া পাঠ চালু রাখুন।";
        }

        const welcomeMsg = `*আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট*

আসসালামু আলাইকুম ${name}!
আজ আমাদের সেন্টারে আপনার সেবা (${serviceNameBn}) সফলভাবে সম্পন্ন হয়েছে।
🩺 চিকিৎসায় ছিলেন: ${raqiName || "প্রধান রাক্বী"}
💰 পরিশোধিত ফি: ৳${feePaid}
📅 তারিখ: ${todayDate}
${nextFollowUp ? `🔄 পরবর্তী ফলো-আপ: ${nextFollowUp}` : ""}${adviceText}

আল্লাহ তায়ালা আপনাকে পরিপূর্ণ শেফা দান করুন। আমিন!`;

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

// সেশন সম্পন্ন / উপস্থিতি আপডেট (সম্পূর্ণ Prisma ও MySQL উপযোগী)
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

    const existingPatient = await db.patient.findUnique({
      where: { id: patientId },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "রোগী পাওয়া যায়নি" }, { status: 404 });
    }

    const updatedTotalFee = Number(existingPatient.feePaid || 0) + addFee;

    // ১. পেশেন্ট আপডেট
    const updatedPatient = await db.patient.update({
      where: { id: patientId },
      data: {
        feePaid: updatedTotalFee,
        sessionDate: today,
        nextFollowUp: nextFollowUp || null,
        problem: String(problemUpdate || existingPatient.problem),
      },
    });

    // ২. নতুন ফি ট্রানজেকশনে যোগ করা
    if (addFee > 0) {
      await db.transaction.create({
        data: {
          type: "INCOME",
          category: "PATIENT_FEE",
          amount: addFee,
          note: `ফলো-আপ সেশন ফি: ${existingPatient.name}`,
          date: today,
        },
      });
    }

    // ৩. হোয়াটসঅ্যাপ আপডেট মেসেজ পাঠানো
    try {
      if (existingPatient.phone) {
        const updateMsg = `*আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট*

আসসালামু আলাইকুম ${existingPatient.name}!
আলহামদুলিল্লাহ, আজ (${today}) সেন্টারে আপনার সেশনটি সম্পন্ন হয়েছে।
🩺 চিকিৎসায় ছিলেন: ${existingPatient.raqiName || "প্রধান রাক্বী"}
💰 আজকের সেশন ফি: ৳${addFee} (মোট পরিশোধ: ৳${updatedTotalFee})
${nextFollowUp ? `🔄 আপনার পরবর্তী নির্ধারিত ফলো-আপ: ${nextFollowUp}` : "🔄 নিয়মিত আমল ও দোয়া চালু রাখুন।"}

আল্লাহ আপনাকে শেফা দান করুন। আমিন!`;

        await sendWhatsAppMessage(existingPatient.phone, updateMsg);
      }
    } catch (waErr) {
      console.error("WhatsApp Session Receipt Error:", waErr);
    }

    return NextResponse.json({
      success: true,
      message: "সেশন সফলভাবে সম্পন্ন ও আপডেট হয়েছে!",
      patient: updatedPatient,
    });
  } catch (error: any) {
    console.error("Patient Session Update Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update session" },
      { status: 500 },
    );
  }
}

// ভুল এন্ট্রি হওয়া রোগী মুছে ফেলার DELETE API
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "রোগীর আইডি আবশ্যক" }, { status: 400 });
    }

    await db.patient.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "রোগী সফলভাবে মুছে ফেলা হয়েছে",
    });
  } catch (error: any) {
    console.error("Patient Delete Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete patient" },
      { status: 500 },
    );
  }
}
