import cron from "node-cron";
import { prisma } from "./prisma";
import { sendWhatsAppMessage } from "./whatsapp";

// এখানে আপনার ও চেয়ারম্যানের আসল WhatsApp নাম্বার বসিয়ে দিন
export const DIRECTOR_PHONE = "8801736738334"; // <-- আপনার আসল নাম্বার
export const CHAIRMAN_PHONE = "8801722455525"; // <-- চেয়ারম্যানের নাম্বার (বা আপাতত আপনার নাম্বারই দিন)

// ১. প্রতিদিন সকাল ৮:০০ টায় মর্নিং আমল রিমাইন্ডার
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running morning reminder cron job...");
  try {
    const patients = await prisma.patient.findMany();
    const morningMsg = `🌅 *শরঈ রুকইয়াহ ও সুন্নতি হিজামা সেন্টার*\n\nআসসালামু আলাইকুম! আশা করি আল্লাহর রহমতে ভালো আছেন। আজ সকালের মাসনুন দোয়া ও জিকিরসমূহ পড়ার মাধ্যমে দিন শুরু করুন। আল্লাহ আপনাকে পরিপূর্ণ সুস্থতা ও শিফা দান করুন।`;

    for (const p of patients) {
      if (p.phone) {
        await sendWhatsAppMessage(p.phone, morningMsg);
      }
    }
  } catch (err) {
    console.error("Morning cron error:", err);
  }
});

// ২. প্রতিদিন বিকেল ৪:০০ টায় ইভনিং রিমাইন্ডার এবং আগামীকালের সেশনের ফলো-আপ
cron.schedule("0 16 * * *", async () => {
  console.log("⏰ Running evening follow-up cron job...");
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const upcomingPatients = await prisma.patient.findMany({
      where: { nextFollowUp: tomorrowStr },
    });

    for (const p of upcomingPatients) {
      const followUpMsg = `📅 *শরঈ রুকইয়াহ ও সুন্নতি হিজামা সেন্টার*\n\nপ্রিয় ${p.name}, অবগতির জন্য জানাচ্ছি যে আগামীকাল (${tomorrowStr}) আমাদের সেন্টারে আপনার পরবর্তী সেশন/ফলো-আপ রয়েছে। ইনশাআল্লাহ সময়মতো উপস্থিত থাকার অনুরোধ করা হলো।`;
      await sendWhatsAppMessage(p.phone, followUpMsg);
    }
  } catch (err) {
    console.error("Follow-up cron error:", err);
  }
});

// ৩. সারাদিনের সামারি রিপোর্ট তৈরি ও পাঠানোর মূল ফাংশন
export async function sendDailySummaryReport() {
  const todayStr = new Date().toISOString().split("T")[0];

  const todayPatients = await prisma.patient.findMany({
    where: { sessionDate: todayStr },
  });

  const todayTransactions = await prisma.transaction.findMany({
    where: { date: todayStr },
  });

  let totalIncome = todayPatients.reduce(
    (sum: number, p: any) => sum + p.feePaid,
    0,
  );
  todayTransactions
    .filter((t: any) => t.type === "INCOME")
    .forEach((t: any) => (totalIncome += t.amount));

  let totalExpense = todayTransactions
    .filter((t: any) => t.type === "EXPENSE")
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  let netBalance = totalIncome - totalExpense;

  const summaryReport = `📊 *আজকের সারসংক্ষেপ রিপোর্ট*
📅 তারিখ: ${todayStr}

👥 আজকের মোট রোগী: ${todayPatients.length} জন
💵 আজকের মোট আয়: ৳${totalIncome}
📉 আজকের মোট ব্যয়: ৳${totalExpense}
💰 নিট ক্যাশ ব্যালেন্স: ৳${netBalance}

_শরঈ রুকইয়াহ ও সুন্নতি হিজামা ম্যানেজমেন্ট_`;

  if (DIRECTOR_PHONE) await sendWhatsAppMessage(DIRECTOR_PHONE, summaryReport);
  if (CHAIRMAN_PHONE && CHAIRMAN_PHONE !== DIRECTOR_PHONE)
    await sendWhatsAppMessage(CHAIRMAN_PHONE, summaryReport);

  return {
    totalPatients: todayPatients.length,
    totalIncome,
    totalExpense,
    netBalance,
  };
}

// প্রতিদিন রাত ১০:০০ টায় স্বয়ংক্রিয়ভাবে সামারি পাঠানো
cron.schedule("0 22 * * *", async () => {
  console.log("⏰ Running daily summary cron job at 10 PM...");
  try {
    await sendDailySummaryReport();
  } catch (err) {
    console.error("Night summary cron error:", err);
  }
});
