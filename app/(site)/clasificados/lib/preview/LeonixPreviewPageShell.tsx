"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ClasificadosUiLang } from "@/app/lib/clasificados/clasificadosUiChromeCopy";
import { previewBackToEditLabel } from "@/app/lib/clasificados/clasificadosUiChromeCopy";

const IVORY = "#F9F6F1";
const BORDER = "rgba(61, 54, 48, 0.12)";
const BRONZE_SOFT = "#B8954A";

/**
 * Global Leonix clasificados preview chrome: only “Volver a editar” outside the publishable ad canvas.
 * The child must render the ad body only (no logo/breadcrumb/edit inside the canvas).
 */
export function LeonixPreviewPageShell({
  editHref,
  onBeforeNavigateToEdit,
  lang,
  backLabel,
  /** Optional primary action (e.g. publish to live) rendered before “Volver a editar”. */
  publishSlot,
  children,
}: {
  editHref?: string;
  /** BR Negocio: session handoff so leave-guards do not fire when returning from preview. */
  onBeforeNavigateToEdit?: () => void;
  /** When set, derives `backLabel` from shared ES/EN chrome copy. */
  lang?: ClasificadosUiLang;
  /** Override back label; defaults from `lang` or Spanish. */
  backLabel?: string;
  publishSlot?: ReactNode;
  children: React.ReactNode;
}) {
  const resolvedBackLabel = backLabel ?? (lang ? previewBackToEditLabel(lang) : "Volver a editar");
  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden antialiased" style={{ backgroundColor: IVORY }}>
      <div
        className="sticky top-0 z-[100] border-b px-4 py-3 sm:px-6"
        style={{
          borderColor: BORDER,
          background: "rgba(253, 251, 247, 0.98)",
          paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="mx-auto flex w-full max-w-[1240px] min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {publishSlot}
          {editHref ? (
            <Link
              href={editHref}
              prefetch={false}
              onClick={() => onBeforeNavigateToEdit?.()}
              className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-full border px-4 py-2.5 text-center text-[11px] font-bold uppercase leading-snug tracking-wide sm:min-h-[40px] sm:w-auto sm:shrink-0 sm:py-2"
              style={{ borderColor: BORDER, color: BRONZE_SOFT }}
            >
              {resolvedBackLabel}
            </Link>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
