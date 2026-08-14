import { prisma, ensureDbInitialized } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await ensureDbInitialized();

    const outlets = await prisma.outlet.findMany({
      where: { isClosed: false },
      include: {
        menuItems: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(outlets);
  } catch {
    return NextResponse.json({ error: "Failed to fetch outlets" }, { status: 500 });
  }
}
