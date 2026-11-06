import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ডাটাবেজ ডিরেক্টরি নিশ্চিত করা
const prismaDir = path.join(process.cwd(), "prisma");
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

const dbPath = path.join(prismaDir, "hijama.db");
const sqlite = new Database(dbPath);

// টেবিল তৈরি (Transaction সংরক্ষিত শব্দ হওয়ায় `Transaction` এভাবে লেখা আবশ্যক)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS "Patient" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "problem" TEXT,
    "serviceType" TEXT NOT NULL,
    "feePaid" REAL NOT NULL,
    "sessionDate" TEXT NOT NULL,
    "nextFollowUp" TEXT,
    "createdAt" TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "note" TEXT,
    "date" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
  );
`);

// কুয়েরি অবজেক্ট
const dbInstance = {
  patient: {
    async findMany(args?: { where?: any; orderBy?: { createdAt?: string } }) {
      try {
        let query = 'SELECT * FROM "Patient"';
        const params: any[] = [];

        if (args?.where) {
          const conditions: string[] = [];
          if (args.where.sessionDate) {
            conditions.push('"sessionDate" = ?');
            params.push(args.where.sessionDate);
          }
          if (args.where.nextFollowUp) {
            conditions.push('"nextFollowUp" = ?');
            params.push(args.where.nextFollowUp);
          }
          if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
          }
        }

        if (args?.orderBy?.createdAt === "desc") {
          query += ' ORDER BY "createdAt" DESC';
        }
        const stmt = sqlite.prepare(query);
        return stmt.all(...params);
      } catch (e) {
        console.error("FindMany Patient Error:", e);
        return [];
      }
    },
    async create(args: { data: any }) {
      const {
        name,
        phone,
        problem,
        serviceType,
        feePaid,
        sessionDate,
        nextFollowUp,
      } = args.data;
      const id = "pat_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const createdAt = new Date().toISOString();

      const stmt = sqlite.prepare(`
        INSERT INTO "Patient" ("id", "name", "phone", "problem", "serviceType", "feePaid", "sessionDate", "nextFollowUp", "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        String(id),
        String(name),
        String(phone),
        String(problem || "সাধারণ সমস্যা"),
        String(serviceType || "RUKYAH"),
        Number(feePaid),
        String(sessionDate),
        nextFollowUp ? String(nextFollowUp) : null,
        String(createdAt),
      );
      return { id, ...args.data, createdAt };
    },
  },
  transaction: {
    async findMany(args?: { where?: any; orderBy?: { createdAt?: string } }) {
      try {
        let query = 'SELECT * FROM "Transaction"';
        const params: any[] = [];

        if (args?.where) {
          const conditions: string[] = [];
          if (args.where.date) {
            conditions.push('"date" = ?');
            params.push(args.where.date);
          }
          if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
          }
        }

        if (args?.orderBy?.createdAt === "desc") {
          query += ' ORDER BY "createdAt" DESC';
        }
        const stmt = sqlite.prepare(query);
        return stmt.all(...params);
      } catch (e) {
        console.error("FindMany Transaction Error:", e);
        return [];
      }
    },
    async create(args: { data: any }) {
      const { type, category, amount, note, date } = args.data;
      const id = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const createdAt = new Date().toISOString();

      const stmt = sqlite.prepare(`
        INSERT INTO "Transaction" ("id", "type", "category", "amount", "note", "date", "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        String(id),
        String(type),
        String(category),
        Number(amount),
        note ? String(note) : null,
        String(date),
        String(createdAt),
      );
      return { id, ...args.data, createdAt };
    },
  },
};

export const db = dbInstance;
export const prisma = dbInstance;
