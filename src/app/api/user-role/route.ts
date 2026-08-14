import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  // Retrieve user role from session
  return NextResponse.json({ role: (session.user as any).role || "STUDENT" });
}
