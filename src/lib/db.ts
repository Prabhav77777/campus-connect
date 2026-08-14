import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  initialized: boolean | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || "file:dev.db";

  // Standard PostgreSQL (Vercel Postgres, Supabase, Neon)
  if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
    return new PrismaClient();
  }

  // libSQL / SQLite
  const url = process.env.VERCEL && dbUrl.startsWith("file:") ? "file:/tmp/dev.db" : dbUrl;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function ensureDbInitialized() {
  if (globalForPrisma.initialized) return;

  try {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || "";
    const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

    if (isPostgres) {
      // Create tables for Postgres if needed
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "passwordHash" TEXT NOT NULL,
          "hostel" TEXT NOT NULL,
          "roomNumber" TEXT,
          "trustScore" INTEGER NOT NULL DEFAULT 0,
          "role" TEXT NOT NULL DEFAULT 'STUDENT',
          "redFlagged" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Outlet" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL UNIQUE,
          "hasFixedMenu" BOOLEAN NOT NULL DEFAULT true,
          "isClosed" BOOLEAN NOT NULL DEFAULT false
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MenuItem" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "outletId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "price" DOUBLE PRECISION NOT NULL,
          CONSTRAINT "MenuItem_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Trip" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "outletId" TEXT NOT NULL,
          "leavingTime" TIMESTAMP(3) NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "capacity" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "Trip_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Request" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "outletId" TEXT NOT NULL,
          "itemName" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL DEFAULT 1,
          "priceEstimate" DOUBLE PRECISION NOT NULL,
          "deliverToHostel" TEXT NOT NULL,
          "deliverToRoom" TEXT,
          "note" TEXT,
          "status" TEXT NOT NULL DEFAULT 'OPEN',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "Request_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Match" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "tripId" TEXT NOT NULL,
          "requestId" TEXT NOT NULL,
          "otp" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Match_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "Match_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "link" TEXT,
          "read" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `);
    } else {
      // Create tables for SQLite if needed
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "passwordHash" TEXT NOT NULL,
          "hostel" TEXT NOT NULL,
          "roomNumber" TEXT,
          "trustScore" INTEGER NOT NULL DEFAULT 0,
          "role" TEXT NOT NULL DEFAULT 'STUDENT',
          "redFlagged" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Outlet" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL UNIQUE,
          "hasFixedMenu" BOOLEAN NOT NULL DEFAULT true,
          "isClosed" BOOLEAN NOT NULL DEFAULT false
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MenuItem" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "outletId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "price" REAL NOT NULL,
          FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Trip" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "outletId" TEXT NOT NULL,
          "leavingTime" DATETIME NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "capacity" INTEGER,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User" ("id"),
          FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Request" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "outletId" TEXT NOT NULL,
          "itemName" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL DEFAULT 1,
          "priceEstimate" REAL NOT NULL,
          "deliverToHostel" TEXT NOT NULL,
          "deliverToRoom" TEXT,
          "note" TEXT,
          "status" TEXT NOT NULL DEFAULT 'OPEN',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User" ("id"),
          FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Match" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "tripId" TEXT NOT NULL,
          "requestId" TEXT NOT NULL,
          "otp" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("tripId") REFERENCES "Trip" ("id"),
          FOREIGN KEY ("requestId") REFERENCES "Request" ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "link" TEXT,
          "read" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User" ("id")
        );
      `);
    }

    // Seed initial admin user if not exists
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@campusrunner.com").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const adminHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          name: "Admin",
          email: adminEmail,
          passwordHash: adminHash,
          hostel: "H1",
          role: "ADMIN",
        },
      });
    }

    // Seed outlets if empty
    const outletCount = await prisma.outlet.count();
    if (outletCount === 0) {
      const nescafe1 = await prisma.outlet.create({ data: { name: "Nescafe-1", hasFixedMenu: true } });
      const nescafe2 = await prisma.outlet.create({ data: { name: "Nescafe-2", hasFixedMenu: true } });
      const canteen = await prisma.outlet.create({ data: { name: "Canteen", hasFixedMenu: true } });
      const tapri = await prisma.outlet.create({ data: { name: "Tapri", hasFixedMenu: true } });
      await prisma.outlet.create({ data: { name: "Student Corner Shop", hasFixedMenu: false } });
      await prisma.outlet.create({ data: { name: "Main Gate", hasFixedMenu: false } });

      const nescafeItems = [
        { name: "Coffee", price: 30 },
        { name: "Tea", price: 15 },
        { name: "Maggi", price: 40 },
        { name: "Sandwich", price: 50 },
        { name: "Cold Coffee", price: 60 },
      ];
      for (const item of nescafeItems) {
        await prisma.menuItem.create({ data: { ...item, outletId: nescafe1.id } });
        await prisma.menuItem.create({ data: { ...item, outletId: nescafe2.id } });
      }

      const canteenItems = [
        { name: "Thali", price: 80 },
        { name: "Maggi", price: 35 },
        { name: "Fried Rice", price: 70 },
        { name: "Momos", price: 60 },
        { name: "Cold Drink", price: 30 },
      ];
      for (const item of canteenItems) {
        await prisma.menuItem.create({ data: { ...item, outletId: canteen.id } });
      }

      const tapriItems = [
        { name: "Chai", price: 10 },
        { name: "Coffee", price: 20 },
        { name: "Biscuit Pack", price: 15 },
      ];
      for (const item of tapriItems) {
        await prisma.menuItem.create({ data: { ...item, outletId: tapri.id } });
      }
    }

    globalForPrisma.initialized = true;
  } catch (error) {
    console.error("Database init error:", error);
  }
}
