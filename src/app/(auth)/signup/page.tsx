"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/actions/auth";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    hostel: "H1",
    room: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const HOSTELS = ["H1", "H2", "Old Boys Hostel", "Girls Hostel", "Guest House"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const res = await signUp({
        name: formData.name.trim(),
        email: cleanEmail,
        password: formData.password,
        hostel: formData.hostel,
        roomNumber: formData.room.trim(),
      });

      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
        return;
      }

      // Automatically sign in
      const signInRes = await signIn("credentials", {
        email: cleanEmail,
        password: formData.password,
        redirect: false,
      });

      if (signInRes?.error) {
        window.location.href = "/login";
        return;
      }

      window.location.href = "/";
    } catch {
      setError("An unexpected error occurred during signup");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5 p-6 sm:p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Create your account</h2>
      
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[hsl(0,72%,95%)] text-[hsl(0,72%,40%)] text-sm font-medium border border-[hsl(0,72%,85%)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-[hsl(220,15%,25%)]" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] focus:border-transparent transition-all shadow-sm"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[hsl(220,15%,25%)]" htmlFor="email">
            College Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] focus:border-transparent transition-all shadow-sm"
            placeholder="you@college.edu"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(220,15%,25%)]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] focus:border-transparent transition-all shadow-sm"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(220,15%,25%)]" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] focus:border-transparent transition-all shadow-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(220,15%,25%)]" htmlFor="hostel">
              Hostel
            </label>
            <select
              id="hostel"
              required
              value={formData.hostel}
              onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] focus:border-transparent transition-all shadow-sm bg-white"
            >
              {HOSTELS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(220,15%,25%)]" htmlFor="room">
              Room Number <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              id="room"
              type="text"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] focus:border-transparent transition-all shadow-sm"
              placeholder="e.g. 101"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,48%)] text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(25,95%,53%)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[hsl(220,15%,40%)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[hsl(25,95%,53%)] font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
