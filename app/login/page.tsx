"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

type Lang = "es" | "en";

function safeInternalRedirect(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (v.startsWith("/")) return v;
  return "";
}

function detectLangFromRedirect(redirect: string, fallback: Lang): Lang {
  try {
    const u = new URL(redirect, "https://example.com");
    const l = u.searchParams.get("lang");
    if (l === "es" || l === "en") return l;
  } catch {
    // ignore
  }
  return fallback;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams?.get("redirect");
  const urlLang = searchParams?.get("lang") as Lang | null;

  const defaultLang: Lang = urlLang === "en" ? "en" : "es";

  const redirectTo = useMemo(() => {
    const safe = safeInternalRedirect(redirectParam);
    return safe || `/dashboard?lang=${defaultLang}`;
  }, [redirectParam, defaultLang]);

  const lang = useMemo(
    () => detectLangFromRedirect(redirectTo, defaultLang),
    [redirectTo, defaultLang]
  );

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const t = window.setInterval(() => {
      setCooldownSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldownSeconds]);

  const callbackUrl = useMemo(() => {
    const base = `${window.location.origin}/auth/callback`;
    const q = new URLSearchParams();
    q.set("redirect", redirectTo);
    return `${base}?${q.toString()}`;
  }, [redirectTo]);

  async function continueWithGoogle() {
    setMsg(null);
    setLoading("google");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (error) setMsg(error.message);
    } finally {
      setLoading(null);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setMsg(lang === "es" ? "Escribe tu correo." : "Enter your email.");
      return;
    }

    if (cooldownSeconds > 0) return;

    setLoading("email");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        const m = (error.message || "").toLowerCase();
        if (m.includes("rate") && m.includes("limit")) {
          setMsg(
            lang === "es"
              ? "Demasiados intentos. Espera un momento y vuelve a intentar."
              : "Too many attempts. Please wait a moment and try again."
          );
          setCooldownSeconds(60);
          return;
        }
        setMsg(error.message);
        return;
      }

      setMsg(
        lang === "es"
          ? "Listo ✅ Revisa tu email para el link."
          : "Done ✅ Check your email for the link."
      );
      setCooldownSeconds(60);
    } finally {
      setLoading(null);
    }
  }

  const copy = useMemo(
    () => ({
      es: {
        title: "Iniciar sesión",
        subtitle:
          "Continuá con Google (recomendado) o usa un link por email. Regresarás a LEONIX automáticamente.",
        google: "Continuar con Google",
        emailTitle: "Link por email",
        emailPlaceholder: "tu@email.com",
        emailButton: "Enviar link",
        emailCooldown: (s: number) => `Reintentar en ${s}s`,
        back: "Regresar",
        connecting: "Conectando…",
        sending: "Enviando…",
        tip: "Tip: Si no ves el email, revisa Spam/Promociones.",
      },
      en: {
        title: "Sign in",
        subtitle:
          "Continue with Google (recommended) or use an email link. You'll return to LEONIX automatically.",
        google: "Continue with Google",
        emailTitle: "Email link",
        emailPlaceholder: "you@email.com",
        emailButton: "Send link",
        emailCooldown: (s: number) => `Try again in ${s}s`,
        back: "Back",
        connecting: "Connecting…",
        sending: "Sending…",
        tip: "Tip: If you don't see the email, check Spam/Promotions.",
      },
    }),
    []
  )[lang];

  const isLoading = loading !== null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <div
        className="fixed inset-0 bg-gradient-to-b from-black via-[#111] to-[#0a0a0a] pointer-events-none"
        aria-hidden
      />
      <Navbar />

      <div className="relative max-w-md mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        <div className="rounded-3xl border border-white/10 bg-[#141414]/95 shadow-2xl p-6 sm:p-8">
          {/* Header: back pill right, title below on small screens for clarity */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-yellow-400">
                {copy.title}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/80 leading-relaxed">
                {copy.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="shrink-0 self-start sm:self-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              {copy.back}
            </button>
          </div>

          {msg ? (
            <div
              className={`mt-6 rounded-xl border p-4 text-sm ${
                msg.startsWith("Listo") || msg.startsWith("Done")
                  ? "border-green-500/30 bg-green-500/10 text-green-200"
                  : "border-white/10 bg-white/5 text-gray-200"
              }`}
            >
              {msg}
            </div>
          ) : null}

          {/* Google CTA — full width, gold, icon left */}
          <div className="mt-6">
            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={isLoading}
              className="w-full min-w-0 flex items-center justify-center gap-3 rounded-xl bg-[#e6b800] hover:bg-[#f0c800] text-black font-semibold py-4 px-4 disabled:opacity-60 disabled:pointer-events-none transition"
            >
              {loading === "google" ? (
                <span>{copy.connecting}</span>
              ) : (
                <>
                  <GoogleIcon className="h-5 w-5 shrink-0" />
                  <span>{copy.google}</span>
                </>
              )}
            </button>
          </div>

          {/* Email magic link */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <h2 className="text-sm font-semibold text-white">
              {copy.emailTitle}
            </h2>
            <form onSubmit={sendMagicLink} className="mt-4 space-y-4">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.emailPlaceholder}
                className="w-full min-w-0 rounded-xl border border-white/15 bg-black/40 px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition"
                type="email"
                autoComplete="email"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || cooldownSeconds > 0}
                className="w-full min-w-0 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold py-4 px-4 disabled:opacity-60 disabled:pointer-events-none transition"
              >
                {cooldownSeconds > 0
                  ? copy.emailCooldown(cooldownSeconds)
                  : loading === "email"
                    ? copy.sending
                    : copy.emailButton}
              </button>
            </form>
          </div>

          <p className="mt-6 text-xs text-white/50">{copy.tip}</p>
        </div>
      </div>
    </main>
  );
}
