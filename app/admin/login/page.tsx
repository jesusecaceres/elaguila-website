"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") ?? undefined;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#111111] text-white p-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/20 bg-[#1a1a1a] p-6 shadow-xl">
        <h1 className="text-xl font-bold mb-2 text-[#F5F5F5]">Admin</h1>
        <p className="text-sm text-[#999] mb-4">Enter the shared password to continue.</p>
        {error === "1" ? (
          <p className="text-sm text-red-400 mb-3" role="alert">
            Invalid password. Try again.
          </p>
        ) : null}
        <form action="/admin/login/submit" method="POST" className="flex flex-col gap-3">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            autoFocus
            className="w-full rounded-xl border border-black/20 bg-[#2a2a2a] px-4 py-3 text-[#F5F5F5] placeholder:text-[#666] outline-none focus:ring-2 focus:ring-[#A98C2A]/50"
          />
          <label className="flex items-center gap-2 text-sm text-[#999] cursor-pointer">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="rounded border-black/20 bg-[#2a2a2a] text-[#A98C2A] focus:ring-[#A98C2A]/50"
              aria-label="Show password"
            />
            Show password
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-[#A98C2A] px-4 py-3 font-semibold text-[#111111] hover:bg-[#C9B46A] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/50"
          >
            Log in
          </button>
        </form>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-[#A98C2A] hover:underline">
            ← Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}
