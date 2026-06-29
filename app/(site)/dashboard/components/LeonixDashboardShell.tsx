"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import newLogo from "../../../../public/logo.png";
import { fetchDashboardNavCounts } from "../lib/dashboardNavCounts";
import {
  DASHBOARD_INTERNAL_INBOX_READY,
  DASHBOARD_SAVED_LISTINGS_READY,
} from "../lib/dashboardProductTruth";

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
  | "security"
  | "notifications"
  | "business"
  | "recent";

/** @deprecated Use LeonixDashboardActiveNav */
type ActiveNav = LeonixDashboardActiveNav;

const PAGE_BG: CSSProperties = {
  backgroundColor: "var(--lx-page)",
  backgroundImage: `
    radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 120, 47, 0.07), transparent 55%),
    radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.40), transparent 52%),
    radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 120, 47, 0.04), transparent 50%)
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
  /** Optional Leonix Varios accent for seller listing workspace (detail page only). */
  sidebarTone = "default",
  /** Wider main canvas for seller listing workbench (Mis anuncios). */
  contentLayout = "default",
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
  sidebarTone?: "default" | "varios";
  contentLayout?: "default" | "workbench";
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
          accountStatus: "Account status",
          accountMetadata: "Account",
          home: "Overview",
          profile: "Profile & account",
          security: "Security",
          listings: "My listings",
          restaurants: "My restaurants",
          messages: "Messages",
          drafts: "Drafts",
          analytics: "Account analytics",
          notifications: "Notifications",
          businessTools: "Business tools",
          saved: "Saved",
          recent: "Recently viewed",
          servicios: "Servicios (test)",
          viajesStaged: "Viajes (review)",
          activity: "Activity",
          publish: "Publish listing",
          signOut: "Sign out",
          badgeInbox: "Inquiries in inbox",
          badgeDrafts: "Unpublished drafts",
          badgeExpiring: "Visibility expiring soon",
        }
      : {
          accountStatus: "Account status",
          accountMetadata: "Account",
          home: "Overview",
          profile: "Profile & account",
          security: "Security",
          listings: "My listings",
          restaurants: "My restaurants",
          messages: "Messages",
          drafts: "Drafts",
          analytics: "Account analytics",
          notifications: "Notifications",
          businessTools: "Business tools",
          saved: "Saved",
          recent: "Recently viewed",
          servicios: "Servicios (test)",
          viajesStaged: "Viajes (review)",
          activity: "Activity",
          publish: "Publish listing",
          signOut: "Sign out",
          badgeInbox: "Inquiries in inbox",
          badgeDrafts: "Unpublished drafts",
          badgeExpiring: "Visibility expiring soon",
        };

  // `plan` is kept for backwards compatibility with existing dashboard pages, but the shell must not
  // present profile membership as an account-wide ad/listing capability. Listing plans live on rows.
  void plan;
  const q = `lang=${lang}`;
  const varioSidebar = sidebarTone === "varios";

  const signOut = useCallback(async () => {
    try {
      const sb = createSupabaseBrowserClient();
      await sb.auth.signOut();
    } catch {
      /* ignore */
    }
    router.push(`/login?lang=${lang}&redirect=${encodeURIComponent(`/dashboard?${q}`)}`);
    router.refresh();
  }, [router, lang, q]);

  function badgePill(n: number | null | undefined, title: string) {
    if (n == null || n <= 0) return null;
    const text = n > 99 ? "99+" : String(n);
    return (
      <span
        title={title}
        className="ml-auto inline-flex min-w-[1.25rem] justify-center rounded-full bg-[color:var(--lx-lion)]/20 px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums text-[color:var(--lx-text-2)]"
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
          ? varioSidebar
            ? "bg-[#FBF7EF] text-[#1F241C] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#C9A84A]/35"
            : "bg-[#FBF7EF] text-[#1F241C] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#C9A84A]/35"
          : varioSidebar
            ? "text-[#5C5346] hover:bg-[#FBF7EF]/80"
            : "text-[#5C5346] hover:bg-[#FBF7EF]/80",
      )}
    >
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      {badge != null ? badgePill(badge, badgeTitle ?? "") : null}
    </Link>
  );

  const workbench = contentLayout === "workbench";

  return (
    <div className="relative min-h-screen text-[color:var(--lx-text)]" style={PAGE_BG}>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <main
        className={cx(
          "relative mx-auto px-4 pb-20 pt-24 sm:px-6 lg:px-8",
          workbench ? "max-w-[90rem]" : "max-w-7xl",
        )}
      >
        <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <Image
            src={newLogo}
            alt="Leonix"
            width={88}
            height={88}
            className="h-auto w-[min(88px,22vw)] drop-shadow-[0_6px_24px_rgba(42,36,22,0.12)]"
            priority
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--lx-muted)]">Dashboard</p>
        </div>

        <div
          className={cx(
            "grid gap-6 sm:gap-8",
            workbench ? "lg:gap-6 xl:gap-8" : "lg:gap-10",
            rightPanel
              ? workbench
                ? "lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,280px)]"
                : "lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,280px)]"
              : workbench
                ? "lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]"
                : "lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]",
          )}
        >
          <aside
            className={cx(
              "h-fit rounded-3xl p-4 shadow-[0_14px_44px_-16px_rgba(42,36,22,0.12)] sm:p-5",
              varioSidebar
                ? "border border-[#D6C7AD]/85 bg-[#FFFDF7]/95 ring-1 ring-[#C9A84A]/10"
                : "border border-[#D6C7AD]/85 bg-[#FFFDF7]/95 ring-1 ring-[#C9A84A]/10",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{L.accountStatus}</span>
              <span className="rounded-full border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--lx-muted)]">
                {L.accountMetadata}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-section)]/80 p-4">
              <p className="text-[15px] font-bold text-[color:var(--lx-text)]">{userName?.trim() || "—"}</p>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]/95">{email || "—"}</p>
              {accountRef ? (
                <p className="mt-2 font-mono text-[10px] text-[color:var(--lx-muted)]/90">
                  #{accountRef}
                </p>
              ) : null}
              {membershipTier?.trim() ? (
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[color:var(--lx-muted)]/90">
                  {membershipTier.trim()}
                </p>
              ) : null}
              {accountType?.trim() ? (
                <p className="mt-0.5 text-[10px] text-[color:var(--lx-muted)]/90">
                  {lang === "es" ? "Tipo" : "Type"}: {accountType.trim()}
                </p>
              ) : null}
            </div>

            <nav className="mt-5 space-y-1">
              {navItem("home", `/dashboard?${q}`, L.home)}
              {navItem("listings", `/dashboard/mis-anuncios?${q}`, L.listings, navCounts.expiring, L.badgeExpiring)}
              {DASHBOARD_INTERNAL_INBOX_READY
                ? navItem("messages", `/dashboard/mensajes?${q}`, L.messages, navCounts.messages, L.badgeInbox)
                : null}
              {navItem("drafts", `/dashboard/drafts?${q}`, L.drafts, navCounts.drafts, L.badgeDrafts)}
              {DASHBOARD_SAVED_LISTINGS_READY ? navItem("saved", `/dashboard/guardados?${q}`, L.saved) : null}
              {navItem("analytics", `/dashboard/analytics?${q}`, L.analytics)}
              {navItem("profile", `/dashboard/perfil?${q}`, L.profile)}
              {navItem("security", `/dashboard/seguridad?${q}`, L.security)}
              {navItem("notifications", `/dashboard/notificaciones?${q}`, L.notifications)}
              {navItem("business", `/dashboard/business-tools?${q}`, L.businessTools)}
              <div className="pt-3">
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]/90">{L.activity}</p>
                {navItem("recent", `/dashboard/vistos-recientes?${q}`, L.recent)}
              </div>
            </nav>

            <Link
              href={`/clasificados/publicar?${q}`}
              className="mt-6 flex w-full items-center justify-center rounded-2xl border border-[#7A1E2C]/15 bg-[#7A1E2C] px-4 py-3 text-sm font-semibold text-[#FFFCF7] shadow-[0_8px_20px_-6px_rgba(122,30,44,0.35)] transition hover:bg-[#5e1721] active:scale-[0.99]"
            >
              {L.publish}
            </Link>

            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#D6C7AD]/70 bg-transparent py-2.5 text-sm font-semibold text-[#5C5346] transition hover:bg-[#FBF7EF]"
            >
              <span aria-hidden className="text-lg leading-none">
                ⊖
              </span>
              {L.signOut}
            </button>
          </aside>

          <div className={cx("min-w-0", workbench && "w-full max-w-none overflow-visible")}>{children}</div>

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
