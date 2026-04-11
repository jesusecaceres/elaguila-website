"use client";

/** Derived alerts from listings, messages, and profile — prefs stay local until a notifications/preferences table exists. */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import type { Lang } from "../lib/listingDisplayStatus";
import { fetchDerivedDashboardFeed, type DerivedFeedItem } from "../lib/derivedDashboardFeed";

type Plan = "free" | "pro";

const PREFS_KEY = "leonix_dashboard_notification_prefs_v1";

type Prefs = {
  email: boolean;
  push: boolean;
  weeklyDigest: boolean;
  instantMessages: boolean;
  expirationReminders: boolean;
};

const defaultPrefs: Prefs = {
  email: true,
  push: false,
  weeklyDigest: true,
  instantMessages: true,
  expirationReminders: true,
};

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    const j = JSON.parse(raw) as Partial<Prefs>;
    return { ...defaultPrefs, ...j };
  } catch {
    return defaultPrefs;
  }
}

function savePrefs(p: Prefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (v === "pro" || v === "business_lite" || v === "business_premium") return "pro";
  return "free";
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/80 px-4 py-3">
      <span className="text-sm font-medium text-[#2C2416]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#C9A84A]" : "bg-[#D8D0C4]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "left-[26px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export default function NotificacionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/notificaciones";
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Notificaciones",
            subtitle: "Mantente al día con mensajes, moderación y recordatorios.",
            feed: "Avisos derivados",
            placeholder:
              "Generado desde tus anuncios, bandeja y perfil. Un feed persistido llegará cuando exista tabla de notificaciones.",
            prefs: "Preferencias",
            email: "Correo electrónico",
            push: "Navegador / push",
            digest: "Resumen semanal",
            instant: "Mensajes instantáneos",
            exp: "Recordatorios de expiración",
            loading: "Cargando…",
            emptyFeed: "No hay avisos prioritarios ahora.",
          }
        : {
            title: "Notifications",
            subtitle: "Stay on top of messages, moderation, and reminders.",
            feed: "Derived alerts",
            placeholder:
              "Built from your listings, inbox, and profile. A persisted feed will ship with a notifications table.",
            prefs: "Preferences",
            email: "Email",
            push: "Browser / push",
            digest: "Weekly digest",
            instant: "Instant messages",
            exp: "Expiration reminders",
            loading: "Loading…",
            emptyFeed: "No priority alerts right now.",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [feedItems, setFeedItems] = useState<DerivedFeedItem[]>([]);

  const applyPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let mounted = true;
    async function run() {
      const { data } = await sb.auth.getUser();
      if (!mounted) return;
      if (!data.user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      const u = data.user;
      setUserId(u.id);
      setEmail(u.email ?? null);
      setName(
        (u.user_metadata?.full_name as string | undefined) ||
          (u.user_metadata?.name as string | undefined) ||
          null
      );
      try {
        const { data: p } = await sb.from("profiles").select("display_name, email, membership_tier").eq("id", u.id).maybeSingle();
        const row = p as { display_name?: string | null; email?: string | null; membership_tier?: string | null } | null;
        if (row?.display_name?.trim()) setName(row.display_name.trim());
        if (row?.email?.trim()) setEmail(row.email.trim());
        setPlan(normalizePlanFromMembershipTier(row?.membership_tier));
      } catch {
        /* ignore */
      }
      try {
        const items = await fetchDerivedDashboardFeed(sb, u.id, lang);
        setFeedItems(items);
      } catch {
        setFeedItems([]);
      }
      setLoading(false);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname, lang]);

  const accountRef = userId ? accountRefFromId(userId) : null;

  return (
    <LeonixDashboardShell lang={lang} activeNav="notifications" plan={plan} userName={name} email={email} accountRef={accountRef}>
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-6">
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
              <p className="mt-2 text-sm text-[#5C5346]/95">{t.subtitle}</p>
            </header>

            <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.1)]">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.feed}</h2>
              <p className="mt-2 text-sm text-[#5C5346]/95">{t.placeholder}</p>
              {feedItems.length === 0 ? (
                <p className="mt-4 text-sm font-medium text-[#3D3428]/90">{t.emptyFeed}</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {feedItems.map((it) => (
                    <li key={it.id}>
                      <Link
                        href={it.href}
                        className="flex items-start gap-3 rounded-2xl border border-[#E8DFD0]/70 bg-[#FAF7F2]/80 px-4 py-3 text-sm text-[#2C2416] transition hover:border-[#C9B46A]/45"
                      >
                        <span className="mt-0.5 text-[#C9A84A]" aria-hidden>
                          ✦
                        </span>
                        <span className="min-w-0">
                          <span className="font-semibold text-[#1E1810]">{it.title}</span>
                          {it.detail ? <span className="mt-0.5 block text-xs text-[#5C5346]/95">{it.detail}</span> : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="w-full shrink-0 lg:max-w-sm">
            <div className="rounded-3xl border border-[#C9B46A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_12px_36px_-12px_rgba(201,164,74,0.2)]">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#6B5B2E]">{t.prefs}</h2>
              <p className="mt-1 text-[11px] text-[#7A7164]/95">
                {lang === "es" ? "Solo en este navegador — migrable a Supabase después." : "This browser only — migrates to Supabase later."}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Toggle checked={prefs.email} onChange={(v) => applyPrefs({ ...prefs, email: v })} label={t.email} />
                <Toggle checked={prefs.push} onChange={(v) => applyPrefs({ ...prefs, push: v })} label={t.push} />
                <Toggle checked={prefs.weeklyDigest} onChange={(v) => applyPrefs({ ...prefs, weeklyDigest: v })} label={t.digest} />
                <Toggle checked={prefs.instantMessages} onChange={(v) => applyPrefs({ ...prefs, instantMessages: v })} label={t.instant} />
                <Toggle checked={prefs.expirationReminders} onChange={(v) => applyPrefs({ ...prefs, expirationReminders: v })} label={t.exp} />
              </div>
              <Link href={`/dashboard/perfil?${q}`} className="mt-5 inline-flex text-sm font-bold text-[#2A2620] underline decoration-[#C9B46A]/50">
                {lang === "es" ? "Perfil y cuenta →" : "Profile & account →"}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </LeonixDashboardShell>
  );
}
