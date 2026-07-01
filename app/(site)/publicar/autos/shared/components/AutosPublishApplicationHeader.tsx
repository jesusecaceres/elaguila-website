"use client";

import type { ReactNode } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { getAutosPublishHeaderEyebrow } from "../lib/autosPublishApplicationHeaderCopy";

type Props = {
  lang: AutosNegociosLang;
  lane: "negocios" | "privado";
  title: string;
  helper: string;
  draftLabel: string;
  banner?: ReactNode;
};

export function AutosPublishApplicationHeader({ lang, lane, title, helper, draftLabel, banner }: Props) {
  const eyebrow = getAutosPublishHeaderEyebrow(lang, lane);

  return (
    <header
      className="mb-5 sm:mb-6"
      data-autos-publish-application-header={lane}
      aria-labelledby={`autos-publish-title-${lane}`}
    >
      <div className="rounded-2xl border border-[color:var(--lx-gold-border)]/70 bg-[color:var(--lx-card)]/95 px-4 py-4 shadow-[0_4px_24px_-14px_rgba(42,36,22,0.18)] sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">{eyebrow}</p>
            <h1
              id={`autos-publish-title-${lane}`}
              className="mt-1 text-xl font-bold leading-tight tracking-tight text-[color:var(--lx-text)] sm:text-2xl"
            >
              {title}
            </h1>
          </div>
          <span className="shrink-0 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[color:var(--lx-text-2)]">
            {draftLabel}
          </span>
        </div>
        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)]">{helper}</p>
        {banner ? <div className="mt-3 space-y-3">{banner}</div> : null}
      </div>
    </header>
  );
}
