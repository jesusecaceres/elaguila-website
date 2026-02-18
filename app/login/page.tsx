"use client";

import { useMemo, useState } from "react";
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

  const lang = useMemo(() => detectLangFromRedirect(redirectTo, defaultLang), [redirectTo, defaultLang]);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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
    setLoading("email");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });
      if (error) setMsg(error.message);
      else setMsg(lang === "es" ? "Listo ✅ Revisa tu email para el link." : "Done ✅ Check your email for the link.");
    } finally {
      setLoading(null);
    }
  }

  const copy = useMemo(
    () => ({
      es: {
        title: "Iniciar sesión",
        subtitle: "Continúa con Google (recomendado) o usa un link por email.",
        google: "Continuar con Google",
        emailTitle: "Link por email",
        emailHint: "Te mandamos un link seguro a tu correo.",
        emailPlaceholder: "tu@email.com",
        emailButton: "Enviar link",
        back: "Regresar",
      },
      en: {
        title: "Sign in",
        subtitle: "Continue with Google (recommended) or use an email link.",
        google: "Continue with Google",
        emailTitle: "Email link",
        emailHint: "We’ll send a secure sign-in link to your inbox.",
        emailPlaceholder: "you@email.com",
        emailButton: "Send link",
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
              <p className="text-sm text-gray-300 mt-2">{copy.subtitle}</p>
            </div>

            <button
              onClick={() => router.push(redirectTo)}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white/80 hover:bg-black/40 transition"
            >
              {copy.back}
            </button>
          </div>

          {/* Google (Primary) */}
          <button
            onClick={continueWithGoogle}
            disabled={loading !== null}
            className="mt-6 w-full rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold py-3 disabled:opacity-60"
          >
            {loading === "google" ? "..." : copy.google}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <div className="text-xs text-white/40">or</div>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Email (Secondary) */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-sm font-semibold text-white/90">
              {copy.emailTitle}
            </div>
            <div className="text-xs text-white/60 mt-1">{copy.emailHint}</div>

            <form onSubmit={sendMagicLink} className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl bg-black/50 border border-yellow-600/20 px-4 py-3 text-gray-100 outline-none"
                placeholder={copy.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />

              <button
                type="submit"
                disabled={loading !== null}
                className="w-full rounded-xl border border-yellow-600/20 bg-black/40 hover:bg-black/50 text-white font-semibold py-3 disabled:opacity-60"
              >
                {loading === "email" ? "..." : copy.emailButton}
              </button>
            </form>
          </div>

          {msg && (
            <p className="text-sm text-gray-200 mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              {msg}
            </p>
          )}

          {/* Debug / trust microcopy */}
          <p className="text-xs text-white/40 mt-5">
            {lang === "es"
              ? "Tu sesión se mantiene activa. Puedes cerrar sesión desde el menú arriba."
              : "Your session stays active. You can sign out from the menu above."}
          </p>
        </div>
      </div>
    </main>
  );
}
