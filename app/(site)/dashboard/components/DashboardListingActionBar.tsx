"use client";

import Link from "next/link";

export type ActionItem = {
  href?: string;
  label: string;
  /**
   * Gate 2C — semantic tone, not decoration. "primary" = the one owner doorway;
   * "secondary"/"subtle" = view-tier actions; "positive"/"warning"/"danger" = lifecycle
   * actions carrying the Package 1 brand's status meaning (resume=green, pause=amber,
   * archive/destructive=red — never used for anything else); "premium" = specialized/
   * add-on tools (inventory, coupons, offers) in the gold role. Adding a tone here is a
   * presentation choice only — it never changes which action exists or where it goes.
   */
  tone?: "primary" | "secondary" | "subtle" | "positive" | "warning" | "danger" | "premium";
  onClick?: () => void;
  disabled?: boolean;
};

// Gate 2C — color-only fragments (border/bg/text/hover), matching the same colors as
// the Package 1 LX_DASH.btnPositive/btnWarning/btnDanger/btnPremium tokens, but without
// their full layout classes (size/padding/font-size) — this component already supplies
// those on the shared wrapper below, so reusing the full LX_DASH strings here would
// duplicate/conflict with it (e.g. text-xs vs the wrapper's text-sm).
function actionClass(tone: ActionItem["tone"]): string {
  if (tone === "primary") {
    return "border-transparent bg-[color:var(--lx-cta-primary-bg)] text-[color:var(--lx-cta-primary-fg)] hover:opacity-90";
  }
  if (tone === "positive") {
    return "border-[#2A4536]/25 bg-[#2A4536] text-[#F8F4EA] hover:bg-[#1F3327]";
  }
  if (tone === "warning") {
    return "border-amber-300/70 bg-amber-50 text-amber-900 hover:border-amber-400 hover:bg-amber-100";
  }
  if (tone === "danger") {
    return "border-red-300/70 bg-red-50 text-red-800 hover:border-red-400 hover:bg-red-100";
  }
  if (tone === "premium") {
    return "border-[#C9A84A]/70 bg-gradient-to-br from-[#FBF7EF] to-[#F3EBDD] text-[#5C4A16] hover:border-[#C9A84A]";
  }
  if (tone === "subtle") {
    return "border-[color:var(--lx-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)]";
  }
  return "border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text)]";
}

export function DashboardListingActionBar({ actions }: { actions: ActionItem[] }) {
  return (
    <div className="flex min-w-0 max-w-full flex-wrap gap-2">
      {actions.map((action) =>
        action.href ? (
          <Link
            key={`${action.label}-${action.href}`}
            href={action.href}
            // Gate I.4.4 — these links scale with listing count x actions per listing (a busy
            // dashboard can render dozens to hundreds of them); most are low-probability clicks,
            // so automatic Next.js viewport prefetch here was confirmed a real contributor to
            // background RSC request volume (Gate I.4A). Click navigation is unaffected —
            // `prefetch={false}` only disables the automatic viewport-triggered fetch.
            prefetch={false}
            className={`inline-flex min-h-[40px] max-w-full min-w-0 items-center justify-center rounded-xl border px-4 py-2 text-center text-sm font-semibold leading-snug break-words ${actionClass(action.tone)}`}
          >
            {action.label}
          </Link>
        ) : (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={`inline-flex min-h-[40px] max-w-full min-w-0 items-center justify-center rounded-xl border px-4 py-2 text-center text-sm font-semibold leading-snug break-words disabled:opacity-50 ${actionClass(action.tone)}`}
          >
            {action.label}
          </button>
        ),
      )}
    </div>
  );
}
