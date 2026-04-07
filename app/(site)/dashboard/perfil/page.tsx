"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import CityAutocomplete from "../../../components/CityAutocomplete";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";
import { getCanonicalCityName } from "../../../data/locations/californiaLocationHelpers";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";

type Lang = "es" | "en";
type Plan = "free" | "pro";

function safeInternalRedirect(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (v.startsWith("/")) return v;
  return "";
}

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  const first = s.slice(0, 4).toUpperCase();
  const last = s.slice(-4).toUpperCase();
  return `${first}-${last}`;
}

function phoneDigits(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

function formatPhoneInput(raw: string): string {
  const d = phoneDigits(raw).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (v === "pro" || v === "business_lite" || v === "business_premium") return "pro";
  return "free";
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/perfil";

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";
  const q = `lang=${lang}`;

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
        back: "Volver al resumen",
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
        accountRef: "Cuenta #",
        loading: "Cargando…",
      },
      en: {
        titlePost: "Complete your profile to post",
        titleOnboarding: "Start your profile",
        titleNormal: "Profile",
        subtitlePost: "We need your phone and city so buyers can contact you.",
        subtitleOnboarding: "Your account is ready. Just confirm your name to get started.",
        subtitleNormal: "Basic account information.",
        postHelper: "This is required so buyers can contact you.",
        back: "Back to overview",
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
        accountRef: "Account #",
        loading: "Loading…",
      },
    }),
    []
  );
  const L = t[lang];

  const title = requirePost ? L.titlePost : onboarding ? L.titleOnboarding : L.titleNormal;
  const subtitle = requirePost ? L.subtitlePost : onboarding ? L.subtitleOnboarding : L.subtitleNormal;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [shellName, setShellName] = useState<string | null>(null);
  const [accountPlan, setAccountPlan] = useState<Plan>("free");
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
      setUserId(u.id);
      setEmail(u.email ?? null);

      const existingName =
        (u.user_metadata?.full_name as string | undefined) ||
        (u.user_metadata?.name as string | undefined) ||
        "";
      setName(existingName);
      setShellName(existingName.trim() || null);

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

      try {
        const { data: pData } = await supabase
          .from("profiles")
          .select("display_name, email, membership_tier")
          .eq("id", u.id)
          .maybeSingle();
        if (pData && mounted) {
          const row = pData as {
            display_name?: string | null;
            email?: string | null;
            membership_tier?: string | null;
          };
          const dn = row.display_name?.trim();
          if (dn) {
            setShellName(dn);
            setName((n) => (n.trim() ? n : dn));
          }
          if (row.email?.trim()) setEmail(row.email.trim());
          setAccountPlan(normalizePlanFromMembershipTier(row.membership_tier));
        }
      } catch {
        /* ignore */
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  function closeCard() {
    if (requirePost) {
      router.replace(redirectTo || `/dashboard?${q}`);
      return;
    }
    if (onboarding) {
      router.replace(`/clasificados?${q}`);
      return;
    }
    router.replace(`/dashboard?${q}`);
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
      const canonicalCity = getCanonicalCityName(city);

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
        const profileEmailRaw = (u.email ?? "").trim().toLowerCase();
        const profileEmail = profileEmailRaw === "" ? null : profileEmailRaw;

        const { error: updErr } = await supabase.auth.updateUser({
          data: {
            full_name: trimmedName,
            phone: formattedPhone,
            city: canonicalCity,
          },
        });
        if (updErr) throw updErr;

        try {
          await supabase.from("profiles").upsert(
            {
              id: u.id,
              email: profileEmail,
              display_name: trimmedName,
              phone: formattedPhone,
              home_city: canonicalCity,
            },
            { onConflict: "id" }
          );
        } catch {
          // ignore
        }

        if (redirectTo) router.replace(redirectTo);
        else router.replace(`/clasificados/publicar?${q}`);
        return;
      }

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
      const profilePhone = formattedPhone || null;
      const profileCity = canonicalCity || null;
      const profileEmailRaw = (u.email ?? "").trim().toLowerCase();
      const profileEmail = profileEmailRaw === "" ? null : profileEmailRaw;

      const updateData: Record<string, string> = { full_name: trimmedName };
      if (formattedPhone) updateData.phone = formattedPhone;
      if (canonicalCity) updateData.city = canonicalCity;

      const { error: updErr } = await supabase.auth.updateUser({
        data: updateData,
      });
      if (updErr) throw updErr;

      try {
        await supabase.from("profiles").upsert(
          {
            id: u.id,
            email: profileEmail,
            display_name: trimmedName,
            phone: profilePhone,
            home_city: profileCity,
          },
          { onConflict: "id" }
        );
      } catch {
        // ignore
      }

      if (onboarding) {
        router.replace(`/clasificados?${q}`);
      } else {
        router.replace(`/dashboard?${q}`);
      }
    } catch (e: unknown) {
      setMsg((e as { message?: string })?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  const accountRef = userId ? accountRefFromId(userId) : null;

  const primaryBtn =
    "w-full sm:w-auto rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-3 text-sm font-bold text-[#1E1810] shadow-md transition hover:brightness-[1.03] disabled:opacity-60";

  const secondaryLink =
    "inline-flex items-center rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-2.5 text-sm font-semibold text-[#3D3428] transition hover:bg-[#FAF7F2]";

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="profile"
      plan={accountPlan}
      userName={shellName}
      email={email}
      accountRef={accountRef}
    >
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">
          {L.loading}
        </div>
      ) : (
        <>
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-[#5C5346]/95">{subtitle}</p>
            {userId ? (
              <p className="mt-1 font-mono text-[11px] text-[#7A7164]">
                {L.accountRef} {accountRefFromId(userId)}
              </p>
            ) : null}
            {requirePost ? <p className="mt-2 text-sm font-medium text-[#6B5B2E]">{L.postHelper}</p> : null}
          </header>

          <div className="relative mt-8 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_14px_44px_-16px_rgba(42,36,22,0.12)] sm:p-7">
            {showClose ? (
              <button
                type="button"
                onClick={closeCard}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#E8DFD0] bg-[#FAF7F2] text-lg font-bold text-[#5C5346] transition hover:bg-[#F3EBDD]"
                aria-label={L.close}
              >
                ×
              </button>
            ) : null}

            {msg ? (
              <div className="mb-4 rounded-2xl border border-red-200/80 bg-red-50/90 p-4 text-sm font-medium text-red-900">
                {msg}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#E8DFD0]/90 bg-white/80 p-5">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{L.name}</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === "es" ? "Tu nombre" : "Your name"}
                  className="mt-2 w-full rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-3 text-sm text-[#1E1810] outline-none placeholder:text-[#7A7164]/60 focus:border-[#C9B46A]/70"
                />
              </div>

              <div className="rounded-2xl border border-[#E8DFD0]/90 bg-white/80 p-5">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{L.email}</div>
                <div className="mt-2 text-base font-semibold text-[#1E1810]">{email || "—"}</div>
              </div>

              {(requirePost || !onboarding) && (
                <>
                  <div className="rounded-2xl border border-[#E8DFD0]/90 bg-white/80 p-5">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
                      {L.phone}
                      {requirePost ? <span className="text-[#A67C00]"> *</span> : null}
                    </div>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                      placeholder="(555) 123-4567"
                      className="mt-2 w-full rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-3 text-sm text-[#1E1810] outline-none placeholder:text-[#7A7164]/60 focus:border-[#C9B46A]/70"
                      type="tel"
                      inputMode="numeric"
                      maxLength={14}
                    />
                  </div>
                  <div className="rounded-2xl border border-[#E8DFD0]/90 bg-white/80 p-5">
                    <CityAutocomplete
                      value={city}
                      onChange={setCity}
                      placeholder={lang === "es" ? "Ej: San José" : "e.g. San Jose"}
                      lang={lang}
                      label={L.city}
                      required={requirePost}
                      variant="light"
                      onSelect={() => setMsg(null)}
                    />
                  </div>
                </>
              )}
            </div>

            {onboarding ? (
              <div className="mt-6">
                <button type="button" onClick={() => void saveAndContinue()} disabled={saving} className={primaryBtn}>
                  {saving ? L.saving : L.save}
                </button>
              </div>
            ) : requirePost ? (
              <div className="mt-6">
                <button type="button" onClick={() => void saveAndContinue()} disabled={saving} className={primaryBtn}>
                  {saving ? L.saving : L.save}
                </button>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => void saveAndContinue()} disabled={saving} className={primaryBtn}>
                  {saving ? L.saving : L.save}
                </button>
                <Link href={`/dashboard?${q}`} className={secondaryLink}>
                  {L.back}
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </LeonixDashboardShell>
  );
}
