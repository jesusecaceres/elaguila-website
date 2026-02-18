"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Navbar from "../../components/Navbar";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Lang = "es" | "en";

function safeInternalRedirect(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (v.startsWith("/")) return v;
  return "";
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/perfil";

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  const onboarding = searchParams?.get("onboarding") === "1";
  const redirectParam = searchParams?.get("redirect");
  const redirectTo = useMemo(
    () => safeInternalRedirect(redirectParam),
    [redirectParam]
  );

  const t = useMemo(
    () => ({
      es: {
        title: onboarding ? "Crear cuenta" : "Perfil",
        subtitle: onboarding
          ? "Solo un paso más. Completa tu nombre para terminar tu cuenta."
          : "Información básica de tu cuenta.",
        back: "Volver a mi cuenta",
        name: "Nombre",
        email: "Correo",
        save: "Guardar y continuar",
        saving: "Guardando…",
        skip: "Omitir por ahora",
        signInAgain: "Iniciar sesión",
      },
      en: {
        title: onboarding ? "Create account" : "Profile",
        subtitle: onboarding
          ? "One more step. Add your name to finish your account."
          : "Basic account information.",
        back: "Back to my account",
        name: "Name",
        email: "Email",
        save: "Save & continue",
        saving: "Saving…",
        skip: "Skip for now",
        signInAgain: "Sign in",
      },
    }),
    [onboarding]
  );
  const L = t[lang];

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const redirect = encodeURIComponent(
          `${pathname}${window.location.search || ""}`
        );
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      const u = data.user;
      setEmail(u.email ?? null);

      const existingName =
        (u.user_metadata?.full_name as string | undefined) ||
        (u.user_metadata?.name as string | undefined) ||
        "";

      setName(existingName);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  async function saveAndContinue() {
    setMsg(null);
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const u = data.user;

      if (!u) {
        const redirect = encodeURIComponent(
          `${pathname}${window.location.search || ""}`
        );
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      const trimmed = name.trim();
      if (!trimmed) {
        setMsg(lang === "es" ? "Escribe tu nombre." : "Enter your name.");
        return;
      }

      // 1) Store name in user metadata (always safe)
      const { error: updErr } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });
      if (updErr) throw updErr;

      // 2) Best-effort profile row upsert (schema-safe via try/catch)
      try {
        await supabase.from("profiles").upsert({
          id: u.id,
          email: u.email,
          full_name: trimmed,
          plan: "free",
          role: "free",
        } as any);
      } catch {
        // ignore if profiles table/columns aren't ready yet
      }

      // Go back to intended destination
      if (redirectTo) router.replace(redirectTo);
      else router.replace(`/dashboard?lang=${lang}`);
    } catch (e: any) {
      setMsg(e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    if (redirectTo) router.replace(redirectTo);
    else router.replace(`/dashboard?lang=${lang}`);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-3xl md:text-4xl font-semibold text-yellow-400">
          {L.title}
        </h1>
        <p className="mt-2 text-gray-300">{L.subtitle}</p>

        <div className="mt-8 rounded-2xl border border-yellow-600/20 bg-black/40 p-6">
          {loading ? (
            <div className="text-white/70">Loading…</div>
          ) : (
            <>
              {msg ? (
                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
                  {msg}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-white/60">{L.name}</div>
                  {onboarding ? (
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang === "es" ? "Tu nombre" : "Your name"}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-yellow-500/60"
                    />
                  ) : (
                    <div className="mt-1 text-base font-semibold text-white">
                      {name || "—"}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-white/60">{L.email}</div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {email || "—"}
                  </div>
                </div>
              </div>

              {onboarding ? (
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={saveAndContinue}
                    disabled={saving}
                    className="w-full sm:w-auto rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold px-5 py-3 disabled:opacity-60"
                  >
                    {saving ? L.saving : L.save}
                  </button>

                  <button
                    onClick={skip}
                    className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold px-5 py-3"
                  >
                    {L.skip}
                  </button>
                </div>
              ) : (
                <Link
                  href={`/dashboard?lang=${lang}`}
                  className="mt-6 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  {L.back}
                </Link>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
