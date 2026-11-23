import { NextResponse } from "next/server";
import { sendDailySummaryReport } from "@/lib/cron";

export async function POST() {
  try {
    const reportData = await sendDailySummaryReport();
    return NextResponse.json({ success: true, data: reportData });
  } catch (error: any) {
    console.error("Test summary error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed" },
      { status: 500 },
    );
  }
}
