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
  const requirePost = searchParams?.get("require") === "post";
  const redirectParam = searchParams?.get("redirect");
  const redirectTo = useMemo(
    () => safeInternalRedirect(redirectParam),
    [redirectParam]
  );

  const showClose = onboarding || requirePost;

  const t = useMemo(
    () => ({
      es: {
        title: requirePost
          ? "Completa tu perfil para publicar"
          : onboarding
            ? "Completa tu perfil"
            : "Perfil",
        subtitle: requirePost
          ? "Necesitamos tu teléfono y ciudad para que los compradores puedan contactarte."
          : onboarding
            ? "Tu cuenta ya está lista. Solo falta completar tu perfil para continuar."
            : "Información básica de tu cuenta.",
        signedInNote: "Ya iniciaste sesión correctamente.",
        postHelper: "Esto es necesario para que compradores puedan contactarte.",
        back: "Volver a mi cuenta",
        name: "Nombre",
        email: "Correo",
        phone: "Teléfono",
        city: "Ciudad",
        save: "Guardar y continuar",
        saving: "Guardando…",
        skip: "Omitir por ahora",
        signInAgain: "Iniciar sesión",
        close: "Cerrar",
      },
      en: {
        title: requirePost
          ? "Complete your profile to post"
          : onboarding
            ? "Complete your profile"
            : "Profile",
        subtitle: requirePost
          ? "We need your phone and city so buyers can contact you."
          : onboarding
            ? "Your account is already ready. Just complete your profile to continue."
            : "Basic account information.",
        signedInNote: "You've already signed in successfully.",
        postHelper: "This is required so buyers can contact you.",
        back: "Back to my account",
        name: "Name",
        email: "Email",
        phone: "Phone",
        city: "City",
        save: "Save and continue",
        saving: "Saving…",
        skip: "Skip for now",
        signInAgain: "Sign in",
        close: "Close",
      },
    }),
    [onboarding, requirePost]
  );
  const L = t[lang];

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [city, setCity] = useState<string>("");
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

      const existingPhone =
        (u.user_metadata?.phone as string | undefined) ||
        (u.user_metadata?.contact_phone as string | undefined) ||
        "";
      setPhone(String(existingPhone ?? "").trim());

      const existingCity =
        (u.user_metadata?.city as string | undefined) ||
        (u.user_metadata?.location as string | undefined) ||
        "";
      setCity(String(existingCity ?? "").trim());

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  function closeCard() {
    const target = redirectTo || `/dashboard?lang=${lang}`;
    router.replace(target);
  }

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

      const trimmedName = name.trim();
      if (!trimmedName) {
        setMsg(lang === "es" ? "Escribe tu nombre." : "Enter your name.");
        return;
      }

      if (requirePost) {
        const trimmedPhone = phone.trim();
        const trimmedCity = city.trim();
        if (trimmedPhone.length < 7) {
          setMsg(
            lang === "es"
              ? "El teléfono debe tener al menos 7 caracteres."
              : "Phone must be at least 7 characters."
          );
          return;
        }
        if (trimmedCity.length < 2) {
          setMsg(
            lang === "es"
              ? "Escribe tu ciudad."
              : "Enter your city."
          );
          return;
        }

        const { error: updErr } = await supabase.auth.updateUser({
          data: {
            full_name: trimmedName,
            phone: trimmedPhone,
            city: trimmedCity,
          },
        });
        if (updErr) throw updErr;

        try {
          await supabase.from("profiles").upsert({
            id: u.id,
            email: u.email,
            full_name: trimmedName,
            phone: trimmedPhone,
            city: trimmedCity,
            plan: "free",
            role: "free",
          } as Record<string, unknown>);
        } catch {
          // ignore if profiles table/columns aren't ready yet
        }

        if (redirectTo) router.replace(redirectTo);
        else router.replace(`/dashboard?lang=${lang}`);
        return;
      }

      const { error: updErr } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });
      if (updErr) throw updErr;

      try {
        await supabase.from("profiles").upsert({
          id: u.id,
          email: u.email,
          full_name: trimmedName,
          plan: "free",
          role: "free",
        } as Record<string, unknown>);
      } catch {
        // ignore
      }

      if (onboarding) {
        router.replace(`/dashboard?lang=${lang}`);
      } else if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.replace(`/dashboard?lang=${lang}`);
      }
    } catch (e: unknown) {
      setMsg((e as { message?: string })?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-3xl md:text-4xl font-semibold text-yellow-400">
          {L.title}
        </h1>
        <p className="mt-2 text-gray-300">{L.subtitle}</p>

        {onboarding && (
          <p className="mt-2 text-sm text-white/60">{L.signedInNote}</p>
        )}
        {requirePost && (
          <p className="mt-2 text-sm text-white/60">{L.postHelper}</p>
        )}

        <div className="mt-8 rounded-2xl border border-yellow-600/20 bg-black/40 p-6 relative">
          {showClose && (
            <button
              type="button"
              onClick={closeCard}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition"
              aria-label={L.close}
            >
              ×
            </button>
          )}

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
                  {onboarding || requirePost ? (
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

                {requirePost && (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="text-xs text-white/60">
                        {L.phone} <span className="text-yellow-400/90">*</span>
                      </div>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={lang === "es" ? "Ej: 555 123 4567" : "e.g. 555 123 4567"}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-yellow-500/60"
                        type="tel"
                      />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="text-xs text-white/60">
                        {L.city} <span className="text-yellow-400/90">*</span>
                      </div>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={lang === "es" ? "Ej: San José" : "e.g. San Jose"}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-yellow-500/60"
                      />
                    </div>
                  </>
                )}
              </div>

              {onboarding ? (
                <div className="mt-6">
                  <button
                    onClick={saveAndContinue}
                    disabled={saving}
                    className="w-full sm:w-auto rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold px-5 py-3 disabled:opacity-60"
                  >
                    {saving ? L.saving : L.save}
                  </button>
                </div>
              ) : requirePost ? (
                <div className="mt-6">
                  <button
                    onClick={saveAndContinue}
                    disabled={saving}
                    className="w-full sm:w-auto rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold px-5 py-3 disabled:opacity-60"
                  >
                    {saving ? L.saving : L.save}
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
