"use client";

/**
 * Gate 2A/2B QA audit (customer login / security):
 * - GOOGLE_LOGIN_PRESERVED: TRUE
 * - FACEBOOK_LOGIN_ADDED: TRUE
 * - MAGIC_LINK_PRESERVED: TRUE
 * - PASSWORD_LOGIN_ADDED: TRUE
 * - PASSWORD_SIGNUP_ADDED: TRUE
 * - PASSWORD_STRENGTH_METER_ADDED: TRUE
 * - PASSWORD_RESET_ADDED: TRUE
 * - USER_DASHBOARD_CHANGE_PASSWORD_ADDED: TRUE (see /dashboard/seguridad)
 * - ADMIN_EMERGENCY_RESET_NOT_ADDED_THIS_GATE: TRUE
 * - NO_PASSWORD_STORAGE_OUTSIDE_SUPABASE: TRUE
 * - NO_IMPERSONATION: TRUE
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordStrengthMeter } from "../components/auth/PasswordStrengthMeter";
import { evaluatePassword, mapAuthErrorMessage } from "@/app/lib/auth/customerPassword";
import { createSupabaseBrowserClient, withAuthTimeout } from "@/app/lib/supabase/browser";

type Lang = "es" | "en";
type LoginMode = "login" | "signup" | "post" | "reset";
type LoadingKind =
  | "google"
  | "facebook"
  | "magic"
  | "password-login"
  | "password-signup"
  | "reset"
  | null;

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

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
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
  const authErrorParam = searchParams?.get("auth_error");
  const urlLang = searchParams?.get("lang") as Lang | null;

  const defaultLang: Lang = urlLang === "en" ? "en" : "es";

  const mode: LoginMode = useMemo(() => {
    const m = (modeParam ?? "login").toLowerCase();
    if (m === "signup" || m === "post" || m === "reset") return m;
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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState<LoadingKind>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  const passwordEval = useMemo(
    () => evaluatePassword(password, email),
    [password, email]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user && mode !== "reset") {
          router.replace(redirectTo);
          return;
        }
        setAuthCheckDone(true);
      } catch {
        if (!mounted) return;
        setAuthCheckDone(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, redirectTo, mode]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const t = window.setInterval(() => {
      setCooldownSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!authErrorParam) return;
    const recoveryIntent =
      redirectParam?.includes("recovery=1") || mode === "reset";
    if (authErrorParam === "recovery" || (authErrorParam === "callback" && recoveryIntent)) {
      setMsg(
        lang === "es"
          ? "No pudimos abrir el enlace de recuperación. Solicita uno nuevo."
          : "We couldn't open your recovery link. Please request a new one."
      );
      return;
    }
    if (authErrorParam === "callback") {
      setMsg(
        lang === "es"
          ? "No pudimos completar el inicio de sesión con Google o Facebook. Intenta de nuevo."
          : "We couldn't complete sign-in with Google or Facebook. Please try again."
      );
    }
  }, [authErrorParam, lang, redirectParam, mode]);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = `${window.location.origin}/auth/callback`;
    const q = new URLSearchParams();
    q.set("redirect", redirectTo);
    return `${base}?${q.toString()}`;
  }, [redirectTo]);

  const resetCallbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = `${window.location.origin}/auth/callback`;
    const q = new URLSearchParams();
    const recoveryRedirect =
      mode === "reset" || !redirectParam
        ? `/dashboard/seguridad?recovery=1&lang=${lang}`
        : safeInternalRedirect(redirectParam) ||
          `/dashboard/seguridad?recovery=1&lang=${lang}`;
    q.set("redirect", recoveryRedirect);
    return `${base}?${q.toString()}`;
  }, [redirectParam, lang, mode]);

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
  const isLoading = loading !== null;

  async function continueWithOAuth(provider: "google" | "facebook") {
    setMsg(null);
    setLoading(provider);
    try {
      const supabase = createSupabaseBrowserClient();
      const result = await withAuthTimeout(
        supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: callbackUrl },
        }),
        OAUTH_INIT_TIMEOUT_MS
      );
      if (result.error) {
        setMsg(result.error.message);
        return;
      }
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
        setMsg(
          (e as { message?: string })?.message ??
            (lang === "es" ? "Error al conectar." : "Connection error.")
        );
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

    setLoading("magic");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        setMsg(mapAuthErrorMessage(error.message, lang));
        if (error.message?.toLowerCase().includes("rate")) setCooldownSeconds(60);
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

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMsg(lang === "es" ? "Escribe tu correo." : "Enter your email.");
      return;
    }
    if (!password) {
      setMsg(lang === "es" ? "Escribe tu contraseña." : "Enter your password.");
      return;
    }

    setLoading("password-login");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) {
        setMsg(mapAuthErrorMessage(error.message, lang));
        return;
      }
      if (data.session) {
        router.replace(redirectTo);
      }
    } finally {
      setLoading(null);
    }
  }

  async function signUpWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMsg(lang === "es" ? "Escribe tu correo." : "Enter your email.");
      return;
    }
    if (!passwordEval.signupReady) {
      setMsg(
        lang === "es"
          ? "Tu contraseña aún no cumple todos los requisitos."
          : "Your password does not meet all requirements yet."
      );
      return;
    }
    if (password !== confirmPassword) {
      setMsg(
        lang === "es"
          ? "Las contraseñas no coinciden."
          : "Passwords do not match."
      );
      return;
    }

    setLoading("password-signup");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });
      if (error) {
        setMsg(mapAuthErrorMessage(error.message, lang));
        return;
      }
      if (data.session) {
        router.replace(redirectTo);
        return;
      }
      setMsg(
        `✅ ${
          lang === "es"
            ? "Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión."
            : "Account created. Check your email to confirm, then sign in."
        }`
      );
      setPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(null);
    }
  }

  async function sendPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setMsg(lang === "es" ? "Escribe tu correo." : "Enter your email.");
      return;
    }
    if (cooldownSeconds > 0) return;

    setLoading("reset");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: resetCallbackUrl,
      });
      if (error) {
        setMsg(mapAuthErrorMessage(error.message, lang));
        if (error.message?.toLowerCase().includes("rate")) setCooldownSeconds(60);
        return;
      }
      setMsg(
        `✅ ${
          lang === "es"
            ? "Te enviamos un correo para restablecer tu contraseña."
            : "We sent you an email to reset your password."
        }`
      );
      setCooldownSeconds(60);
    } finally {
      setLoading(null);
    }
  }

  const copy = useMemo(
    () => ({
      login: {
        es: {
          title: "Iniciar sesión",
          subtitle:
            "Entrá con Google, contraseña o un link por email para volver a tu cuenta.",
          badge: "Acceso",
        },
        en: {
          title: "Sign in",
          subtitle: "Continue with Google, password, or an email link to access your account.",
          badge: "Sign in",
        },
      },
      signup: {
        es: {
          title: "Crear cuenta",
          subtitle:
            "Usa Google, contraseña o tu email para crear tu cuenta en LEONIX.",
          badge: "Nuevo",
        },
        en: {
          title: "Create account",
          subtitle: "Use Google, a password, or your email to create your LEONIX account.",
          badge: "New",
        },
      },
      post: {
        es: {
          title: "Accede para publicar",
          subtitle: "Inicia sesión o crea tu cuenta para continuar con tu anuncio.",
          badge: "Publicar",
        },
        en: {
          title: "Sign in to post",
          subtitle: "Sign in or create an account to continue with your listing.",
          badge: "Post",
        },
      },
      reset: {
        es: {
          title: "Recuperar contraseña",
          subtitle: "Te enviaremos un correo seguro para crear una nueva contraseña.",
          badge: "Recuperar",
        },
        en: {
          title: "Reset password",
          subtitle: "We will email you a secure link to set a new password.",
          badge: "Reset",
        },
      },
      common: {
        es: {
          google: "Continuar con Google",
          facebook: "Continuar con Facebook",
          emailTitle: "Link por email",
          passwordTitle: "Contraseña",
          emailPlaceholder: "tu@email.com",
          passwordPlaceholder: "Contraseña",
          confirmPlaceholder: "Confirmar contraseña",
          emailButton: "Enviar link",
          signInPassword: "Iniciar sesión con contraseña",
          signUpPassword: "Crear cuenta con contraseña",
          sendReset: "Enviar enlace de recuperación",
          forgotPassword: "¿Olvidaste tu contraseña?",
          emailCooldown: (s: number) => `Reintentar en ${s}s`,
          connecting: "Conectando…",
          sending: "Enviando…",
          tip: "Si no ves el correo, revisa Spam o Promociones.",
          sameAccount:
            "Si ya tienes cuenta, usa el mismo correo o la misma cuenta de Google de siempre.",
          magicHint: "También puedes entrar con link por email o Google.",
          supportHint:
            "Si tu cuenta ya existe, entra con el mismo método que usaste al crearla.",
          noAccount: "¿No tienes cuenta?",
          createAccount: "Crear cuenta",
          haveAccount: "¿Ya tienes cuenta?",
          signIn: "Iniciar sesión",
          close: "Cerrar",
        },
        en: {
          google: "Continue with Google",
          facebook: "Continue with Facebook",
          emailTitle: "Email link",
          passwordTitle: "Password",
          emailPlaceholder: "you@email.com",
          passwordPlaceholder: "Password",
          confirmPlaceholder: "Confirm password",
          emailButton: "Send link",
          signInPassword: "Sign in with password",
          signUpPassword: "Create account with password",
          sendReset: "Send recovery email",
          forgotPassword: "Forgot your password?",
          emailCooldown: (s: number) => `Try again in ${s}s`,
          connecting: "Connecting…",
          sending: "Sending…",
          tip: "If you don't see the email, check Spam or Promotions.",
          sameAccount:
            "If you already have an account, use the same email or Google account as before.",
          magicHint: "You can also sign in with an email link or Google.",
          supportHint:
            "If your account already exists, sign in with the same method you used when you created it.",
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

  const inputClass =
    "w-full min-w-0 rounded-xl border border-white/15 bg-black/40 px-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition";

  const btnPrimary =
    "w-full min-w-0 flex min-h-[48px] items-center justify-center rounded-xl bg-[#e6b800] hover:bg-[#f0c800] text-black font-semibold py-4 px-4 disabled:opacity-60 disabled:pointer-events-none transition";

  const btnSecondary =
    "w-full min-w-0 flex min-h-[48px] items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold py-4 px-4 disabled:opacity-60 disabled:pointer-events-none transition";

  if (!authCheckDone) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
        <div
          className="fixed inset-0 bg-gradient-to-b from-black via-[#111] to-[#0a0a0a] pointer-events-none"
          aria-hidden
        />
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

          {mode === "reset" ? (
            <form onSubmit={sendPasswordReset} className="mt-8 space-y-4">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={common.emailPlaceholder}
                className={inputClass}
                type="email"
                autoComplete="email"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || cooldownSeconds > 0}
                className={btnPrimary}
              >
                {cooldownSeconds > 0
                  ? common.emailCooldown(cooldownSeconds)
                  : loading === "reset"
                    ? common.sending
                    : common.sendReset}
              </button>
              <p className="text-sm text-white/70">
                {common.haveAccount}{" "}
                <Link
                  href={buildLoginUrl("login")}
                  className="text-yellow-400 hover:text-yellow-300 font-medium underline"
                >
                  {common.signIn}
                </Link>
              </p>
            </form>
          ) : (
            <>
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => void continueWithOAuth("google")}
                  disabled={isLoading}
                  className={btnPrimary}
                >
                  {loading === "google" ? (
                    <span>{common.connecting}</span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <GoogleIcon className="h-5 w-5 shrink-0" />
                      <span>{common.google}</span>
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void continueWithOAuth("facebook")}
                  disabled={isLoading}
                  className={btnSecondary}
                >
                  {loading === "facebook" ? (
                    <span>{common.connecting}</span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <FacebookIcon className="h-5 w-5 shrink-0 text-[#1877F2]" />
                      <span>{common.facebook}</span>
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <h2 className="text-sm font-semibold text-white">{common.passwordTitle}</h2>
                <p className="mt-2 text-xs text-white/60">{common.magicHint}</p>
                <form
                  onSubmit={
                    mode === "signup"
                      ? signUpWithPassword
                      : signInWithPassword
                  }
                  className="mt-4 space-y-4"
                >
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={common.emailPlaceholder}
                    className={inputClass}
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={common.passwordPlaceholder}
                    className={inputClass}
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    disabled={isLoading}
                  />
                  {mode === "signup" && password.length > 0 ? (
                    <PasswordStrengthMeter
                      strength={passwordEval.strength}
                      checks={passwordEval.checks}
                      lang={lang}
                      variant="dark"
                    />
                  ) : null}
                  {mode === "signup" ? (
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={common.confirmPlaceholder}
                      className={inputClass}
                      type="password"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                  ) : null}
                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      (mode === "signup" &&
                        (!passwordEval.signupReady ||
                          password !== confirmPassword ||
                          !confirmPassword))
                    }
                    className={btnSecondary}
                  >
                    {loading === "password-login" || loading === "password-signup"
                      ? common.sending
                      : mode === "signup"
                        ? common.signUpPassword
                        : common.signInPassword}
                  </button>
                  {mode === "login" || mode === "post" ? (
                    <p className="text-xs text-white/55">
                      <Link
                        href={buildLoginUrl("reset")}
                        className="text-yellow-400/90 hover:text-yellow-300 underline"
                      >
                        {common.forgotPassword}
                      </Link>
                    </p>
                  ) : null}
                </form>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <h2 className="text-sm font-semibold text-white">{common.emailTitle}</h2>
                <p className="mt-2 text-xs text-white/60">{common.sameAccount}</p>
                <form onSubmit={sendMagicLink} className="mt-4 space-y-4">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={common.emailPlaceholder}
                    className={inputClass}
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || cooldownSeconds > 0}
                    className={btnSecondary}
                  >
                    {cooldownSeconds > 0
                      ? common.emailCooldown(cooldownSeconds)
                      : loading === "magic"
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
            </>
          )}

          {mode !== "reset" ? (
            <>
              <p className="mt-4 text-xs text-white/50">{common.supportHint}</p>
              <p className="mt-2 text-xs text-white/50">{common.tip}</p>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
