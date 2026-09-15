"use client";

import { adminCardBase } from "./adminTheme";

/**
 * Gate 5 (Global Action Feedback Contract, CTA-001/CTA-002) — shared viewport-anchored
 * confirmation toast for client components that manage their own local action state (copy,
 * archive, mark-as-read, etc.) instead of a server-redirect query param. Three separate leads
 * inbox clients (Leonix leads, Newsletter, Media Kit) had each copy-pasted an inline
 * `{toast ? <div>...</div> : null}` block that rendered wherever it sat in the document flow —
 * on a long list, an action taken on a row far down the page produced a confirmation the
 * operator could only see by scrolling back to the top (CTA-001, reproduced and screenshotted on
 * the Leonix leads inbox). Fixed to the viewport instead, matching `AdminQueryFlash`'s existing
 * positioning contract, so every local-toast caller behaves identically to the query-param-driven
 * one (CTA-002) rather than each inventing its own placement.
 */
export function AdminLocalActionToast({ toast }: { toast: { msg: string; kind: "ok" | "err" } | null }) {
  if (!toast) return null;
  return (
    <div
      className="pointer-events-none fixed bottom-4 left-1/2 z-[200] w-[min(100%,22rem)] -translate-x-1/2 px-3 sm:left-auto sm:right-6 sm:translate-x-0"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto shadow-lg ${adminCardBase} px-4 py-2 text-sm ${
          toast.kind === "ok"
            ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
            : "border-rose-200 bg-rose-50/90 text-rose-950"
        }`}
      >
        {toast.msg}
      </div>
    </div>
  );
}
