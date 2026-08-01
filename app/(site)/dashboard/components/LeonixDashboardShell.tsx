"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import newLogo from "../../../../public/logo.png";
import { fetchDashboardNavCounts } from "../lib/dashboardNavCounts";
import {
  DASHBOARD_INTERNAL_INBOX_READY,
  DASHBOARD_SAVED_LISTINGS_READY,
} from "../lib/dashboardProductTruth";

import {
  dashboardShellCopy,
  type Lang,
} from "../lib/dashboardI18n";

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
  /**
   * Gate I.4.4 — already-verified owner id from the calling page's own `supabase.auth.getUser()`
   * resolution. When provided, the shell trusts it for nav-count loading and skips its own
   * `getUser()` call entirely, removing one duplicate `auth/v1/user` request per page load
   * (confirmed by the Gate I.4A audit). Optional and purely additive: callers that don't pass it
   * (every dashboard page besides `mis-anuncios/page.tsx` as of this gate) keep the shell's
   * original self-resolving behavior, byte-for-byte unchanged. Never sourced from a URL param,
   * localStorage, or any other client-editable value — only ever the id a real
   * `supabase.auth.getUser()` call already returned to the caller.
   */
  ownerId = null,
  /**
   * Gate BCO-3R-B.6 — below `sm`, hides the big logo/"PANEL" branding hero block that sits above
   * the main grid, so a page with its own compact top-of-flow content (e.g. Business Identity
   * onboarding, which has its own progress header) doesn't stack a second large header beneath
   * the global site header. Desktop/tablet are unaffected — the hero always shows at `sm`+
   * regardless of this flag. Every other dashboard page keeps today's behavior (default false).
   */
  compact = false,
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
  ownerId?: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [navCounts, setNavCounts] = useState<{ messages: number | null; drafts: number | null; expiring: number | null }>({
    messages: null,
    drafts: null,
    expiring: null,
  });
  // Gate BCO-3R-B.5/B.6 — below `sm`, the account/nav panel is a real fixed drawer (backdrop,
  // scroll lock, focus trap) instead of sitting in normal document flow (the "sidebar leak"
  // defect) or expanding in-flow (the "feels like another page" defect). At `sm`+ the same panel
  // renders as the permanently-visible in-flow sidebar via responsive classes — desktop/tablet
  // behavior is unchanged from before Gate B.5.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileNavCloseButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavPanelRef = useRef<HTMLDivElement>(null);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    // Move focus into the drawer (its close button) and lock body scroll while open.
    mobileNavCloseButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMobileNav();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = mobileNavPanelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      mobileNavTriggerRef.current?.focus();
    };
  }, [mobileNavOpen, closeMobileNav]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const sb = createSupabaseBrowserClient();
        let resolvedOwnerId = ownerId;
        if (!resolvedOwnerId) {
          const {
            data: { user },
          } = await sb.auth.getUser();
          resolvedOwnerId = user?.id ?? null;
        }
        if (!resolvedOwnerId || cancelled) return;
        const c = await fetchDashboardNavCounts(sb, resolvedOwnerId);
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
  }, [ownerId]);

  const L = dashboardShellCopy(lang);

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
    // Gate BCO-3R-B.7 — `overflow-x-hidden` here is the *final* safety net (Phase 7), applied only
    // after the actual width-producing source is fixed below (the grid/aside min-w-0 gap). It is
    // safe for the fixed-position mobile drawer/backdrop: `position: fixed` escapes an ancestor's
    // `overflow` clipping unless that ancestor sets a transform/filter/contain, which this element
    // never does.
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden text-[color:var(--lx-text)]" style={PAGE_BG}>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <main
        className={cx(
          "relative mx-auto w-full px-4 pb-20 pt-24 sm:px-6 lg:px-8",
          workbench ? "max-w-[90rem]" : "max-w-7xl",
        )}
      >
        <div className={cx("mb-8 flex-col items-center text-center sm:mb-10 sm:flex", compact ? "hidden" : "flex")}>
          <Image
            src={newLogo}
            alt="Leonix"
            width={88}
            height={88}
            className="h-auto w-[min(88px,22vw)] drop-shadow-[0_6px_24px_rgba(42,36,22,0.12)]"
            priority
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--lx-muted)]">{L.dashboardLabel}</p>
        </div>

        {/*
          Gate BCO-3R-B.7 ROOT CAUSE — below `lg` this grid has no explicit `grid-template-columns`
          (only the `lg:grid-cols-[...]` override applies), so its implicit single-column track
          sizes to CSS Grid's default `min-width: auto` on the `<aside>` item below — i.e. the
          track can grow to the *unshrinkable* max-content width of the aside's own content (e.g.
          the trigger button's name/email `truncate` text, whose `white-space: nowrap` still
          counts toward max-content sizing even though it visually ellipsizes). `min-w-0` here and
          on the `<aside>` item breaks that: it lets both grid items shrink to the actual available
          width instead of forcing the whole grid — and therefore `<main>` and the page — wider
          than the viewport. This is the actual, root-level fix; everything else in this gate is a
          defensive layer on top of it.
        */}
        <div
          className={cx(
            "grid w-full min-w-0 max-w-full gap-6 sm:gap-8",
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
              // Gate BCO-3R-B.7 — `min-w-0` is the actual root-cause fix (see the grid comment
              // above): without it this grid item's default `min-width: auto` lets its content
              // (the trigger button's nowrap-truncated name/email) force the whole grid wider
              // than the viewport.
              "h-fit w-full min-w-0 max-w-full rounded-3xl shadow-[0_14px_44px_-16px_rgba(42,36,22,0.12)]",
              varioSidebar
                ? "border border-[#D6C7AD]/85 bg-[#FFFDF7]/95 ring-1 ring-[#C9A84A]/10"
                : "border border-[#D6C7AD]/85 bg-[#FFFDF7]/95 ring-1 ring-[#C9A84A]/10",
            )}
          >
            {/* Phone-only compact trigger (Gate BCO-3R-B.5/B.6) — opens the real drawer below. */}
            <button
              ref={mobileNavTriggerRef}
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-expanded={mobileNavOpen}
              aria-controls="dashboard-sidebar-panel"
              aria-label={mobileNavOpen ? L.closeAccountMenu : L.openAccountMenu}
              className="flex w-full items-center justify-between gap-2 p-4 text-left sm:hidden"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--lx-section)] text-sm font-bold text-[color:var(--lx-text)]">
                  {(userName?.trim()?.[0] ?? email?.trim()?.[0] ?? "?").toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[color:var(--lx-text)]">{userName?.trim() || email || "—"}</span>
                  <span className="block text-[11px] text-[color:var(--lx-muted)]">{L.accountStatus}</span>
                </span>
              </span>
              <span aria-hidden className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-[color:var(--lx-muted)]">
                <span className="text-base leading-none">{mobileNavOpen ? "×" : "☰"}</span>
                {mobileNavOpen ? L.menuClose : L.menuOpen}
              </span>
            </button>

            {/* Backdrop — mobile drawer only; dims and closes the page behind it. Never rendered
                at sm+ (the trigger that sets mobileNavOpen is itself sm:hidden, but this is a
                defensive belt-and-suspenders guard against the desktop layout ever showing it). */}
            {mobileNavOpen ? (
              <div className="fixed inset-0 z-[199] bg-black/50 sm:hidden" aria-hidden="true" onClick={closeMobileNav} />
            ) : null}

            {/*
              Single copy of the account card + nav + publish + sign-out (Gate BCO-3R-B.6 — "only
              one drawer DOM copy"). Below `sm` it is either `hidden` (closed) or a real `fixed`
              right-side drawer with its own backdrop/scroll-lock/focus-trap (open); at `sm`+ the
              `sm:*` overrides win regardless of `mobileNavOpen`, restoring the always-visible
              in-flow sidebar exactly as before Gate B.5.
            */}
            <div
              id="dashboard-sidebar-panel"
              ref={mobileNavPanelRef}
              role={mobileNavOpen ? "dialog" : undefined}
              aria-modal={mobileNavOpen ? true : undefined}
              aria-labelledby={mobileNavOpen ? "dashboard-account-drawer-title" : undefined}
              className={cx(
                mobileNavOpen
                  ? "fixed inset-y-0 right-0 z-[200] flex h-dvh w-[min(88vw,360px)] flex-col overflow-y-auto bg-[#FFFCF7] shadow-[-8px_0_32px_rgba(42,36,22,0.25)]"
                  : "hidden",
                "sm:static sm:z-auto sm:block sm:h-auto sm:w-auto sm:flex-none sm:overflow-visible sm:bg-transparent sm:shadow-none",
              )}
            >
              {mobileNavOpen ? (
                <div className="flex shrink-0 items-center justify-between border-b border-[#E8DFD0] px-4 py-3 sm:hidden">
                  <span id="dashboard-account-drawer-title" className="text-sm font-bold text-[#1E1810]">
                    {L.accountStatus}
                  </span>
                  <button
                    ref={mobileNavCloseButtonRef}
                    type="button"
                    onClick={closeMobileNav}
                    aria-label={L.closeAccountMenu}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-[#3D3428] hover:bg-[#FAF7F2]"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              ) : null}

              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{L.accountStatus}</span>
                  <span className="rounded-full border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--lx-muted)]">
                    {L.accountMetadata}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-section)]/80 p-4">
                  <p className="break-words text-[15px] font-bold text-[color:var(--lx-text)]">{userName?.trim() || "—"}</p>
                  <p className="mt-1 break-words text-xs text-[color:var(--lx-muted)]/95">{email || "—"}</p>
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
                      {L.accountType}: {accountType.trim()}
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
                  href={`/publicar?${q}`}
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
              </div>
            </div>
          </aside>

          {/* aria-hidden while the mobile drawer is open — background content stays visually
              covered by the backdrop, but screen-reader virtual-cursor navigation must not be
              able to reach it either (Gate BCO-3R-B.6). */}
          <div className={cx("w-full min-w-0 max-w-full", workbench && "max-w-none overflow-visible")} aria-hidden={mobileNavOpen || undefined}>
            {children}
          </div>

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
