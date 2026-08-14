import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL || "file:dev.db";
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@campusrunner.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      email: adminEmail,
      passwordHash: adminHash,
      hostel: "H1",
      role: "ADMIN",
    },
  });

  // Seed outlets
  const outlets = [
    { name: "Nescafe-1", hasFixedMenu: true },
    { name: "Nescafe-2", hasFixedMenu: true },
    { name: "Canteen", hasFixedMenu: true },
    { name: "Tapri", hasFixedMenu: true },
    { name: "Student Corner Shop", hasFixedMenu: false },
    { name: "Main Gate", hasFixedMenu: false },
  ];

  for (const outlet of outlets) {
    await prisma.outlet.upsert({
      where: { name: outlet.name },
      update: {},
      create: outlet,
    });
  }

  // Seed menu items
  const nescafe1 = await prisma.outlet.findUnique({ where: { name: "Nescafe-1" } });
  const nescafe2 = await prisma.outlet.findUnique({ where: { name: "Nescafe-2" } });
  const canteen = await prisma.outlet.findUnique({ where: { name: "Canteen" } });
  const tapri = await prisma.outlet.findUnique({ where: { name: "Tapri" } });

  const nescafeMenu = [
    { name: "Coffee", price: 30 },
    { name: "Tea", price: 15 },
    { name: "Maggi", price: 40 },
    { name: "Sandwich", price: 50 },
    { name: "Cold Coffee", price: 60 },
  ];

  const canteenMenu = [
    { name: "Thali", price: 80 },
    { name: "Maggi", price: 35 },
    { name: "Fried Rice", price: 70 },
    { name: "Momos", price: 60 },
    { name: "Cold Drink", price: 30 },
  ];

  const tapriMenu = [
    { name: "Chai", price: 10 },
    { name: "Coffee", price: 20 },
    { name: "Biscuit Pack", price: 15 },
  ];

  // Delete existing menu items to avoid duplicates on re-seed
  await prisma.menuItem.deleteMany({});

  for (const item of nescafeMenu) {
    if (nescafe1) {
      await prisma.menuItem.create({
        data: { ...item, outletId: nescafe1.id },
      });
    }
    if (nescafe2) {
      await prisma.menuItem.create({
        data: { ...item, outletId: nescafe2.id },
      });
    }
  }

  for (const item of canteenMenu) {
    if (canteen) {
      await prisma.menuItem.create({
        data: { ...item, outletId: canteen.id },
      });
    }
  }

  for (const item of tapriMenu) {
    if (tapri) {
      await prisma.menuItem.create({
        data: { ...item, outletId: tapri.id },
      });
    }
  }

  console.log("✅ Seed complete: admin user, outlets, and menu items created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
