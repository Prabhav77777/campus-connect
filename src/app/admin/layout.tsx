import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Store, Menu } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if ((session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#fcfaf8] flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white p-4">
        <h1 className="font-semibold text-lg">CampusRunner Admin</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">{session.user.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button type="submit" className="p-1 hover:bg-slate-800 rounded">
              <LogOut size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-slate-900 text-white flex-shrink-0">
        <div className="p-6">
          <h1 className="font-bold text-xl tracking-tight">CampusRunner</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 bg-slate-800 text-white rounded-md transition-colors"
          >
            <Store size={18} />
            <span className="font-medium">Outlets</span>
          </Link>
          {/* Future sections can go here */}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <LogOut size={18} />
              <span className="font-medium">Sign Out</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-800">Dashboard Overview</h2>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
