"use client";

import type { ReactNode } from "react";

/**
 * Leonix Global Mobile/PWA Foundation V1 — shared sticky mobile action bar.
 *
 * A fixed bottom CTA bar with safe-area padding for mobile/PWA. Hidden on
 * desktop unless `showOnDesktop`. Renders up to 5 compact, rectangular actions
 * with icon + label and 44px tap targets. Overflow-safe (no horizontal scroll).
 *
 * No category-specific content — actions are passed in by the caller.
 */

export type LeonixStickyAction = {
  key: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
};

const ACTION_CLASS =
  "flex min-h-11 min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-[#1F241C] transition hover:bg-[#FDF8F0]";

export function LeonixStickyActionBar({
  actions,
  ariaLabel,
  showOnDesktop = false,
  className = "",
}: {
  actions: LeonixStickyAction[];
  ariaLabel?: string;
  showOnDesktop?: boolean;
  className?: string;
}) {
  const shown = actions.filter(Boolean).slice(0, 5);
  if (shown.length === 0) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#D4C4A8]/80 bg-[#FFFCF7]/95 px-2 py-2 shadow-[0_-4px_20px_rgba(31,36,28,0.08)] backdrop-blur-sm ${
        showOnDesktop ? "" : "lg:hidden"
      } ${className}`.trim()}
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
      role="region"
      aria-label={ariaLabel}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1">
        {shown.map((action) =>
          action.href ? (
            <a
              key={action.key}
              href={action.href}
              className={ACTION_CLASS}
              aria-label={action.ariaLabel ?? action.label}
              {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {action.icon}
              <span>{action.label}</span>
            </a>
          ) : (
            <button
              key={action.key}
              type="button"
              className={ACTION_CLASS}
              onClick={action.onClick}
              aria-label={action.ariaLabel ?? action.label}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
