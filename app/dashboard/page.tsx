"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { LeonixDashboardShell } from "./components/LeonixDashboardShell";
import { supabase } from "../lib/supabaseClient";

type Lang = "es" | "en";
type Plan = "free" | "pro";

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

function parseIsoMaybe(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isFinite(d.getTime()) ? d : null;
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard";

  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Resumen de cuenta",
            subtitle: "Tu actividad y accesos rápidos en Leonix.",
            activeAds: "Anuncios activos",
            totalViews: "Vistas totales",
            totalSaves: "Guardados",
            earnings: "Ganado en total",
            earningsSoon: "Próximamente",
            quick: "Acciones rápidas",
            post: "Publicar anuncio",
            myAds: "Ver mis anuncios",
            browse: "Explorar clasificados",
            activity: "Actividad reciente",
            activityBody:
              "Gestiona todos tus anuncios, métricas y estado en un solo lugar. Los anuncios nuevos aparecen primero.",
            ctaManage: "Ir a gestión de anuncios",
            garage: "Modo Garaje (En Venta)",
            garageBody:
              "Si alcanzas el límite gratuito en En Venta, puedes desbloquear espacio extra por tiempo limitado.",
            enVentaActive: "Activos En Venta",
            upgrade: "Mejorar a Pro",
            proPitch: "Más fotos, video, visibilidad y analíticas por anuncio con Leonix Pro.",
            loading: "Cargando…",
            signIn: "Inicia sesión para ver tu panel.",
            login: "Iniciar sesión",
          }
        : {
            title: "Account overview",
            subtitle: "Your activity and quick access in Leonix.",
            activeAds: "Active listings",
            totalViews: "Total views",
            totalSaves: "Saves",
            earnings: "Total earned",
            earningsSoon: "Coming soon",
            quick: "Quick actions",
            post: "Post an ad",
            myAds: "My listings",
            browse: "Browse classifieds",
            activity: "Listing activity",
            activityBody:
              "Manage all your listings, metrics, and status in one place. Newest listings appear first.",
            ctaManage: "Go to listing management",
            garage: "Garage mode (For Sale)",
            garageBody:
              "If you hit the free For Sale limit, you can unlock extra slots for a limited time.",
            enVentaActive: "For Sale active",
            upgrade: "Upgrade to Pro",
            proPitch: "More photos, video, visibility, and per-listing analytics with Leonix Pro.",
            loading: "Loading…",
            signIn: "Sign in to view your dashboard.",
            login: "Sign in",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [activeListings, setActiveListings] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [totalSaves, setTotalSaves] = useState<number | null>(null);
  const [enVentaActiveCount, setEnVentaActiveCount] = useState<number | null>(null);
  const [garageActive, setGarageActive] = useState(false);
  const [garageExpiresAt, setGarageExpiresAt] = useState("");
  const [garageCooldownDaysLeft, setGarageCooldownDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!session?.user) {
          setHasSession(false);
          setLoading(false);
          return;
        }

        const u = session.user;
        setHasSession(true);
        setUserId(u.id);

        const inferredName =
          (u.user_metadata?.full_name as string | undefined) ||
          (u.user_metadata?.name as string | undefined) ||
          null;
        setEmail(u.email ?? null);
        setName(inferredName);
        setPlan("free");

        const gm = (u.user_metadata as Record<string, unknown>)?.garage_mode_en_venta || null;
        const gmObj = gm && typeof gm === "object" ? (gm as Record<string, unknown>) : null;
        const lastUsed = gmObj
          ? String(gmObj.lastUsedAt ?? gmObj.last_used_at ?? gmObj.last_used ?? "")
          : "";
        const expires = gmObj ? String(gmObj.expiresAt ?? gmObj.expires_at ?? gmObj.expires ?? "") : "";
        setGarageExpiresAt(expires);
        const expD = parseIsoMaybe(expires);
        setGarageActive(Boolean(expD && expD.getTime() > Date.now()));

        const lastD = parseIsoMaybe(lastUsed);
        if (lastD) {
          const left = Math.max(0, 30 - daysBetween(lastD, new Date()));
          setGarageCooldownDaysLeft(left);
        } else {
          setGarageCooldownDaysLeft(null);
        }

        try {
          await supabase.from("profiles").upsert(
            {
              id: u.id,
              email: (u.email ?? "").trim().toLowerCase() || null,
              display_name: (inferredName ?? "").trim() || null,
            },
            { onConflict: "id" }
          );
        } catch {
          /* ignore */
        }

        try {
          const { data: pData, error: pErr } = await supabase
            .from("profiles")
            .select("display_name, email, membership_tier")
            .eq("id", u.id)
            .maybeSingle();

          if (!pErr && pData) {
            const row = pData as {
              display_name?: string | null;
              email?: string | null;
              membership_tier?: string | null;
            };
            setName(row.display_name ?? inferredName);
            setEmail(row.email ?? u.email ?? null);
            setPlan(normalizePlanFromMembershipTier(row.membership_tier));
          }
        } catch {
          /* ignore */
        }

        let activeCt = 0;
        let vSum = 0;
        const ids: string[] = [];

        try {
          const { data: lst } = await supabase.from("listings").select("id, views, status").eq("owner_id", u.id);
          if (lst && Array.isArray(lst)) {
            for (const row of lst) {
              const r = row as { id?: string; views?: unknown; status?: string | null };
              if (r.id) ids.push(r.id);
              vSum += typeof r.views === "number" && Number.isFinite(r.views) ? r.views : 0;
              if (String(r.status ?? "active").toLowerCase() === "active") activeCt++;
            }
          }
          if (mounted) {
            setActiveListings(activeCt);
            setTotalViews(vSum);
          }
        } catch {
          if (mounted) {
            setActiveListings(null);
            setTotalViews(null);
          }
        }

        if (ids.length > 0) {
          try {
            const { count } = await supabase
              .from("listing_analytics")
              .select("id", { count: "exact", head: true })
              .in("listing_id", ids)
              .eq("event_type", "listing_save");
            if (mounted) setTotalSaves(typeof count === "number" ? count : 0);
          } catch {
            if (mounted) setTotalSaves(null);
          }
        } else if (mounted) {
          setTotalSaves(0);
        }

        try {
          const base = supabase.from("listings").select("id", { count: "exact", head: true }).eq("category", "en-venta");
          let r = await base.eq("owner_id", u.id).eq("status", "active");
          if (r.error) {
            const msg = String(r.error.message || "");
            if (/status/i.test(msg) && /(does not exist|unknown|column)/i.test(msg)) {
              r = await base.eq("owner_id", u.id);
            }
          }
          if (!r.error && mounted) setEnVentaActiveCount(typeof r.count === "number" ? r.count : 0);
          if (r.error && mounted) setEnVentaActiveCount(null);
        } catch {
          if (mounted) setEnVentaActiveCount(null);
        }

        if (mounted) setLoading(false);
      } catch {
        if (mounted) {
          setLoading(false);
          setHasSession(false);
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const accountRef = userId ? accountRefFromId(userId) : null;

  const fmtNum = (n: number | null) =>
    n == null ? "—" : new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US").format(n);

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="home"
      plan={plan}
      userName={name}
      email={email}
      accountRef={accountRef}
    >
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">
          {t.loading}
        </div>
      ) : !hasSession ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center">
          <p className="text-[#3D3428]">{t.signIn}</p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`)}`}
            className="mt-5 inline-flex rounded-2xl bg-[#2A2620] px-6 py-2.5 text-sm font-semibold text-[#FAF7F2] shadow-md hover:bg-[#1a1814]"
          >
            {t.login}
          </Link>
        </div>
      ) : (
        <>
          <header className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)] sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]/95">{t.subtitle}</p>
          </header>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: t.activeAds, value: fmtNum(activeListings), icon: "📣" },
              { label: t.totalViews, value: fmtNum(totalViews), icon: "👁" },
              { label: t.totalSaves, value: fmtNum(totalSaves), icon: "★" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF7F2] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{c.label}</p>
                  <span className="text-lg opacity-80" aria-hidden>
                    {c.icon}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums text-[#1E1810]">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-3xl border border-dashed border-[#C9B46A]/40 bg-[#FBF7EF]/50 p-4 text-center text-xs text-[#7A7164]">
            {t.earnings}: <span className="font-semibold text-[#5C5346]">{t.earningsSoon}</span>
          </div>

          <div className="mt-8 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-inner">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.quick}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/clasificados/publicar?${q}`}
                className="inline-flex rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
              >
                {t.post}
              </Link>
              <Link
                href={`/dashboard/mis-anuncios?${q}`}
                className="inline-flex rounded-2xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
              >
                {t.myAds}
              </Link>
              <Link
                href={`/clasificados?${q}`}
                className="inline-flex rounded-2xl border border-transparent px-5 py-2.5 text-sm font-semibold text-[#5C5346] hover:text-[#1E1810]"
              >
                {t.browse}
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.1)]">
              <h2 className="text-lg font-bold text-[#1E1810]">{t.activity}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.activityBody}</p>
              <Link
                href={`/dashboard/mis-anuncios?${q}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#2A2620] underline decoration-[#C9B46A]/60 underline-offset-4 hover:decoration-[#C9B46A]"
              >
                {t.ctaManage} →
              </Link>
            </div>

            {plan === "free" ? (
              <div className="rounded-3xl border border-[#C9B46A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_12px_36px_-12px_rgba(201,164,74,0.2)]">
                <h2 className="text-lg font-bold text-[#1E1810]">Leonix Pro</h2>
                <p className="mt-2 text-sm text-[#5C5346]/95">{t.proPitch}</p>
                <Link
                  href={`/clasificados/publicar?${q}`}
                  className="mt-4 inline-flex rounded-2xl bg-[#2A2620] px-4 py-2 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                >
                  {t.upgrade}
                </Link>
              </div>
            ) : null}
          </div>

          {plan === "free" ? (
            <div className="mt-8 rounded-3xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-6">
              <h3 className="text-base font-bold text-[#1E1810]">{t.garage}</h3>
              <p className="mt-2 text-sm text-[#5C5346]/95">{t.garageBody}</p>
              <p className="mt-3 text-sm font-semibold text-[#3D3428]">
                {typeof enVentaActiveCount === "number"
                  ? `${t.enVentaActive}: ${enVentaActiveCount} / ${2 + (garageActive ? 4 : 0)}`
                  : `${t.enVentaActive}: —`}
              </p>
              {garageActive && garageExpiresAt ? (
                <p className="mt-1 text-xs text-emerald-800/90">
                  {lang === "es" ? "Activo hasta " : "Active until "}
                  {new Date(garageExpiresAt).toLocaleDateString(lang === "es" ? "es-MX" : "en-US")}
                </p>
              ) : null}
              {!garageActive && typeof garageCooldownDaysLeft === "number" && garageCooldownDaysLeft > 0 ? (
                <p className="mt-1 text-xs text-[#7A7164]">
                  {lang === "es"
                    ? `Disponible de nuevo en ${garageCooldownDaysLeft} día(s)`
                    : `Available again in ${garageCooldownDaysLeft} day(s)`}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/clasificados/publicar?${q}&categoria=en-venta`}
                  className="inline-flex rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
                >
                  {lang === "es" ? "Publicar en En Venta" : "Post in For Sale"}
                </Link>
              </div>
            </div>
          ) : null}
        </>
      )}
    </LeonixDashboardShell>
  );
}
