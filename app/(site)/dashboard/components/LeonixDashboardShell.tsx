"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import ProBadge from "@/app/clasificados/components/ProBadge";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import newLogo from "../../../../public/logo.png";
import { fetchDashboardNavCounts } from "../lib/dashboardNavCounts";

type Lang = "es" | "en";
type Plan = "free" | "pro";

/** Primary dashboard sections (sidebar). */
export type LeonixDashboardActiveNav =
  | "home"
  | "listings"
  | "restaurantes"
  | "servicios"
  | "viajes"
  | "messages"
  | "drafts"
  | "saved"
  | "analytics"
  | "profile"
  | "notifications"
  | "business"
  | "recent";

/** @deprecated Use LeonixDashboardActiveNav */
type ActiveNav = LeonixDashboardActiveNav;

const PAGE_BG: CSSProperties = {
  backgroundColor: "#F3EBDD",
  backgroundImage: `
    radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.2), transparent 55%),
    radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.45), transparent 52%),
    radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.1), transparent 50%)
  `,
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function LeonixDashboardShell({
  lang,
  activeNav,
  plan,
  userName,
  email,
  accountRef,
  membershipTier,
  accountType,
  children,
  rightPanel,
}: {
  lang: Lang;
  activeNav: ActiveNav;
  plan: Plan;
  userName: string | null;
  email: string | null;
  accountRef: string | null;
  /** Raw `profiles.membership_tier` when available (sidebar context). */
  membershipTier?: string | null;
  /** Raw `profiles.account_type` when available. */
  accountType?: string | null;
  children: ReactNode;
  rightPanel?: ReactNode;
}) {
  const router = useRouter();
  const [navCounts, setNavCounts] = useState<{ messages: number | null; drafts: number | null; expiring: number | null }>({
    messages: null,
    drafts: null,
    expiring: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const sb = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!user || cancelled) return;
        const c = await fetchDashboardNavCounts(sb, user.id);
        if (cancelled) return;
        setNavCounts({
          messages: c.messageInbox,
          drafts: c.drafts,
          expiring: c.expiringSoon,
        });
      } catch {
        /* ignore */
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const L =
    lang === "es"
      ? {
          plan: "Plan",
          free: "Gratis",
          pro: "LEONIX Pro",
          home: "Resumen",
          profile: "Perfil y cuenta",
          listings: "Mis anuncios",
          restaurants: "Mis restaurantes",
          messages: "Mensajes",
          drafts: "Borradores",
          analytics: "Analíticas",
          notifications: "Notificaciones",
          businessTools: "Herramientas de negocio",
          saved: "Guardados",
          recent: "Vistos recientemente",
          servicios: "Servicios (prueba)",
          viajesStaged: "Viajes (revisión)",
          activity: "Mi actividad",
          publish: "Publicar anuncio",
          signOut: "Cerrar sesión",
          badgeInbox: "Consultas en bandeja",
          badgeDrafts: "Borradores sin publicar",
          badgeExpiring: "Visibilidad por expirar",
        }
      : {
          plan: "Plan",
          free: "Free",
          pro: "LEONIX Pro",
          home: "Overview",
          profile: "Profile & account",
          listings: "My ads",
          restaurants: "My restaurants",
          messages: "Messages",
          drafts: "Drafts",
          analytics: "Analytics",
          notifications: "Notifications",
          businessTools: "Business tools",
          saved: "Saved",
          recent: "Recently viewed",
          servicios: "Servicios (test)",
          viajesStaged: "Viajes (review)",
          activity: "Activity",
          publish: "Post an ad",
          signOut: "Sign out",
          badgeInbox: "Inquiries in inbox",
          badgeDrafts: "Unpublished drafts",
          badgeExpiring: "Visibility expiring soon",
        };

  const planLabel = plan === "pro" ? L.pro : L.free;
  const q = `lang=${lang}`;

  const signOut = useCallback(async () => {
    try {
      const sb = createSupabaseBrowserClient();
      await sb.auth.signOut();
    } catch {
      /* ignore */
    }
    router.push(`/login?redirect=${encodeURIComponent("/dashboard")}`);
    router.refresh();
  }, [router]);

  function badgePill(n: number | null | undefined, title: string) {
    if (n == null || n <= 0) return null;
    const text = n > 99 ? "99+" : String(n);
    return (
      <span
        title={title}
        className="ml-auto inline-flex min-w-[1.25rem] justify-center rounded-full bg-[#C9A84A]/25 px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums text-[#4A3F26]"
      >
        {text}
      </span>
    );
  }

  const navItem = (key: ActiveNav, href: string, label: string, badge?: number | null, badgeTitle?: string) => (
    <Link
      href={href}
      className={cx(
        "flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
        activeNav === key
          ? "bg-gradient-to-r from-[#FBF7EF] to-[#F3EBDD] text-[#1E1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#C9B46A]/35"
          : "text-[#3D3428]/90 hover:bg-[#FFFCF7]/80"
      )}
    >
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      {badge != null ? badgePill(badge, badgeTitle ?? "") : null}
    </Link>
  );

  return (
    <div className="relative min-h-screen text-[#2C2416]" style={PAGE_BG}>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <Image
            src={newLogo}
            alt="Leonix"
            width={88}
            height={88}
            className="h-auto w-[min(88px,22vw)] drop-shadow-[0_6px_24px_rgba(42,36,22,0.12)]"
            priority
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7A7164]">Dashboard</p>
        </div>

        <div
          className={cx(
            "grid gap-6 sm:gap-8 lg:gap-10",
            rightPanel
              ? "lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,280px)]"
              : "lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]"
          )}
        >
          <aside className="h-fit rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/90 p-4 shadow-[0_14px_44px_-16px_rgba(42,36,22,0.14)] sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{L.plan}</span>
              {plan === "pro" ? (
                <ProBadge />
              ) : (
                <span className="rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-2.5 py-1 text-[11px] font-bold text-[#5C5346]">
                  {planLabel}
                </span>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-[#E8DFD0]/80 bg-[#FAF7F2]/80 p-4">
              <p className="text-[15px] font-bold text-[#1E1810]">{userName?.trim() || "—"}</p>
              <p className="mt-1 text-xs text-[#5C5346]/95">{email || "—"}</p>
              {accountRef ? (
                <p className="mt-2 font-mono text-[10px] text-[#7A7164]/90">
                  #{accountRef}
                </p>
              ) : null}
              {membershipTier?.trim() ? (
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#7A7164]/90">
                  {membershipTier.trim()}
                </p>
              ) : null}
              {accountType?.trim() ? (
                <p className="mt-0.5 text-[10px] text-[#5C5346]/90">
                  {lang === "es" ? "Tipo" : "Type"}: {accountType.trim()}
                </p>
              ) : null}
            </div>

            <nav className="mt-5 space-y-1">
              {navItem("home", `/dashboard?${q}`, L.home)}
              {navItem("listings", `/dashboard/mis-anuncios?${q}`, L.listings, navCounts.expiring, L.badgeExpiring)}
              {navItem("restaurantes", `/dashboard/restaurantes?${q}`, L.restaurants)}
              {navItem("servicios", `/dashboard/servicios?${q}`, L.servicios)}
              {navItem("viajes", `/dashboard/viajes?${q}`, L.viajesStaged)}
              {navItem("messages", `/dashboard/mensajes?${q}`, L.messages, navCounts.messages, L.badgeInbox)}
              {navItem("drafts", `/dashboard/drafts?${q}`, L.drafts, navCounts.drafts, L.badgeDrafts)}
              {navItem("saved", `/dashboard/guardados?${q}`, L.saved)}
              {navItem("analytics", `/dashboard/analytics?${q}`, L.analytics)}
              {navItem("profile", `/dashboard/perfil?${q}`, L.profile)}
              {navItem("notifications", `/dashboard/notificaciones?${q}`, L.notifications)}
              {navItem("business", `/dashboard/business-tools?${q}`, L.businessTools)}
              <div className="pt-3">
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]/90">{L.activity}</p>
                {navItem("recent", `/dashboard/vistos-recientes?${q}`, L.recent)}
              </div>
            </nav>

            <Link
              href={`/clasificados/publicar?${q}`}
              className={cx(
                "mt-6 flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-[#1E1810]",
                "bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A]",
                "shadow-[0_8px_28px_-4px_rgba(201,164,74,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]",
                "transition hover:brightness-[1.03] active:scale-[0.99]"
              )}
            >
              {L.publish}
            </Link>

            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8DFD0] bg-transparent py-2.5 text-sm font-semibold text-[#5C5346] transition hover:bg-[#FFFCF7]"
            >
              <span aria-hidden className="text-lg leading-none">
                ⊖
              </span>
              {L.signOut}
            </button>
          </aside>

          <div className="min-w-0">{children}</div>

          {rightPanel ? (
            <div className="hidden min-w-0 2xl:block 2xl:pt-0" aria-hidden={false}>
              {rightPanel}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
