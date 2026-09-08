"use client";

import type { AutoDealerListing } from "../../types/autoDealerListing";
import { useAutosNegociosPreviewCopy } from "../../lib/AutosNegociosPreviewLocaleContext";

import { autosPreviewPremiumCardClass, autosPreviewSectionEyebrowClass, autosPreviewSectionTitleClass } from "./previewPremiumTokens";

const CARD = `${autosPreviewPremiumCardClass} p-5 sm:p-6`;

export function PreviewVehicleDescription({ data }: { data: AutoDealerListing }) {
  const { lang, t } = useAutosNegociosPreviewCopy();
  const body = data.description?.trim();
  const notes = data.otherEquipmentDetails?.trim();
  if (!body && !notes) return null;

  const dealer = data.dealerName?.trim();
  const { title, byline } = t.preview.description;
  const longBody = Boolean(body && body.length > 420);

  return (
    <div className="flex flex-col gap-4">
      {body ? (
        <section className={CARD}>
          <p className={autosPreviewSectionEyebrowClass}>{lang === "es" ? "Descripción" : "Description"}</p>
          <h2 className={`mt-1 ${autosPreviewSectionTitleClass}`}>
            {lang === "es" ? "Descripción del vehículo" : title}
          </h2>
          {dealer ? <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{byline(dealer)}</p> : null}
          {longBody ? (
            <details className="mt-4 group">
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <p className="max-w-[65ch] break-words text-[15px] leading-[1.7] text-[color:var(--lx-text-2)] line-clamp-5 group-open:line-clamp-none">
                  {body}
                </p>
                <span className="mt-3 inline-flex text-sm font-bold text-[#7A1E2C] group-open:hidden">
                  {lang === "es" ? "Ver más detalles" : "See more details"}
                </span>
              </summary>
            </details>
          ) : (
            <p className="mt-4 max-w-[65ch] break-words text-[15px] leading-[1.7] text-[color:var(--lx-text-2)]">{body}</p>
          )}
        </section>
      ) : null}

      {notes ? (
        <section className={CARD}>
          <p className={autosPreviewSectionEyebrowClass}>{lang === "es" ? "Notas del concesionario" : "Dealer notes"}</p>
          <h2 className={`mt-1 ${autosPreviewSectionTitleClass}`}>
            {lang === "es" ? "Notas del concesionario" : "Dealer notes"}
          </h2>
          <p className="mt-4 max-w-[65ch] break-words text-[15px] leading-[1.7] text-[color:var(--lx-text-2)]">{notes}</p>
        </section>
      ) : null}
    </div>
  );
}
