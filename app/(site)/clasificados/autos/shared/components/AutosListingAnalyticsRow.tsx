"use client";

import { FiBarChart2, FiBookmark, FiEye, FiMessageCircle, FiShare2 } from "react-icons/fi";
import type { AutosListingAnalyticsSnapshot } from "../types/autosListingAnalytics";

const CELL =
  "flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border border-[color:var(--lx-nav-border)]/90 bg-gradient-to-b from-[color:var(--lx-card)] to-[color:var(--lx-section)] px-3 py-3 shadow-[0_6px_22px_-12px_rgba(42,36,22,0.1)] sm:px-4 sm:py-3.5";

type Labels = {
  kicker: string;
  views: string;
  saves: string;
  shares: string;
  contacts: string;
  footnote?: string;
};

/**
 * Premium 4-up analytics strip — matches Leonix dashboard vocabulary (Vistas, Guardados, Compartidos, Contactos).
 */
export function AutosListingAnalyticsRow({
  metrics,
  labels,
  className = "",
  variant = "default",
}: {
  metrics: AutosListingAnalyticsSnapshot;
  labels: Labels;
  className?: string;
  /** `compact` keeps a 2×2 grid at all breakpoints (lighter Privado preview). */
  variant?: "default" | "compact";
}) {
  const v = Math.max(0, Math.floor(metrics.views));
  const s = Math.max(0, Math.floor(metrics.saves));
  const sh = Math.max(0, Math.floor(metrics.shares));
  const c = Math.max(0, Math.floor(metrics.contacts));

  const items: Array<{ key: string; label: string; value: number; icon: React.ReactNode }> = [
    { key: "v", label: labels.views, value: v, icon: <FiEye className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden /> },
    { key: "s", label: labels.saves, value: s, icon: <FiBookmark className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden /> },
    { key: "sh", label: labels.shares, value: sh, icon: <FiShare2 className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden /> },
    { key: "c", label: labels.contacts, value: c, icon: <FiMessageCircle className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden /> },
  ];

  const outerPad =
    variant === "compact"
      ? "p-3.5 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.1)] sm:p-5"
      : "p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.1)] sm:p-5";

  return (
    <section
      className={`min-w-0 overflow-x-hidden rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] ${outerPad} ${className}`}
      aria-label="Listing analytics"
    >
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">
        <FiBarChart2 className="h-3.5 w-3.5 text-[color:var(--lx-gold)]" aria-hidden />
        <span>{labels.kicker}</span>
      </div>
      <div
        className={
          variant === "compact"
            ? "grid grid-cols-2 gap-2 sm:gap-2.5"
            : "grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
        }
      >
        {items.map((it) => (
          <div key={it.key} className={variant === "compact" ? `${CELL} py-2.5 sm:px-3 sm:py-3` : CELL}>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
              {it.icon}
              <span className="truncate">{it.label}</span>
            </div>
            <p
              className={
                variant === "compact"
                  ? "text-lg font-bold tabular-nums tracking-tight text-[color:var(--lx-text)] sm:text-xl"
                  : "text-xl font-bold tabular-nums tracking-tight text-[color:var(--lx-text)] sm:text-2xl"
              }
            >
              {it.value}
            </p>
          </div>
        ))}
      </div>
      {labels.footnote ? <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{labels.footnote}</p> : null}
    </section>
  );
}
