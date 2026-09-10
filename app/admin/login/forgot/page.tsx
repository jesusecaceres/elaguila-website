"use client";

/**
 * Admin/staff forgot-password entry. Reuses the exact same canonical Supabase recovery primitive
 * customers use (resetPasswordForEmail) — this is deliberately not a second recovery engine, only
 * a different destination (see app/lib/auth/authCallbackSession.ts's recovery-context allowlist).
 */

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { mapAuthErrorMessage } from "@/app/lib/auth/customerPassword";

const NON_ENUMERATING_SUCCESS =
  "If an account exists for that email, check your inbox for a link to reset your password.";

function AdminForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgKind, setMsgKind] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const t = window.setInterval(() => {
      setCooldownSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldownSeconds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setMsgKind(null);

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setMsg("Enter your team email.");
      setMsgKind("error");
      return;
    }
    if (cooldownSeconds > 0 || loading) return;

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
        "/admin/login/reset?recovery=1&lang=en"
      )}`;
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo });

      // Never branch on whether the account exists — Supabase itself never reveals this, and
      // neither does this UI. The only distinct case shown is a rate limit, which is about this
      // client's own request volume, not about the target email.
      if (error?.message?.toLowerCase().includes("rate")) {
        setMsg(mapAuthErrorMessage(error.message, "en"));
        setMsgKind("error");
        setCooldownSeconds(60);
        return;
      }

      setMsg(NON_ENUMERATING_SUCCESS);
      setMsgKind("success");
      setCooldownSeconds(60);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#111111] text-white p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="rounded-2xl border border-black/20 bg-[#1a1a1a] p-6 shadow-xl">
          <h1 className="text-xl font-bold mb-2 text-[#F5F5F5]">Reset your password</h1>
          <p className="text-sm text-[#999] mb-4">
            Enter your Leonix team email and we&apos;ll send you a secure link to set a new
            password.
          </p>

          {msg ? (
            <p
              className={`text-sm mb-3 ${msgKind === "success" ? "text-emerald-400" : "text-red-400"}`}
              role={msgKind === "error" ? "alert" : undefined}
            >
              {msg}
            </p>
          ) : null}

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Team email"
              autoComplete="username"
              required
              disabled={loading}
              className="w-full rounded-xl border border-black/20 bg-[#2a2a2a] px-4 py-3 text-[#F5F5F5] placeholder:text-[#666] outline-none focus:ring-2 focus:ring-[#A98C2A]/50"
            />
            <button
              type="submit"
              disabled={loading || cooldownSeconds > 0}
              className="w-full rounded-xl bg-[#A98C2A] px-4 py-3 font-semibold text-[#111111] hover:bg-[#C9B46A] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/50 disabled:opacity-60"
            >
              {cooldownSeconds > 0
                ? `Try again in ${cooldownSeconds}s`
                : loading
                  ? "Sending…"
                  : "Send reset link"}
            </button>
          </form>
        </div>

        <p className="text-center">
          <Link href="/admin/login" className="text-sm text-[#A98C2A] hover:underline">
            ← Back to Staff / Team login
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function AdminForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <AdminForgotPasswordContent />
    </Suspense>
  );
}
