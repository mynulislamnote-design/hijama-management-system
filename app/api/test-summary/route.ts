import { NextResponse } from "next/server";
import { sendDailySummaryReport } from "@/lib/cron";

export async function POST() {
  try {
    const reportData = await sendDailySummaryReport();
    return NextResponse.json({
      success: true,
      message: "সামারি রিপোর্ট হোয়াটসঅ্যাপে পাঠানো হয়েছে!",
      data: reportData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to send" },
      { status: 500 },
    );
  }
}
