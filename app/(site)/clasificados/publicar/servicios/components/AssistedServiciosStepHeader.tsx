"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * LEONIX ASSISTED SERVICIOS NAVIGATION CLEANUP — persistent, deterministic navigation for the
 * real Servicios application when a staff actor is operating it in assisted mode. Purely a
 * navigation affordance: it drives the EXACT SAME step-transition callbacks
 * (handleGoBack/handleGoNext) the existing footer Back/Next buttons already use — no new
 * validation, no new data model, no new save/publish path. Never rendered for a normal customer
 * (gated by the caller on a server-verified assisted context).
 */
export function AssistedServiciosStepHeader({
  businessId,
  businessName,
  step,
  totalSteps,
  canGoNext,
  onBack,
  onNext,
  lang,
}: {
  businessId: string;
  businessName: string;
  step: number;
  totalSteps: number;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
  lang: "es" | "en";
}) {
  const backLabel = lang === "en" ? "Back" : "Atrás";
  const nextLabel = lang === "en" ? "Next" : "Siguiente";
  const adminLabel = lang === "en" ? "Admin / Concierge" : "Admin / Concierge";
  const stepLabel = lang === "en" ? `Step ${step + 1} of ${totalSteps}` : `Paso ${step + 1} de ${totalSteps}`;
  const progressPct = totalSteps > 1 ? Math.round((step / (totalSteps - 1)) * 100) : 0;

  /**
   * The generic ConciergeReturnBanner (app/components/business/ConciergeReturnBanner.tsx) is
   * mounted universally, above this component, by the shared PublishAuthGate choke point every
   * assisted category route already uses — untouched by this change. It is ALSO `position:
   * sticky; top: 0`. Two independent top:0 sticky siblings do not stack automatically (each
   * computes its own stuck position against the viewport, not against the other's occupied
   * space), so this measures the banner's REAL rendered height and sticks just below it — no
   * hardcoded offset, so it still holds if the banner wraps to two lines on a narrow phone.
   */
  const [topOffset, setTopOffset] = useState(0);
  useEffect(() => {
    const banner = document.querySelector("[data-concierge-return-banner]") as HTMLElement | null;
    const update = () => setTopOffset(banner ? banner.getBoundingClientRect().height : 0);
    update();
    if (!banner || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(banner);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="sticky z-40 w-full overflow-x-hidden border-b border-[#5A1620] bg-[#7A1E2C] text-white shadow-[0_4px_14px_-6px_rgba(0,0,0,0.35)]"
      style={{ top: topOffset }}
      data-assisted-servicios-step-header
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[40px] shrink-0 touch-manipulation items-center rounded-lg border border-white/30 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20"
        >
          ← {backLabel}
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-xs font-bold sm:text-sm" title={businessName}>
          {businessName || (lang === "en" ? "Client" : "Cliente")}
        </p>
        <Link
          href="/admin/businesses"
          className="inline-flex min-h-[40px] shrink-0 touch-manipulation items-center rounded-lg border border-white/30 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20"
          data-assisted-admin-concierge-link
          data-business-id={businessId}
        >
          {adminLabel}
        </Link>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 pb-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-white/90">{stepLabel}</p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={onNext}
          className="inline-flex min-h-[36px] shrink-0 touch-manipulation items-center rounded-lg bg-white px-3 text-xs font-bold text-[#7A1E2C] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {nextLabel} →
        </button>
      </div>
    </div>
  );
}
