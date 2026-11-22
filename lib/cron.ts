import cron from "node-cron";
import { db } from "./prisma";
import { sendWhatsAppMessage } from "./whatsapp";

export const DIRECTOR_PHONE = "8801701094516";
export const CHAIRMAN_PHONE = "8801722455525";

// ১. বাংলাদেশ অনুযায়ী আজকের তারিখ (YYYY-MM-DD) বের করার ফাংশন
export function getDhakaDateStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// ২. রোগী এন্ট্রির পর আজ কততম দিন চলছে তা বের করা (১ থেকে ৩০ দিনের হিসাব)
function calculatePatientDay(createdAt: Date): number {
  const dhakaNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
  );
  const created = new Date(createdAt);
  const diffTime = Math.abs(dhakaNow.getTime() - created.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

// ৩. ডিফল্ট ব্যাকআপ আমল (যদি অ্যাডমিন কোনো কাস্টম মেসেজ না লিখে থাকেন)
function getDefaultMorningMessage(
  patientName: string,
  category: string,
): string {
  if (category === "SIHR") {
    return `🪄 *আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট — যাদুর রোগীর সকালের আমল*\n\nআসসালামু আলাইকুম ${patientName}!\nসকালে সূর্যোদয়ের আগে তিন কুল (ইখলাস, ফালাক, নাস) ৩ বার পড়ে নিজের দুই হাতে ফুঁ দিয়ে পুরো শরীর মুছে নিন।\n📖 আজ সূরা ইউনুসের ৮১-৮২ নম্বর আয়াত এবং সূরা বাকারার শেষ দুই আয়াত (২৮৫-২৮৬) মনোযোগ দিয়ে পাঠ করুন বা রুকইয়াহ অডিও শুনুন। রুকইয়াহ করা পানি ও তেলের ব্যবহার চালু রাখুন। আল্লাহ যাদুর বাঁধন জ্বালিয়ে দিন।`;
  }
  if (category === "JINN") {
    return `🛡️ *আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট — জ্বিনের আসরের বিশেষ আমল*\n\nআসসালামু আলাইকুম ${patientName}!\nসকালের হিফাযতের জন্য ৭ বার *আয়াতুল কুরসী* পাঠ করুন।\n🤲 অতঃপর পড়ুন: *"লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারীকা লাহু, লাহুল মুলকু ওয়া লাহুল হামদু, ওয়া হুয়া আলা কুল্লি শাইয়িন ক্বাদীর"* (কমপক্ষে ১০০ বার)। এটি দিনভর শয়তান ও খবিস জ্বিনের বিরুদ্ধে আপনার জন্য দুর্গ স্বরূপ কাজ করবে।`;
  }
  if (category === "AYN") {
    return `👁️ *আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট — বদনজর মুক্তির বিশেষ আমল*\n\nআসসালামু আলাইকুম ${patientName}!\nসকালে ও সন্ধ্যায় পাঠ করুন: *"উঈযুকুম বি-কালিমাতিল্লাহিত তাম্মাহ, মিন কুল্লি শায়তানিওঁ ওয়া হাম্মাহ, ওয়া মিন কুল্লি আইনিন লাম্মাহ"* (৩ বার)।`;
  }
  return `🩸 *আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট — সুস্থতার সুন্নাহ বার্তা*\n\nআসসালামু আলাইকুম ${patientName}!\nসুস্থতায় দিন শুরু করতে সকালে মাসনুন দোয়া পড়ুন: *"আল্লাহুম্মা রব্বান-নাস, আযহিবিল বা'স, ইশফি আনতাশ-শাফী..."*।`;
}

function getDefaultEveningMessage(
  patientName: string,
  category: string,
): string {
  if (category === "SIHR") {
    return `🌙 *আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট — যাদুর রোগীর সন্ধ্যার আমল*\n\nআসসালামু আলাইকুম ${patientName}!\nমাগরিবের পর তিন কুল ৩ বার পড়ে শরীরে ফুঁ দিন। ঘুমানোর পূর্বে আয়াতুল কুরসী পাঠ করুন এবং রুকইয়াহ করা তেল বুকে ও মাথায় মালিশ করুন।`;
  }
  if (category === "JINN") {
    return `🌙 *আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট — জ্বিনের রোগীর সন্ধ্যার হিফাযত*\n\nআসসালামু আলাইকুম ${patientName}!\nমাগরিবের পর পড়ুন: *"বিসমিল্লাহিল্লাযী লা ইয়াদুররু মা'আসমিহী শাইউন ফিল আরদ্বি..."* (৩ বার)। বিছানায় যাওয়ার আগে সূরা বাকারার শেষ দুই আয়াত পাঠ করুন।`;
  }
  return `🌙 *আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট — সন্ধ্যার বার্তা*\n\nআসসালামু আলাইকুম ${patientName}!\nআজকের দিনশেষে মহান আল্লাহর শুকরিয়া আদায় করুন এবং ইস্তেগফার পাঠ করুন।`;
}

// ৪. ডাইনামিক মেসেজ ফেচ করার ফাংশন (ডাটাবেজ চেক করবে)
async function getDynamicMessage(
  patientName: string,
  category: string,
  timeSlot: "MORNING" | "EVENING",
  createdAt: Date,
): Promise<string> {
  const todayStr = getDhakaDateStr();
  const patientDay = calculatePatientDay(createdAt);

  try {
    // ক) প্রথমে দেখবে আজকের নির্দিষ্ট তারিখের (date) জন্য অ্যাডমিন কোনো মেসেজ লিখেছেন কিনা
    let customMsg = await (db as any).scheduledMessage.findFirst({
      where: {
        timeSlot,
        date: todayStr,
        OR: [{ category }, { category: "ALL" }],
      },
    });

    // খ) যদি নির্দিষ্ট তারিখে না থাকে, তবে দেখবে রোগীর কততম দিন (dayNumber) চলছে সে অনুযায়ী মেসেজ আছে কিনা
    if (!customMsg) {
      customMsg = await (db as any).scheduledMessage.findFirst({
        where: {
          timeSlot,
          dayNumber: patientDay,
          OR: [{ category }, { category: "ALL" }],
        },
      });
    }

    // গ) যদি অ্যাডমিনের কাস্টম মেসেজ পাওয়া যায়, রোগীর নাম বসিয়ে রিটার্ন করবে
    if (customMsg && customMsg.message) {
      return customMsg.message.replace(/{name}/g, patientName);
    }
  } catch (error) {
    console.error("Error fetching dynamic message:", error);
  }

  // ঘ) অ্যাডমিনের মেসেজ না থাকলে ডিফল্ট মেসেজ যাবে
  return timeSlot === "MORNING"
    ? getDefaultMorningMessage(patientName, category)
    : getDefaultEveningMessage(patientName, category);
}

// ==========================================
// ১. প্রতিদিন সকাল ৮:০০ টায় (বাংলাদেশ সময়)
// ==========================================
cron.schedule(
  "0 8 * * *",
  async () => {
    console.log(
      "⏰ Running morning azkar & today follow-up cron (Asia/Dhaka)...",
    );
    try {
      const todayStr = getDhakaDateStr();
      const patients = (await db.patient.findMany()) as any[];

      for (const p of patients) {
        if (!p.phone) continue;

        let msg = await getDynamicMessage(
          p.name,
          p.problemCategory || p.problem || "JINN",
          "MORNING",
          p.createdAt,
        );

        if (p.nextFollowUp === todayStr) {
          msg =
            `আসসালামু আলাইকুম ${p.name}!\nআজকে (${todayStr}) সেন্টারে আপনার নির্ধারিত সেশন রয়েছে। চিকিৎসায় থাকবেন: ${p.raqiName || "প্রধান রাক্বী"}। যথাসময়ে উপস্থিত থাকার অনুরোধ করা হলো।\n\n-------------------\n\n` +
            msg;
        }

        await sendWhatsAppMessage(p.phone, msg);
      }
    } catch (err) {
      console.error("Morning cron error:", err);
    }
  },
  { timezone: "Asia/Dhaka" },
);

// ==========================================
// ২. প্রতিদিন বিকেল ৫:০০ টায় (বাংলাদেশ সময়)
// ==========================================
cron.schedule(
  "0 17 * * *",
  async () => {
    console.log(
      "⏰ Running evening azkar & tomorrow follow-up cron (Asia/Dhaka)...",
    );
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(tomorrow);

      const patients = (await db.patient.findMany()) as any[];

      for (const p of patients) {
        if (!p.phone) continue;

        let msg = await getDynamicMessage(
          p.name,
          p.problemCategory || p.problem || "JINN",
          "EVENING",
          p.createdAt,
        );

        if (p.nextFollowUp === tomorrowStr) {
          msg =
            `আসসালামু আলাইকুম ${p.name}!\nআগামীকাল (${tomorrowStr}) আমাদের সেন্টারে আপনার পরবর্তী ফলো-আপ সেশন রয়েছে। চিকিৎসায় থাকবেন: ${p.raqiName || "প্রধান রাক্বী"}। ইনশাআল্লাহ দেখা হবে।\n\n-------------------\n\n` +
            msg;
        }

        await sendWhatsAppMessage(p.phone, msg);
      }
    } catch (err) {
      console.error("Evening cron error:", err);
    }
  },
  { timezone: "Asia/Dhaka" },
);

// ==========================================
// ৩. রাত ১০:০০ টায় ডিরেক্টর ও চেয়ারম্যানের কাছে ডেইলি + সর্বমোট ক্যাশ ব্যালেন্স
// ==========================================
export async function sendDailySummaryReport() {
  const todayStr = getDhakaDateStr();

  // আজকের তথ্য
  const todayPatients = (await db.patient.findMany({
    where: { sessionDate: todayStr },
  })) as any[];

  const todayTransactions = (await db.transaction.findMany({
    where: { date: todayStr },
  })) as any[];

  let todayIncome = todayPatients.reduce((sum, p) => sum + (p.feePaid || 0), 0);
  todayTransactions
    .filter((t) => t.type === "INCOME")
    .forEach((t) => (todayIncome += t.amount));

  let todayExpense = todayTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  let todayNet = todayIncome - todayExpense;

  // সর্বমোট অল-টাইম (Total Lifetime) হিসাব
  const allPatients = (await db.patient.findMany()) as any[];
  const allTransactions = (await db.transaction.findMany()) as any[];

  let lifetimeIncome = allPatients.reduce(
    (sum, p) => sum + (p.feePaid || 0),
    0,
  );
  allTransactions
    .filter((t) => t.type === "INCOME")
    .forEach((t) => (lifetimeIncome += t.amount));

  let lifetimeExpense = allTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  let totalLifetimeCashBalance = lifetimeIncome - lifetimeExpense;

  const summaryReport = `📊 *আজকের সারসংক্ষেপ ও ক্যাশ রিপোর্ট*
📅 তারিখ: ${todayStr}

👥 আজকের রোগী: ${todayPatients.length} জন
💵 আজকের আয়: ৳${todayIncome}
📉 আজকের ব্যয়: ৳${todayExpense}
💰 আজকের ব্যালেন্স: ৳${todayNet}
---------------------------
🏦 *মোট নিট ক্যাশ ব্যালেন্স: ৳${totalLifetimeCashBalance}*
*(শুরু থেকে আজ পর্যন্ত ক্যাশ ড্রয়ারে থাকার কথা)*

_আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট ম্যানেজমেন্ট_`;

  if (DIRECTOR_PHONE) await sendWhatsAppMessage(DIRECTOR_PHONE, summaryReport);
  if (CHAIRMAN_PHONE && CHAIRMAN_PHONE !== DIRECTOR_PHONE)
    await sendWhatsAppMessage(CHAIRMAN_PHONE, summaryReport);

  return {
    totalPatients: todayPatients.length,
    todayIncome,
    todayExpense,
    todayNet,
    totalLifetimeCashBalance,
  };
}

cron.schedule(
  "0 22 * * *",
  async () => {
    try {
      await sendDailySummaryReport();
    } catch (err) {
      console.error("Night summary cron error:", err);
    }
  },
  { timezone: "Asia/Dhaka" },
);
