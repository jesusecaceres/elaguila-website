"use client";

/**
 * Admin-appropriate password reset destination. Lands here only via /auth/callback's hardcoded
 * recovery-context allowlist (see app/lib/auth/authCallbackSession.ts) — never reachable with an
 * arbitrary redirect. Reuses the exact same secure primitives the customer recovery destination
 * uses (evaluatePassword, PasswordInputField, PasswordStrengthMeter, supabase.auth.updateUser) —
 * this is deliberately not a second password-reset implementation.
 */

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { PasswordInputField } from "@/app/(site)/components/auth/PasswordInputField";
import { PasswordStrengthMeter } from "@/app/(site)/components/auth/PasswordStrengthMeter";
import { evaluatePassword, mapAuthErrorMessage } from "@/app/lib/auth/customerPassword";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

type PageStatus = "checking" | "ready" | "invalid" | "success";

function AdminResetPasswordContent() {
  const [status, setStatus] = useState<PageStatus>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const passwordEval = useMemo(
    () => evaluatePassword(newPassword, email ?? ""),
    [newPassword, email]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        if (!data.user) {
          setStatus("invalid");
          return;
        }
        setEmail(data.user.email ?? null);
        setStatus("ready");
      } catch {
        if (mounted) setStatus("invalid");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit =
    status === "ready" &&
    passwordEval.signupReady &&
    newPassword.length >= 8 &&
    confirmPassword.length > 0 &&
    !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (newPassword !== confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }
    if (!passwordEval.signupReady) {
      setMsg("Your new password does not meet all requirements yet.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setMsg(mapAuthErrorMessage(error.message, "en"));
        setSaving(false);
        return;
      }
      setStatus("success");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full min-w-0 rounded-xl border border-black/20 bg-[#2a2a2a] px-4 py-3 text-[#F5F5F5] placeholder:text-[#666] outline-none focus:ring-2 focus:ring-[#A98C2A]/50";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#111111] text-white p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="rounded-2xl border border-black/20 bg-[#1a1a1a] p-6 shadow-xl">
          {status === "checking" ? (
            <p className="text-sm text-[#999]">Verifying your recovery link…</p>
          ) : status === "invalid" ? (
            <>
              <h1 className="text-xl font-bold mb-2 text-[#F5F5F5]">
                Recovery link invalid or expired
              </h1>
              <p className="text-sm text-[#999] mb-4">
                We couldn&apos;t open your recovery link. It may have already been used or expired.
                Request a new one to continue.
              </p>
              <Link
                href="/admin/login/forgot"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#A98C2A] px-4 py-3 font-semibold text-[#111111] hover:bg-[#C9B46A]"
              >
                Request another reset link
              </Link>
            </>
          ) : status === "success" ? (
            <>
              <h1 className="text-xl font-bold mb-2 text-[#F5F5F5]">Password updated</h1>
              <p className="text-sm text-[#999] mb-4">
                Your password was updated successfully. Sign in with your new password.
              </p>
              <Link
                href="/admin/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#A98C2A] px-4 py-3 font-semibold text-[#111111] hover:bg-[#C9B46A]"
              >
                Return to Staff / Team login
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-2 text-[#F5F5F5]">Set a new password</h1>
              <p className="text-sm text-[#999] mb-4">
                {email
                  ? `Choose a new password for ${email}.`
                  : "Choose a new password for your account."}
              </p>

              {msg ? (
                <p className="text-sm text-red-400 mb-3" role="alert">
                  {msg}
                </p>
              ) : null}

              <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
                <PasswordInputField
                  lang="en"
                  variant="dark"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className={inputClass}
                  autoComplete="new-password"
                  disabled={saving}
                />
                {newPassword.length > 0 ? (
                  <PasswordStrengthMeter
                    strength={passwordEval.strength}
                    checks={passwordEval.checks}
                    lang="en"
                    variant="dark"
                  />
                ) : null}
                <PasswordInputField
                  lang="en"
                  variant="dark"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={inputClass}
                  autoComplete="new-password"
                  disabled={saving}
                />
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-xl bg-[#A98C2A] px-4 py-3 font-semibold text-[#111111] hover:bg-[#C9B46A] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/50 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Update password"}
                </button>
              </form>
            </>
          )}
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

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <AdminResetPasswordContent />
    </Suspense>
  );
}
