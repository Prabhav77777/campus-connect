import React from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(30,20%,98%)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[hsl(30,40%,95%)] to-[hsl(30,20%,98%)] p-4 sm:p-8 font-sans text-[hsl(220,15%,18%)]">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-[hsl(220,15%,18%)] hover:opacity-80 transition-opacity">
          <span className="text-3xl">🏃</span>
          <span>CampusRunner</span>
        </Link>
        <p className="mt-2 text-sm text-[hsl(220,15%,40%)] font-medium">Share errands, save trips</p>
      </div>
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        {children}
      </div>
    </div>
  );
}
