import Link from "next/link";
import type { ReactNode } from "react";

import { adminBtnSecondary } from "@/app/admin/_components/adminTheme";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import { ClasificadosScopeNav } from "./ClasificadosScopeNav";

export type ClasificadosQueueHeaderScope = "queue" | "live";

/**
 * Category operating header — ONE grammar for every Clasificados category page:
 * category name (scope-aware H1: "Rentas — Queue" / "Rentas — Live"), Queue / Live switch, Public,
 * Publish, Back to Clasificados, an optional lane selector slot, and the technical source tucked
 * under "Advanced / details".
 *
 * Adoption (next agents): pass `categoryName` + `scope` + `queueHref` + `liveHref` (+ `laneSlot`
 * where the category has lanes). `title` remains supported for one-off pages (edit screens, hubs).
 */
export type ClasificadosQueueHeaderProps = {
  /** Admin chrome language. Defaults to `en` (Admin chrome is English-pinned today). */
  lang?: AdminLang;
  /**
   * Explicit H1. Used verbatim when `categoryName` is not given (legacy / non-queue pages).
   * When `categoryName` IS given the title is derived scope-aware and this is ignored.
   */
  title?: string;
  /** Human category name, e.g. "Rentas". Enables the scope-aware Queue vs Live title. */
  categoryName?: string;
  /** Which scope the page is showing. Drives the title, the scope badge and the Queue/Live switch. */
  scope?: ClasificadosQueueHeaderScope | null;
  /** Human-readable DB source, e.g. `public.listings` — shown only under "Advanced / details". */
  sourceTable?: string;
  /** Optional subtitle under the title */
  subtitle?: string;
  /** Scope badge override (defaults to the localized scope label when `scope` is given). */
  scopeLabel?: string;
  /** Hub link target (default Clasificados workspace hub) */
  hubHref?: string;
  /** Public catalog / landing (opens in new tab) */
  publicHref?: string;
  publicLabel?: string;
  /** Publish / post flow entry */
  publishHref?: string;
  publishLabel?: string;
  /** When both are given (and no `rightSlot`) the header renders the Queue / Live switch itself. */
  queueHref?: string;
  liveHref?: string;
  /** Lane selector slot (Autos lanes, Bienes Negocio/Privado, Ofertas lanes …). */
  laneSlot?: ReactNode;
  rightSlot?: ReactNode;
};

/** Pure: the H1 for a category page. Scope-aware whenever a category name is known. */
export function resolveCategoryHeaderTitle(input: {
  lang?: AdminLang;
  title?: string;
  categoryName?: string;
  scope?: ClasificadosQueueHeaderScope | null;
}): string {
  const lang = input.lang ?? "en";
  const name = (input.categoryName ?? "").trim();
  if (name) {
    return adminTr(lang, input.scope === "live" ? "catShell.titleLive" : "catShell.titleQueue", { name });
  }
  return (input.title ?? "").trim();
}

export function ClasificadosQueueHeader({
  lang = "en",
  title,
  categoryName,
  scope,
  sourceTable,
  subtitle,
  scopeLabel,
  hubHref = "/admin/workspace/clasificados",
  publicHref,
  publicLabel,
  publishHref,
  publishLabel,
  queueHref,
  liveHref,
  laneSlot,
  rightSlot,
}: ClasificadosQueueHeaderProps) {
  const h1 = resolveCategoryHeaderTitle({ lang, title, categoryName, scope });
  const badge =
    scopeLabel ?? (scope ? adminTr(lang, scope === "live" ? "catShell.scopeLive" : "catShell.scopeQueue") : undefined);
  const scopeNav =
    !rightSlot && queueHref && liveHref ? (
      <ClasificadosScopeNav lang={lang} queueHref={queueHref} liveHref={liveHref} active={scope === "live" ? "live" : "queue"} />
    ) : null;

  return (
    <header
      className="mb-2 flex min-w-0 flex-col gap-3 border-b border-[#E8DFD0] pb-5 sm:flex-row sm:items-start sm:justify-between"
      data-testid="clasificados-queue-header"
    >
      <div className="min-w-0 space-y-2">
        <Link href={hubHref} className={`${adminBtnSecondary} inline-flex text-xs`} data-testid="clasificados-header-back">
          {adminTr(lang, "catShell.back")}
        </Link>
        {badge ? (
          <p className="inline-flex rounded-lg border border-[#C9B46A]/50 bg-[#FFFCF7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6B5B2E]">
            {badge}
          </p>
        ) : null}
        <h1 className="text-xl font-bold leading-tight text-[#1E1810] sm:text-2xl" data-testid="clasificados-header-title">
          {h1}
        </h1>
        {subtitle ? <p className="max-w-3xl text-sm leading-relaxed text-[#5C5346]">{subtitle}</p> : null}
        {scopeNav}
        {publicHref || publishHref ? (
          <div className="flex flex-wrap gap-2 pt-1 text-sm font-semibold">
            {publicHref ? (
              <Link
                href={publicHref}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-[#1E4A7A] bg-[#1E4A7A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#173A61]"
                target="_blank"
                rel="noreferrer"
                data-testid="clasificados-header-public"
              >
                {publicLabel ?? adminTr(lang, "catShell.publicView")} ↗
              </Link>
            ) : null}
            {publishHref ? (
              <Link
                href={publishHref}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FFFCF7]"
                target="_blank"
                rel="noreferrer"
                data-testid="clasificados-header-publish"
              >
                {publishLabel ?? adminTr(lang, "catShell.publish")} ↗
              </Link>
            ) : null}
          </div>
        ) : null}
        {laneSlot ? <div data-testid="clasificados-header-lane-slot">{laneSlot}</div> : null}
        {sourceTable ? (
          <details className="text-[11px] text-[#7A7164]" data-testid="clasificados-header-advanced">
            <summary className="cursor-pointer select-none font-semibold">{adminTr(lang, "catShell.advanced")}</summary>
            <p className="mt-1 font-mono font-semibold">
              {adminTr(lang, "catShell.source")}: <span className="text-[#3D3428]">{sourceTable}</span>
            </p>
          </details>
        ) : null}
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </header>
  );
}
