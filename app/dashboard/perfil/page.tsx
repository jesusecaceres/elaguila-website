"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Navbar from "../../components/Navbar";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";
import { CA_CITIES, CITY_ALIASES } from "../../data/locations/norcal";

type Lang = "es" | "en";

function safeInternalRedirect(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (v.startsWith("/")) return v;
  return "";
}

/** Normalize string for city lookup: trim, lower, remove accents, remove punctuation, collapse spaces */
function toCityKey(s: string): string {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Returns canonical city string or "" if invalid. Uses CA_CITIES + CITY_ALIASES. */
function normalizeCity(raw: string): string {
  const key = toCityKey(raw);
  if (!key) return "";

  const fromAlias = CITY_ALIASES[key];
  if (fromAlias) return fromAlias;

  for (const record of CA_CITIES) {
    if (toCityKey(record.city) === key) return record.city;
    if (record.aliases?.some((a) => toCityKey(a) === key)) return record.city;
  }
  return "";
}

/** Digits only from raw input */
function phoneDigits(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

/** Format as (###) ###-####, max 10 digits */
function formatPhoneInput(raw: string): string {
  const d = phoneDigits(raw).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
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
        titlePost: "Completa tu perfil para publicar",
        titleOnboarding: "Comienza tu perfil",
        titleNormal: "Perfil",
        subtitlePost: "Necesitamos tu teléfono y ciudad para que los compradores puedan contactarte.",
        subtitleOnboarding: "Tu cuenta ya está lista. Solo confirma tu nombre para empezar.",
        subtitleNormal: "Información básica de tu cuenta.",
        postHelper: "Esto es necesario para que compradores puedan contactarte.",
        back: "Volver a mi cuenta",
        name: "Nombre",
        email: "Correo",
        phone: "Teléfono",
        city: "Ciudad",
        save: "Guardar y continuar",
        saving: "Guardando…",
        close: "Cerrar",
        errName: "Escribe tu nombre.",
        errPhoneRequired: "El teléfono debe tener 10 dígitos.",
        errPhoneOptional: "Si escribes teléfono, debe tener 10 dígitos.",
        errCityRequired: "Elige una ciudad de la lista (California).",
        errCityOptional: "Si escribes ciudad, debe ser una de la lista (California).",
      },
      en: {
        titlePost: "Complete your profile to post",
        titleOnboarding: "Start your profile",
        titleNormal: "Profile",
        subtitlePost: "We need your phone and city so buyers can contact you.",
        subtitleOnboarding: "Your account is ready. Just confirm your name to get started.",
        subtitleNormal: "Basic account information.",
        postHelper: "This is required so buyers can contact you.",
        back: "Back to my account",
        name: "Name",
        email: "Email",
        phone: "Phone",
        city: "City",
        save: "Save and continue",
        saving: "Saving…",
        close: "Close",
        errName: "Enter your name.",
        errPhoneRequired: "Phone must have 10 digits.",
        errPhoneOptional: "If you enter a phone, it must have 10 digits.",
        errCityRequired: "Select a city from the list (California).",
        errCityOptional: "If you enter a city, it must be from the list (California).",
      },
    }),
    []
  );
  const L = t[lang];

  const title = requirePost ? L.titlePost : onboarding ? L.titleOnboarding : L.titleNormal;
  const subtitle = requirePost ? L.subtitlePost : onboarding ? L.subtitleOnboarding : L.subtitleNormal;

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
      setPhone(formatPhoneInput(existingPhone));

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
    if (requirePost) {
      router.replace(redirectTo || `/dashboard?lang=${lang}`);
      return;
    }
    if (onboarding) {
      router.replace(`/clasificados?lang=${lang}`);
      return;
    }
    router.replace(`/dashboard?lang=${lang}`);
  }

  function handleCityBlur() {
    const canonical = normalizeCity(city);
    if (canonical) setCity(canonical);
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
        setMsg(L.errName);
        setSaving(false);
        return;
      }

      const digits = phoneDigits(phone);
      const canonicalCity = normalizeCity(city);

      if (requirePost) {
        if (digits.length !== 10) {
          setMsg(L.errPhoneRequired);
          setSaving(false);
          return;
        }
        if (!canonicalCity) {
          setMsg(L.errCityRequired);
          setSaving(false);
          return;
        }

        const formattedPhone = formatPhoneInput(phone);

        const { error: updErr } = await supabase.auth.updateUser({
          data: {
            full_name: trimmedName,
            phone: formattedPhone,
            city: canonicalCity,
          },
        });
        if (updErr) throw updErr;

        try {
          await supabase.from("profiles").upsert({
            id: u.id,
            email: u.email ?? null,
            display_name: trimmedName,
            phone: formattedPhone,
            home_city: canonicalCity,
            account_type: "personal",
            membership_tier: "gratis",
          });
        } catch {
          // ignore
        }

        if (redirectTo) router.replace(redirectTo);
        else router.replace(`/clasificados/publicar?lang=${lang}`);
        return;
      }

      // Not requirePost: phone and city optional, but if provided must be valid
      if (digits.length > 0 && digits.length !== 10) {
        setMsg(L.errPhoneOptional);
        setSaving(false);
        return;
      }
      if (city.trim().length > 0 && !canonicalCity) {
        setMsg(L.errCityOptional);
        setSaving(false);
        return;
      }

      const formattedPhone = digits.length === 10 ? formatPhoneInput(phone) : "";
      const updateData: Record<string, string> = { full_name: trimmedName };
      if (formattedPhone) updateData.phone = formattedPhone;
      if (canonicalCity) updateData.city = canonicalCity;

      const { error: updErr } = await supabase.auth.updateUser({
        data: updateData,
      });
      if (updErr) throw updErr;

      try {
        await supabase.from("profiles").upsert({
          id: u.id,
          email: u.email ?? null,
          display_name: trimmedName,
          phone: formattedPhone || null,
          home_city: canonicalCity || null,
          account_type: "personal",
          membership_tier: "gratis",
        });
      } catch {
        // ignore
      }

      if (onboarding) {
        router.replace(`/clasificados?lang=${lang}`);
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
          {title}
        </h1>
        <p className="mt-2 text-gray-300">{subtitle}</p>

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
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === "es" ? "Tu nombre" : "Your name"}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-yellow-500/60"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-white/60">{L.email}</div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {email || "—"}
                  </div>
                </div>

                {(requirePost || !onboarding) && (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="text-xs text-white/60">
                        {L.phone}
                        {requirePost && <span className="text-yellow-400/90"> *</span>}
                      </div>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                        placeholder="(555) 123-4567"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-yellow-500/60"
                        type="tel"
                        inputMode="numeric"
                        maxLength={14}
                      />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="text-xs text-white/60">
                        {L.city}
                        {requirePost && <span className="text-yellow-400/90"> *</span>}
                      </div>
                      <input
                        list="norcal-city-list"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        onBlur={handleCityBlur}
                        placeholder={lang === "es" ? "Ej: San José" : "e.g. San Jose"}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-yellow-500/60"
                        autoComplete="off"
                      />
                      <datalist id="norcal-city-list">
                        {CA_CITIES.map((record) => (
                          <option key={record.city} value={record.city} />
                        ))}
                      </datalist>
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
                <>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={saveAndContinue}
                      disabled={saving}
                      className="w-full sm:w-auto rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold px-5 py-3 disabled:opacity-60"
                    >
                      {saving ? L.saving : L.save}
                    </button>
                    <Link
                      href={`/dashboard?lang=${lang}`}
                      className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                    >
                      {L.back}
                    </Link>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
