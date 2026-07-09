"use client";

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { useAutosPrivadoPreviewCopy } from "../lib/AutosPrivadoPreviewLocaleContext";
import { autosPreviewPremiumCardClass, autosPreviewSectionEyebrowClass, autosPreviewSectionTitleClass } from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

const CARD = `${autosPreviewPremiumCardClass} p-5 sm:p-6`;

export function PrivadoVehicleDescription({ data }: { data: AutoDealerListing }) {
  const { lang, t } = useAutosPrivadoPreviewCopy();
  const body = data.description?.trim();
  if (!body) return null;

  const seller = data.dealerName?.trim();

  return (
    <section className={CARD}>
      <p className={autosPreviewSectionEyebrowClass}>{lang === "es" ? "Descripción" : "Description"}</p>
      <h2 className={`mt-1 ${autosPreviewSectionTitleClass}`}>
        {lang === "es" ? "Descripción del vehículo" : "Vehicle description"}
      </h2>
      {seller ? (
        <p className="mt-1 text-sm text-[color:var(--lx-muted)]">
          {lang === "es"
            ? `Información proporcionada por ${seller}`
            : `Information provided by ${seller}`}
        </p>
      ) : (
        <p className="mt-1 text-sm text-[color:var(--lx-muted)]">
          {lang === "es"
            ? "Información proporcionada por el vendedor"
            : "Information provided by the seller"}
        </p>
      )}
      {body ? (
        <p className="mt-4 max-w-[65ch] break-words text-[15px] leading-[1.7] text-[color:var(--lx-text-2)]">
          {body}
        </p>
      ) : null}
    </section>
  );
}
