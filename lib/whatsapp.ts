import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";
import path from "path";

const globalForWhatsApp = globalThis as unknown as {
  waSocket?: WASocket;
  isConnecting?: boolean;
};

export function formatToWhatsAppJid(phone: any): string {
  if (!phone) return "";

  let clean = "";
  try {
    const stringPhone = String(phone);
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    clean = stringPhone;
    banglaDigits.forEach((digit, index) => {
      clean = clean.split(digit).join(index.toString());
    });
    clean = clean.replace(/\D/g, "");
  } catch (e) {
    return "";
  }

  if (!clean) return "";

  if (clean.startsWith("01") && clean.length === 11) {
    clean = "88" + clean;
  } else if (clean.startsWith("1") && clean.length === 10) {
    clean = "880" + clean;
  }

  return `${clean}@s.whatsapp.net`;
}

export async function connectToWhatsApp(): Promise<WASocket | null> {
  if (globalForWhatsApp.waSocket) {
    return globalForWhatsApp.waSocket;
  }

  if (globalForWhatsApp.isConnecting) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return globalForWhatsApp.waSocket || null;
  }

  globalForWhatsApp.isConnecting = true;

  try {
    const sessionDir = path.join(process.cwd(), "auth_info_baileys");
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      browser: ["Hijama Management", "Chrome", "1.0.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        console.log(
          "\n📱 WhatsApp QR Code generated! Scan it with your phone:\n",
        );
        qrcode.generate(qr, { small: true });
      }
      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as any)?.output?.statusCode !==
          DisconnectReason.loggedOut;
        globalForWhatsApp.waSocket = undefined;
        globalForWhatsApp.isConnecting = false;
        if (shouldReconnect) {
          setTimeout(() => connectToWhatsApp(), 5000);
        }
      } else if (connection === "open") {
        console.log("✅ WhatsApp Connected Successfully for Hijama Center!");
        globalForWhatsApp.waSocket = sock;
        globalForWhatsApp.isConnecting = false;
      }
    });

    globalForWhatsApp.waSocket = sock;
    return sock;
  } catch (error) {
    console.error("WhatsApp connection error:", error);
    globalForWhatsApp.isConnecting = false;
    return null;
  }
}

export async function sendWhatsAppMessage(
  phone: string,
  text: string,
): Promise<boolean> {
  try {
    if (!phone || !text) return false;
    const jid = formatToWhatsAppJid(phone);

    if (!jid || !jid.includes("@s.whatsapp.net")) {
      console.error(`❌ Invalid JID for phone: ${phone}`);
      return false;
    }

    // সকেট সম্পূর্ণ রেডি না থাকলে সর্বোচ্চ ৫ সেকেন্ড অপেক্ষা করবে
    let retries = 0;
    while (
      (!globalForWhatsApp.waSocket || globalForWhatsApp.isConnecting) &&
      retries < 5
    ) {
      console.log("⏳ Waiting for WhatsApp socket to be ready...");
      await new Promise((res) => setTimeout(res, 1000));
      retries++;
    }

    let sock = globalForWhatsApp.waSocket;
    if (!sock) {
      sock = await connectToWhatsApp();
    }

    if (!sock) {
      console.error("❌ WhatsApp socket is not ready yet.");
      return false;
    }

    await sock.sendMessage(jid, { text });
    console.log(`✅ WhatsApp message sent successfully to: ${jid}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp message to ${phone}:`, error);
    return false;
  }
}
