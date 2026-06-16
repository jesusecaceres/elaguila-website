import Link from "next/link";
import type { ReactNode } from "react";

import { adminBtnSecondary } from "@/app/admin/_components/adminTheme";
export type ClasificadosQueueHeaderProps = {
  /** Page H1 */
  title: string;
  /** Human-readable DB source, e.g. `public.listings` */
  sourceTable: string;
  /** Optional subtitle under the source line */
  subtitle?: string;
  /** Scope badge (queue vs live) */
  scopeLabel?: string;
  /** Hub link target (default Clasificados workspace hub) */
  hubHref?: string;
  /** Public catalog / landing (opens in new tab) */
  publicHref?: string;
  publicLabel?: string;
  /** Publish / post flow entry */
  publishHref?: string;
  publishLabel?: string;
  rightSlot?: ReactNode;
};

export function ClasificadosQueueHeader({
  title,
  sourceTable,
  subtitle,
  scopeLabel,
  hubHref = "/admin/workspace/clasificados",
  publicHref,
  publicLabel = "Public view",
  publishHref,
  publishLabel = "Publish",
  rightSlot,
}: ClasificadosQueueHeaderProps) {
  return (
    <header
      className="mb-2 flex min-w-0 flex-col gap-3 border-b border-[#E8DFD0] pb-5 sm:flex-row sm:items-start sm:justify-between"
      data-testid="clasificados-queue-header"
    >
      <div className="min-w-0 space-y-2">
        <Link href={hubHref} className={`${adminBtnSecondary} inline-flex text-xs`}>
          ← Clasificados hub
        </Link>
        {scopeLabel ? (
          <p className="inline-flex rounded-lg border border-[#C9B46A]/50 bg-[#FFFCF7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6B5B2E]">
            {scopeLabel}
          </p>
        ) : null}
        <h1 className="text-xl font-bold leading-tight text-[#1E1810] sm:text-2xl">{title}</h1>
        <p className="font-mono text-[11px] font-semibold text-[#7A7164]">
          Source: <span className="text-[#3D3428]">{sourceTable}</span>
        </p>
        {subtitle ? <p className="max-w-3xl text-sm leading-relaxed text-[#5C5346]">{subtitle}</p> : null}
        {publicHref || publishHref ? (
          <div className="flex flex-wrap gap-2 pt-1 text-sm font-semibold">
            {publicHref ? (
              <Link
                href={publicHref}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-[#1E4A7A] bg-[#1E4A7A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#173A61]"
                target="_blank"
                rel="noreferrer"
              >
                {publicLabel} ↗
              </Link>
            ) : null}
            {publishHref ? (
              <Link
                href={publishHref}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FFFCF7]"
                target="_blank"
                rel="noreferrer"
              >
                {publishLabel} ↗
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </header>
  );
}
