import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionUrl = process.env.DATABASE_URL;

  if (connectionUrl) {
    try {
      const url = new URL(connectionUrl);
      const adapter = new PrismaMariaDb({
        host: url.hostname,
        port: Number(url.port) || 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ""),
      });

      return new PrismaClient({
        adapter,
        log: ["error"],
      });
    } catch (e) {
      console.error("Error creating PrismaMariaDb adapter:", e);
    }
  }

  // বিল্ড টাইমে কানেকশন না পেলেও যাতে ক্র্যাশ না করে
  return new PrismaClient({
    log: ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export const prisma = db;
