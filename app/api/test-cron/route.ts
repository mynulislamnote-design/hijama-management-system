import { NextResponse } from "next/server";
import { db } from "@/lib/prisma"; // সরাসরি lib/prisma থেকে db ইমপোর্ট করা হলো
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function GET() {
  try {
    const patients = (await db.patient.findMany()) as any[];

    let sentCount = 0;
    for (const p of patients) {
      if (p.phone) {
        const testMsg = `🧪 *টেস্ট ক্রন জব মেসেজ*\n\nআসসালামু আলাইকুম ${p.name}!\nআপনার সমস্যা (${p.problemCategory || "General"}) অনুযায়ী এটি একটি স্বয়ংক্রিয় টেস্ট ফলো-আপ মেসেজ।`;
        await sendWhatsAppMessage(p.phone, testMsg);
        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `মোট ${sentCount} জন রোগীর কাছে টেস্ট ক্রন মেসেজ পাঠানো হয়েছে!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed" },
      { status: 500 },
    );
  }
}
