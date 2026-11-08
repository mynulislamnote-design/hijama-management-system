import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const prismaDir = path.join(process.cwd(), "prisma");
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

const dbPath = path.join(prismaDir, "hijama.db");
const sqlite = new Database(dbPath);

// ১. টেবিল তৈরি (Patient, Transaction, Raqi)
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

  CREATE TABLE IF NOT EXISTS "Raqi" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TEXT NOT NULL
  );
`);

// ২. Patient টেবিলে নতুন কলামগুলো সেফলি যুক্ত করা (যদি আগে না থাকে)
try {
  sqlite.exec('ALTER TABLE "Patient" ADD COLUMN "raqiName" TEXT;');
} catch (e) {}
try {
  sqlite.exec('ALTER TABLE "Patient" ADD COLUMN "problemCategory" TEXT;');
} catch (e) {}

// প্রাথমিক কিছু রাক্বী ডাটাবেজে না থাকলে নিজে থেকেই যোগ করা
try {
  const countStmt = sqlite.prepare('SELECT COUNT(*) as count FROM "Raqi"');
  const result: any = countStmt.get();
  if (!result || result.count === 0) {
    const insertRaqi = sqlite.prepare(
      'INSERT INTO "Raqi" ("id", "name", "phone", "createdAt") VALUES (?, ?, ?, ?)',
    );
    insertRaqi.run(
      "rq_1",
      "মাওলানা সাইফুল্লাহ (প্রধান রাক্বী)",
      "01700000000",
      new Date().toISOString(),
    );
    insertRaqi.run(
      "rq_2",
      "মুফতী মাহমুদ হাসান",
      "01800000000",
      new Date().toISOString(),
    );
  }
} catch (e) {}

const dbInstance = {
  raqi: {
    async findMany() {
      try {
        const stmt = sqlite.prepare(
          'SELECT * FROM "Raqi" ORDER BY "createdAt" ASC',
        );
        return stmt.all();
      } catch (e) {
        return [];
      }
    },
    async create(args: { data: { name: string; phone?: string } }) {
      const id = "rq_" + Date.now();
      const createdAt = new Date().toISOString();
      const stmt = sqlite.prepare(
        'INSERT INTO "Raqi" ("id", "name", "phone", "createdAt") VALUES (?, ?, ?, ?)',
      );
      stmt.run(
        id,
        String(args.data.name),
        args.data.phone ? String(args.data.phone) : null,
        createdAt,
      );
      return { id, ...args.data, createdAt };
    },
  },
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
          if (args.where.problemCategory) {
            conditions.push('"problemCategory" = ?');
            params.push(args.where.problemCategory);
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
        raqiName,
        problemCategory,
      } = args.data;
      const id = "pat_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const createdAt = new Date().toISOString();

      const stmt = sqlite.prepare(`
        INSERT INTO "Patient" ("id", "name", "phone", "problem", "serviceType", "feePaid", "sessionDate", "nextFollowUp", "raqiName", "problemCategory", "createdAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        raqiName ? String(raqiName) : "প্রধান রাক্বী",
        problemCategory ? String(problemCategory) : "JINN",
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
