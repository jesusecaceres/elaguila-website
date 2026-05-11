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
  hubHref = "/admin/workspace/clasificados",
  publicHref,
  publicLabel = "Vista pública",
  publishHref,
  publishLabel = "Publicar",
  rightSlot,
}: ClasificadosQueueHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-[#E8DFD0] pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <Link href={hubHref} className={`${adminBtnSecondary} inline-flex text-xs`}>
          ← Hub Clasificados
        </Link>
        <h1 className="text-xl font-bold leading-tight text-[#1E1810] sm:text-2xl">{title}</h1>
        <p className="font-mono text-[11px] font-semibold text-[#7A7164]">
          Fuente: <span className="text-[#3D3428]">{sourceTable}</span>
        </p>
        {subtitle ? <p className="max-w-3xl text-sm text-[#5C5346]">{subtitle}</p> : null}
        {publicHref || publishHref ? (
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-sm font-semibold">
            {publicHref ? (
              <Link href={publicHref} className="text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
                {publicLabel} ↗
              </Link>
            ) : null}
            {publishHref ? (
              <Link href={publishHref} className="text-[#4A6680] underline" target="_blank" rel="noreferrer">
                {publishLabel} ↗
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}
