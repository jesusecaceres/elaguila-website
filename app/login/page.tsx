"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import { createSupabaseBrowserClient, withAuthTimeout } from "../lib/supabase/browser";

type Lang = "es" | "en";
type LoginMode = "login" | "signup" | "post";

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
  const modeParam = searchParams?.get("mode");
  const urlLang = searchParams?.get("lang") as Lang | null;

  const defaultLang: Lang = urlLang === "en" ? "en" : "es";

  const mode: LoginMode = useMemo(() => {
    const m = (modeParam ?? "login").toLowerCase();
    if (m === "signup" || m === "post") return m;
    return "login";
  }, [modeParam]);

  const redirectTo = useMemo(() => {
    const safe = safeInternalRedirect(redirectParam);
    if (safe) return safe;
    if (mode === "signup")
      return `/dashboard/perfil?onboarding=1&lang=${defaultLang}`;
    if (mode === "post")
      return `/dashboard/perfil?require=post&lang=${defaultLang}`;
    return `/clasificados?lang=${defaultLang}`;
  }, [redirectParam, defaultLang, mode]);

  const lang = useMemo(
    () => detectLangFromRedirect(redirectTo, defaultLang),
    [redirectTo, defaultLang]
  );

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [authCheckDone, setAuthCheckDone] = useState(false);

  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          router.replace(redirectTo);
          return;
        }
        setAuthCheckDone(true);
      } catch {
        if (!mounted) return;
        setAuthCheckDone(true);
      }
    })();
    return () => { mounted = false; };
  }, [router, redirectTo]);

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

  function buildLoginUrl(nextMode: LoginMode) {
    const params = new URLSearchParams();
    params.set("mode", nextMode);
    params.set("lang", lang);
    if (redirectParam && safeInternalRedirect(redirectParam))
      params.set("redirect", redirectParam);
    return `/login?${params.toString()}`;
  }

  function handleClose() {
    if (mode === "post") {
      router.replace(`/clasificados?lang=${lang}`);
      return;
    }
    const target = safeInternalRedirect(redirectParam) || `/clasificados?lang=${lang}`;
    router.replace(target);
  }

  const OAUTH_INIT_TIMEOUT_MS = 15000;

  async function continueWithGoogle() {
    setMsg(null);
    setLoading("google");
    try {
      const supabase = createSupabaseBrowserClient();
      const result = await withAuthTimeout(
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: callbackUrl },
        }),
        OAUTH_INIT_TIMEOUT_MS
      );
      if (result.error) {
        setMsg(result.error.message);
        return;
      }
      // Success: Supabase redirects; loading stays until navigation. If redirect fails (e.g. 522), user returns to login and loading was cleared on next mount.
    } catch (e: unknown) {
      const isTimeout = (e as { message?: string })?.message === "auth_timeout";
      const isNetwork =
        (e as { message?: string })?.message?.toLowerCase().includes("fetch") ||
        (e as { message?: string })?.message?.toLowerCase().includes("network");
      if (isTimeout || isNetwork) {
        setMsg(
          lang === "es"
            ? "El servicio de inicio de sesión no está disponible. Intenta de nuevo en unos minutos."
            : "Sign-in service is temporarily unavailable. Please try again in a few minutes."
        );
      } else {
        setMsg((e as { message?: string })?.message ?? (lang === "es" ? "Error al conectar." : "Connection error."));
      }
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

      const successMsg =
        mode === "post"
          ? lang === "es"
            ? "Te enviamos un link para continuar con tu anuncio."
            : "We sent you a link to continue with your listing."
          : mode === "signup"
            ? lang === "es"
              ? "Te enviamos un link para crear tu cuenta."
              : "We sent you a link to create your account."
            : lang === "es"
              ? "Te enviamos un link para iniciar sesión."
              : "We sent you a link to sign in.";
      setMsg(`✅ ${successMsg}`);
      setCooldownSeconds(60);
    } finally {
      setLoading(null);
    }
  }

  const copy = useMemo(
    () => ({
      login: {
        es: { title: "Iniciar sesión", subtitle: "Entrá con Google o recibe un link por email para volver a tu cuenta.", badge: "Acceso" },
        en: { title: "Sign in", subtitle: "Continue with Google or get a link by email to access your account.", badge: "Sign in" },
      },
      signup: {
        es: { title: "Crear cuenta", subtitle: "Usa Google o tu email para crear tu cuenta en LEONIX y empezar a explorar.", badge: "Nuevo" },
        en: { title: "Create account", subtitle: "Use Google or your email to create your LEONIX account and start exploring.", badge: "New" },
      },
      post: {
        es: { title: "Accede para publicar", subtitle: "Inicia sesión o crea tu cuenta para continuar con tu anuncio.", badge: "Publicar" },
        en: { title: "Sign in to post", subtitle: "Sign in or create an account to continue with your listing.", badge: "Post" },
      },
      common: {
        es: {
          google: "Continuar con Google",
          emailTitle: "Link por email",
          emailPlaceholder: "tu@email.com",
          emailButton: "Enviar link",
          emailCooldown: (s: number) => `Reintentar en ${s}s`,
          connecting: "Conectando…",
          sending: "Enviando…",
          tip: "Si no ves el link, revisa Spam o Promociones.",
          sameAccount: "Si ya tienes cuenta, usa el mismo correo o la misma cuenta de Google de siempre.",
          noPassword: "Este acceso funciona con link por email o Google; no necesitas contraseña.",
          supportHint: "Si tu cuenta ya existe, entra con el mismo método que usaste al crearla.",
          noAccount: "¿No tienes cuenta?",
          createAccount: "Crear cuenta",
          haveAccount: "¿Ya tienes cuenta?",
          signIn: "Iniciar sesión",
          close: "Cerrar",
        },
        en: {
          google: "Continue with Google",
          emailTitle: "Email link",
          emailPlaceholder: "you@email.com",
          emailButton: "Send link",
          emailCooldown: (s: number) => `Try again in ${s}s`,
          connecting: "Connecting…",
          sending: "Sending…",
          tip: "If you don't see the link, check Spam or Promotions.",
          sameAccount: "If you already have an account, use the same email or the same Google account as before.",
          noPassword: "This access uses email links or Google; no password is required.",
          supportHint: "If your account already exists, sign in with the same method you used when you created it.",
          noAccount: "Don't have an account?",
          createAccount: "Create account",
          haveAccount: "Already have an account?",
          signIn: "Sign in",
          close: "Close",
        },
      },
    }),
    []
  );

  const modeCopy = copy[mode][lang];
  const common = copy.common[lang];

  const isLoading = loading !== null;

  if (!authCheckDone) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
        <div
          className="fixed inset-0 bg-gradient-to-b from-black via-[#111] to-[#0a0a0a] pointer-events-none"
          aria-hidden
        />
        <Navbar />
        <div className="relative max-w-md mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
          <div className="rounded-3xl border border-white/10 bg-[#141414]/95 shadow-2xl p-6 sm:p-8 flex items-center justify-center min-h-[200px]">
            <p className="text-white/80 text-sm">
              {defaultLang === "es" ? "Verificando sesión…" : "Checking session…"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <div
        className="fixed inset-0 bg-gradient-to-b from-black via-[#111] to-[#0a0a0a] pointer-events-none"
        aria-hidden
      />
      <Navbar />

      <div className="relative max-w-md mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        <div className="rounded-3xl border border-white/10 bg-[#141414]/95 shadow-2xl p-6 sm:p-8 relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition"
            aria-label={common.close}
          >
            ×
          </button>

          <div className="flex flex-col gap-3 pr-12">
            <span className="inline-flex w-fit items-center rounded-full border border-yellow-500/30 bg-yellow-600/10 px-2.5 py-1 text-xs font-medium text-yellow-200">
              {modeCopy.badge}
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-yellow-400">
              {modeCopy.title}
            </h1>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              {modeCopy.subtitle}
            </p>
          </div>

          {msg ? (
            <div
              className={`mt-6 rounded-xl border p-4 text-sm ${
                msg.startsWith("✅")
                  ? "border-green-500/30 bg-green-500/10 text-green-200"
                  : "border-white/10 bg-white/5 text-gray-200"
              }`}
            >
              {msg}
            </div>
          ) : null}

          <div className="mt-6">
            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={isLoading}
              className="w-full min-w-0 flex items-center justify-center gap-3 rounded-xl bg-[#e6b800] hover:bg-[#f0c800] text-black font-semibold py-4 px-4 disabled:opacity-60 disabled:pointer-events-none transition"
            >
              {loading === "google" ? (
                <span>{common.connecting}</span>
              ) : (
                <>
                  <GoogleIcon className="h-5 w-5 shrink-0" />
                  <span>{common.google}</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <h2 className="text-sm font-semibold text-white">
              {common.emailTitle}
            </h2>
            <p className="mt-2 text-xs text-white/60">
              {common.sameAccount}
            </p>
            <p className="mt-1 text-xs text-white/50">
              {common.noPassword}
            </p>
            <form onSubmit={sendMagicLink} className="mt-4 space-y-4">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={common.emailPlaceholder}
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
                  ? common.emailCooldown(cooldownSeconds)
                  : loading === "email"
                    ? common.sending
                    : common.emailButton}
              </button>
            </form>
          </div>

          {mode === "login" && (
            <p className="mt-6 text-sm text-white/70">
              {common.noAccount}{" "}
              <Link
                href={buildLoginUrl("signup")}
                className="text-yellow-400 hover:text-yellow-300 font-medium underline"
              >
                {common.createAccount}
              </Link>
            </p>
          )}
          {mode === "signup" && (
            <p className="mt-6 text-sm text-white/70">
              {common.haveAccount}{" "}
              <Link
                href={buildLoginUrl("login")}
                className="text-yellow-400 hover:text-yellow-300 font-medium underline"
              >
                {common.signIn}
              </Link>
            </p>
          )}

          <p className="mt-4 text-xs text-white/50">
            {common.supportHint}
          </p>
          <p className="mt-2 text-xs text-white/50">{common.tip}</p>
        </div>
      </div>
    </main>
  );
}
