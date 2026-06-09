"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Invalid shared password. Try again.",
  auth: "Invalid email or password.",
  inactive: "Your team account is inactive. Contact an owner admin.",
  not_roster: "This account is not authorized for admin access. Customer logins cannot access /admin.",
};

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const errorKey = searchParams?.get("error") ?? undefined;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] ?? "Could not sign in." : undefined;
  const [showPassword, setShowPassword] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#111111] text-white p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="rounded-2xl border border-black/20 bg-[#1a1a1a] p-6 shadow-xl">
          <h1 className="text-xl font-bold mb-2 text-[#F5F5F5]">Staff / Team login</h1>
          <p className="text-sm text-[#999] mb-4">
            Sign in with your Leonix team email and Supabase Auth password.
          </p>
          {errorMessage ? (
            <p className="text-sm text-red-400 mb-3" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <form action="/admin/login/auth" method="POST" className="flex flex-col gap-3">
            <input
              type="email"
              name="email"
              placeholder="Team email"
              autoComplete="username"
              required
              className="w-full rounded-xl border border-black/20 bg-[#2a2a2a] px-4 py-3 text-[#F5F5F5] placeholder:text-[#666] outline-none focus:ring-2 focus:ring-[#A98C2A]/50"
            />
            <input
              type={showStaffPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-black/20 bg-[#2a2a2a] px-4 py-3 text-[#F5F5F5] placeholder:text-[#666] outline-none focus:ring-2 focus:ring-[#A98C2A]/50"
            />
            <label className="flex items-center gap-2 text-sm text-[#999] cursor-pointer">
              <input
                type="checkbox"
                checked={showStaffPassword}
                onChange={(e) => setShowStaffPassword(e.target.checked)}
                className="rounded border-black/20 bg-[#2a2a2a] text-[#A98C2A] focus:ring-[#A98C2A]/50"
                aria-label="Show password"
              />
              Show password
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#A98C2A] px-4 py-3 font-semibold text-[#111111] hover:bg-[#C9B46A] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/50"
            >
              Log in with team account
            </button>
          </form>
        </div>

        <details className="rounded-2xl border border-black/20 bg-[#1a1a1a] p-6 shadow-xl">
          <summary className="cursor-pointer text-sm font-semibold text-[#C9B46A]">
            Owner bootstrap (shared password)
          </summary>
          <p className="mt-3 text-sm text-[#999] mb-4">
            Legacy owner access when Supabase team accounts are not configured. Sets admin cookie only — bind roster via{" "}
            <code className="text-[#bbb]">ADMIN_OPERATOR_EMAIL</code> on the server.
          </p>
          <form action="/admin/login/submit" method="POST" className="flex flex-col gap-3">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Shared admin password"
              className="w-full rounded-xl border border-black/20 bg-[#2a2a2a] px-4 py-3 text-[#F5F5F5] placeholder:text-[#666] outline-none focus:ring-2 focus:ring-[#A98C2A]/50"
            />
            <label className="flex items-center gap-2 text-sm text-[#999] cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-black/20 bg-[#2a2a2a] text-[#A98C2A] focus:ring-[#A98C2A]/50"
                aria-label="Show shared password"
              />
              Show password
            </label>
            <button
              type="submit"
              className="w-full rounded-xl border border-[#A98C2A]/40 px-4 py-3 font-semibold text-[#C9B46A] hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/50"
            >
              Owner bootstrap login
            </button>
          </form>
        </details>

        <p className="text-center">
          <Link href="/" className="text-sm text-[#A98C2A] hover:underline">
            ← Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}
