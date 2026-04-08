"use client";

import Link from "next/link";

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
  children,
}: {
  editHref?: string;
  /** BR Negocio: session handoff so leave-guards do not fire when returning from preview. */
  onBeforeNavigateToEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden antialiased" style={{ backgroundColor: IVORY }}>
      <div
        className="sticky top-0 z-[100] border-b px-4 py-3 sm:px-6"
        style={{ borderColor: BORDER, background: "rgba(253, 251, 247, 0.98)" }}
      >
        <div className="mx-auto flex max-w-[1240px] justify-end">
          {editHref ? (
            <Link
              href={editHref}
              prefetch={false}
              onClick={() => onBeforeNavigateToEdit?.()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-wide sm:min-h-0 sm:py-1.5"
              style={{ borderColor: BORDER, color: BRONZE_SOFT }}
            >
              Volver a editar
            </Link>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
