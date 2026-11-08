import cron from "node-cron";
import { db } from "./prisma";
import { sendWhatsAppMessage } from "./whatsapp";

export const DIRECTOR_PHONE = "8801736738334";
export const CHAIRMAN_PHONE = "8801736738334";

// রোগভিত্তিক সকালের বিশেষ মাসনুন আমল
function getMorningAmalMessage(patientName: string, category: string): string {
  if (category === "SIHR") {
    return `🪄 *শরঈ রুকইয়াহ সেন্টার — যাদুর রোগীর সকালের আমল*

আসসালামু আলাইকুম ${patientName}!
সকালে সূর্যোদয়ের আগে তিন কুল (ইখলাস, ফালাক, নাস) ৩ বার পড়ে নিজের দুই হাতে ফুঁ দিয়ে পুরো শরীর মুছে নিন।
📖 আজ সূরা ইউনুসের ৮১-৮২ নম্বর আয়াত এবং সূরা বাকারার শেষ দুই আয়াত (২৮৫-২৮৬) মনোযোগ দিয়ে পাঠ করুন বা রুকইয়াহ অডিও শুনুন। রুকইয়াহ করা পানি ও তেলের ব্যবহার চালু রাখুন। আল্লাহ যাদুর বাঁধন জ্বালিয়ে দিন।`;
  }

  if (category === "JINN") {
    return `🛡️ *শরঈ রুকইয়াহ সেন্টার — জ্বিনের আসরের বিশেষ আমল*

আসসালামু আলাইকুম ${patientName}!
সকালের হিফাযতের জন্য ৭ বার *আয়াতুল কুরসী* পাঠ করুন।
🤲 অতঃপর পড়ুন: *"লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারীকা লাহু, লাহুল মুলকু ওয়া লাহুল হামদু, ওয়া হুয়া আলা কুল্লি শাইয়িন ক্বাদীর"* (কমপক্ষে ১০০ বার)। এটি দিনভর শয়তান ও খবিস জ্বিনের বিরুদ্ধে আপনার জন্য দুর্গ স্বরূপ কাজ করবে।`;
  }

  if (category === "AYN") {
    return `👁️ *শরঈ রুকইয়াহ সেন্টার — বদনজর মুক্তির বিশেষ আমল*

আসসালামু আলাইকুম ${patientName}!
সকালে ও সন্ধ্যায় পাঠ করুন: *"উঈযুকুম বি-কালিমাতিল্লাহিত তাম্মাহ, মিন কুল্লি শায়তানিওঁ ওয়া হাম্মাহ, ওয়া মিন কুল্লি আইনিন লাম্মাহ"* (৩ বার)।`;
  }

  return `🩸 *সুন্নতি হিজামা ও রুকইয়াহ সেন্টার — সুস্থতার সুন্নাহ বার্তা*

আসসালামু আলাইকুম ${patientName}!
সুস্থতায় দিন শুরু করতে সকালে মাসনুন দোয়া পড়ুন: *"আল্লাহুম্মা রব্বান-নাস, আযহিবিল বা'স, ইশফি আনতাশ-শাফী..."*।`;
}

// রোগভিত্তিক সন্ধ্যার বিশেষ মাসনুন আমল
function getEveningAmalMessage(patientName: string, category: string): string {
  if (category === "SIHR") {
    return `🌙 *শরঈ রুকইয়াহ সেন্টার — যাদুর রোগীর সন্ধ্যার আমল*
মাগরিবের পর তিন কুল ৩ বার পড়ে শরীরে ফুঁ দিন। ঘুমানোর পূর্বে আয়াতুল কুরসী পাঠ করুন এবং রুকইয়াহ করা তেল বুকে ও মাথায় মালিশ করুন।`;
  }
  if (category === "JINN") {
    return `🌙 *শরঈ রুকইয়াহ সেন্টার — জ্বিনের রোগীর সন্ধ্যার হিফাযত*
মাগরিবের পর পড়ুন: *"বিসমিল্লাহিল্লাযী লা ইয়াদুররু মা'আসমিহী শাইউন ফিল আরদ্বি..."* (৩ বার)। বিছানায় যাওয়ার আগে সূরা বাকারার শেষ দুই আয়াত পাঠ করুন।`;
  }
  return `🌙 *সুন্নতি হিজামা ও রুকইয়াহ সেন্টার — সন্ধ্যার বার্তা*
আজকের দিনশেষে মহান আল্লাহর শুকরিয়া আদায় করুন এবং ইস্তেগফার পাঠ করুন।`;
}

// ১. প্রতিদিন সকাল ৮:০০ টায়: আজকের ফলো-আপ রিমাইন্ডার + সকালের আমল
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running morning azkar & today follow-up cron...");
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const patients = (await db.patient.findMany()) as any[];

    for (const p of patients) {
      if (!p.phone) continue;

      let msg = getMorningAmalMessage(p.name, p.problemCategory || "JINN");

      // যদি আজকের দিনে রোগীর ফলো-আপ থাকে, তবে সেশনের তাগিদ যোগ হবে
      if (p.nextFollowUp === todayStr) {
        msg =
          `📅 *আজকের সেশন রিমাইন্ডার*\n\nআসসালামু আলাইকুম ${p.name}!\nআজকে (${todayStr}) সেন্টারে আপনার নির্ধারিত সেশন রয়েছে। চিকিৎসায় থাকবেন: ${p.raqiName || "প্রধান রাক্বী"}। যথাসময়ে উপস্থিত থাকার অনুরোধ করা হলো।\n\n-------------------\n\n` +
          msg;
      }

      await sendWhatsAppMessage(p.phone, msg);
    }
  } catch (err) {
    console.error("Morning cron error:", err);
  }
});

// ২. প্রতিদিন বিকেল ৪:৩০ মিনিটে: আগামীকালের ফলো-আপ রিমাইন্ডার + সন্ধ্যার আমল
cron.schedule("30 16 * * *", async () => {
  console.log("⏰ Running evening azkar & tomorrow follow-up cron...");
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const patients = (await db.patient.findMany()) as any[];

    for (const p of patients) {
      if (!p.phone) continue;

      let msg = getEveningAmalMessage(p.name, p.problemCategory || "JINN");

      // যদি আগামীকালের দিনে রোগীর ফলো-আপ থাকে, তবে আগামীকালের রিমাইন্ডার যোগ হবে
      if (p.nextFollowUp === tomorrowStr) {
        msg =
          `📅 *আগামীকালের সেশন রিমাইন্ডার*\n\nআসসালামু আলাইকুম ${p.name}!\nআগামীকাল (${tomorrowStr}) আমাদের সেন্টারে আপনার পরবর্তী ফলো-আপ সেশন রয়েছে। চিকিৎসায় থাকবেন: ${p.raqiName || "প্রধান রাক্বী"}। ইনশাআল্লাহ দেখা হবে।\n\n-------------------\n\n` +
          msg;
      }

      await sendWhatsAppMessage(p.phone, msg);
    }
  } catch (err) {
    console.error("Evening cron error:", err);
  }
});

// ৩. রাত ১০:০০ টায় ডিরেক্টরের কাছে ডেইলি সামারি
export async function sendDailySummaryReport() {
  const todayStr = new Date().toISOString().split("T")[0];
  const todayPatients = (await db.patient.findMany({
    where: { sessionDate: todayStr },
  })) as any[];
  const todayTransactions = (await db.transaction.findMany({
    where: { date: todayStr },
  })) as any[];

  let totalIncome = todayPatients.reduce((sum, p) => sum + p.feePaid, 0);
  todayTransactions
    .filter((t) => t.type === "INCOME")
    .forEach((t) => (totalIncome += t.amount));

  let totalExpense = todayTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
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

cron.schedule("0 22 * * *", async () => {
  try {
    await sendDailySummaryReport();
  } catch (err) {
    console.error("Night summary cron error:", err);
  }
});
