"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

type Lang = "es" | "en";

function safeInternalRedirect(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  // Only allow internal paths
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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams?.get("redirect");
  const urlLang = searchParams?.get("lang") as Lang | null;

  const defaultLang: Lang = urlLang === "en" ? "en" : "es";

  const redirectTo = useMemo(() => {
    const safe = safeInternalRedirect(redirectParam);
    // Fallback: classifieds home in the current language
    return safe || `/clasificados?lang=${defaultLang}`;
  }, [redirectParam, defaultLang]);

  const lang = useMemo(
    () => detectLangFromRedirect(redirectTo, defaultLang),
    [redirectTo, defaultLang]
  );

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Simple cooldown to prevent rate-limit spam + reduce user confusion.
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const t = window.setInterval(() => {
      setCooldownSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldownSeconds]);

  const callbackUrl = useMemo(() => {
    // Keep the redirect in the callback URL so we land EXACTLY where the user intended.
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
          "Continúa con Google (recomendado) o usa un link por email. Regresarás a LEONIX automáticamente.",
        secureNote: "Inicio de sesión seguro.",
        google: "Continuar con Google",
        emailTitle: "Link por email",
        emailHint: "Te mandamos un link seguro a tu correo.",
        emailPlaceholder: "tu@email.com",
        emailButton: "Enviar link",
        emailCooldown: (s: number) => `Reintentar en ${s}s`,
        back: "Regresar",
      },
      en: {
        title: "Sign in",
        subtitle:
          "Continue with Google (recommended) or use an email link. You’ll return to LEONIX automatically.",
        secureNote: "Secure sign-in.",
        google: "Continue with Google",
        emailTitle: "Email link",
        emailHint: "We’ll send a secure sign-in link to your inbox.",
        emailPlaceholder: "you@email.com",
        emailButton: "Send link",
        emailCooldown: (s: number) => `Try again in ${s}s`,
        back: "Back",
      },
    }),
    []
  )[lang];

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-xl mx-auto px-6 pt-28 pb-16">
        <div className="rounded-2xl border border-yellow-600/20 bg-black/40 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-yellow-400">
                {copy.title}
              </h1>
              <p className="mt-2 text-gray-300">{copy.subtitle}</p>
              <p className="mt-2 text-xs text-white/60">{copy.secureNote}</p>
            </div>

            <button
              onClick={() => router.back()}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              {copy.back}
            </button>
          </div>

          {msg ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
              {msg}
            </div>
          ) : null}

          <div className="mt-6">
            <button
              onClick={continueWithGoogle}
              disabled={loading !== null}
              className="w-full rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold py-3 disabled:opacity-60"
            >
              {loading === "google"
                ? lang === "es"
                  ? "Abriendo Google…"
                  : "Opening Google…"
                : copy.google}
            </button>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <div className="text-sm font-semibold text-white">
              {copy.emailTitle}
            </div>
            <div className="text-xs text-white/60 mt-1">{copy.emailHint}</div>

            <form onSubmit={sendMagicLink} className="mt-3 space-y-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.emailPlaceholder}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-yellow-500/60"
                type="email"
                autoComplete="email"
              />

              <button
                type="submit"
                disabled={loading !== null || cooldownSeconds > 0}
                className="w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 disabled:opacity-60"
              >
                {cooldownSeconds > 0
                  ? copy.emailCooldown(cooldownSeconds)
                  : loading === "email"
                  ? lang === "es"
                    ? "Enviando…"
                    : "Sending…"
                  : copy.emailButton}
              </button>
            </form>
          </div>

          <div className="mt-6 text-xs text-white/50">
            {lang === "es"
              ? "Tip: Si no ves el email, revisa Spam/Promociones."
              : "Tip: If you don’t see the email, check Spam/Promotions."}
          </div>
        </div>
      </div>
    </main>
  );
}
