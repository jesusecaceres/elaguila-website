"use client";

import Link from "next/link";
import { AutoDealerPreviewChrome } from "./AutoDealerPreviewChrome";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { withLangParam } from "../lib/autosNegociosLang";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] sm:p-6";

const EDIT_BASE = "/publicar/autos/negocios";

/** Premium empty state when the borrador has no meaningful content yet (no mock vehicle). */
export function AutosNegociosPreviewEmptyState() {
  const { lang, t } = useAutosNegociosPreviewCopy();
  const e = t.preview.empty;
  const editHref = withLangParam(EDIT_BASE, lang);

  return (
    <AutoDealerPreviewChrome editBackHref={editHref}>
      <main className="mx-auto mt-8 max-w-[1280px] px-4 md:px-5 lg:px-6">
        <div className={CARD}>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--lx-muted)]">{e.kicker}</p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">{e.title}</h1>
          <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[color:var(--lx-text-2)]">{e.body}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              href={editHref}
              className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7] shadow-lg transition hover:bg-[color:var(--lx-cta-dark-hover)]"
            >
              {e.cta}
            </Link>
            <span className="text-xs text-[color:var(--lx-muted)]">{e.footnote}</span>
          </div>
        </div>
      </main>
    </AutoDealerPreviewChrome>
  );
}
