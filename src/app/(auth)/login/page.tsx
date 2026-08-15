"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Perform a full navigation so session cookie propagates to middleware & server components cleanly
      window.location.href = "/";
    } catch {
      setError("An unexpected error occurred during sign in");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5 p-6 sm:p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Welcome back</h2>
      
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[hsl(0,72%,95%)] text-[hsl(0,72%,40%)] text-sm font-medium border border-[hsl(0,72%,85%)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-[hsl(220,15%,25%)]" htmlFor="email">
            College Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] focus:border-transparent transition-all shadow-sm"
            placeholder="you@college.edu"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1.5 text-[hsl(220,15%,25%)]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] focus:border-transparent transition-all shadow-sm"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,48%)] text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(25,95%,53%)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[hsl(220,15%,40%)]">
        Don't have an account?{" "}
        <Link href="/signup" className="text-[hsl(25,95%,53%)] font-semibold hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
