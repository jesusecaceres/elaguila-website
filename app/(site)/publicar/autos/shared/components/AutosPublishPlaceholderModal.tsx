"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { getAutosPublishPlaceholderCopy } from "../lib/autosPublishPlaceholderCopy";

const BTN =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto";
const BTN_GHOST =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-6 text-sm font-bold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)] active:opacity-90 sm:w-auto";

export function AutosPublishPlaceholderModal({
  open,
  onClose,
  lang,
  lane,
  confirmHref,
}: {
  open: boolean;
  onClose: () => void;
  lang: AutosNegociosLang;
  lane: AutosClassifiedsLane;
  /** Pre-publish + Stripe entry (`/publicar/autos/{lane}/confirm` with lang). */
  confirmHref: string;
}) {
  const c = getAutosPublishPlaceholderCopy(lang, lane);
  const [checks, setChecks] = useState([false, false, false]);
  const all = checks.every(Boolean);

  useEffect(() => {
    if (open) setChecks([false, false, false]);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="autos-ph-title">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label={c.overlayClose} onClick={onClose} />
      <div className="relative z-10 max-h-[min(88vh,720px)] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-2xl sm:m-4 sm:max-h-none sm:rounded-2xl sm:p-6">
        <h2 id="autos-ph-title" className="text-lg font-bold text-[color:var(--lx-text)]">
          {c.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.subtitle}</p>
        <p className="mt-3 rounded-lg border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-3 py-2 text-[13px] text-[color:var(--lx-text-2)]">
          {c.phaseNote}
        </p>
        <ul className="mt-5 space-y-4">
          <li className="flex gap-3">
            <input
              id="ph-a"
              type="checkbox"
              checked={checks[0]}
              onChange={(e) => setChecks((x) => [e.target.checked, x[1], x[2]])}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-[color:var(--lx-nav-border)]"
            />
            <label htmlFor="ph-a" className="text-sm text-[color:var(--lx-text)]">
              {c.checks.accurate}
            </label>
          </li>
          <li className="flex gap-3">
            <input
              id="ph-b"
              type="checkbox"
              checked={checks[1]}
              onChange={(e) => setChecks((x) => [x[0], e.target.checked, x[2]])}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-[color:var(--lx-nav-border)]"
            />
            <label htmlFor="ph-b" className="text-sm text-[color:var(--lx-text)]">
              {c.checks.rules}
            </label>
          </li>
          <li className="flex gap-3">
            <input
              id="ph-c"
              type="checkbox"
              checked={checks[2]}
              onChange={(e) => setChecks((x) => [x[0], x[1], e.target.checked])}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-[color:var(--lx-nav-border)]"
            />
            <label htmlFor="ph-c" className="text-sm text-[color:var(--lx-text)]">
              {c.checks.paidPlaceholder}
            </label>
          </li>
        </ul>
        <p className="mt-3 text-xs text-[color:var(--lx-muted)]">{c.mustCheck}</p>
        <div className="mt-6 flex flex-col gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-0">
          <button type="button" className={BTN_GHOST} onClick={onClose}>
            {c.backEdit}
          </button>
          {all ? (
            <Link href={confirmHref} className={`${BTN} text-center`} onClick={onClose}>
              {c.continueToConfirm}
            </Link>
          ) : (
            <span className={`${BTN} cursor-not-allowed text-center opacity-40`} aria-disabled>
              {c.continueToConfirm}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
