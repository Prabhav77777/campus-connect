import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentNav } from "@/components/StudentNav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session.user as { role?: string }).role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <StudentNav user={session.user} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-24 lg:pb-8 pt-4">
        {children}
      </main>
    </div>
  );
}
