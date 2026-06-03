"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  additionalInventoryVehicleTitle,
  computeInventoryVehicleStatus,
  inventoryVehicleCoverUrl,
  inventoryVehiclePhotoCount,
} from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  autosInventoryBundleAdditionalLabel,
  autosInventoryBundlePhotoCount,
  autosInventoryBundleStatusDraft,
  autosInventoryBundleStatusReady,
  autosPreviewInventorySectionHelper,
  autosPreviewInventorySectionTitle,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import {
  formatMileageInputDisplay,
  formatUsdIntegerInputDisplay,
} from "@/app/clasificados/autos/shared/utils/autosNumericInputUi";

function formatPrice(n?: number): string | null {
  if (n === undefined || !Number.isFinite(n)) return null;
  const s = formatUsdIntegerInputDisplay(n);
  return s ? `$${s}` : null;
}

export function AutosNegociosPreviewInventorySection({
  lang,
  parentListing,
  additionalVehicles,
}: {
  lang: AutosNegociosLang;
  parentListing: AutoDealerListing;
  additionalVehicles: AutosAdditionalInventoryVehicleDraft[];
}) {
  void parentListing;
  if (additionalVehicles.length === 0) return null;

  return (
    <section className="mx-auto mb-8 max-w-5xl px-4">
      <h2 className="text-lg font-extrabold text-[color:var(--lx-text)]">{autosPreviewInventorySectionTitle(lang)}</h2>
      <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{autosPreviewInventorySectionHelper(lang)}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {additionalVehicles.map((v) => {
          const ready = computeInventoryVehicleStatus(v) === "ready_for_preview";
          const cover = inventoryVehicleCoverUrl(v);
          const photos = inventoryVehiclePhotoCount(v);
          return (
            <article
              key={v.id}
              className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-sm"
            >
              <div className="aspect-[16/10] bg-[color:var(--lx-section)]">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[color:var(--lx-muted)]">
                    {lang === "es" ? "Sin imagen" : "No image"}
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-gold)]">
                  {autosInventoryBundleAdditionalLabel(lang)} ·{" "}
                  {lang === "es" ? "Vista previa / borrador" : "Preview / draft"}
                </p>
                <h3 className="mt-1 font-bold text-[color:var(--lx-text)]">{additionalInventoryVehicleTitle(v)}</h3>
                <div className="mt-2 flex flex-wrap gap-x-3 text-sm text-[color:var(--lx-text-2)]">
                  {formatPrice(v.price) ? <span>{formatPrice(v.price)}</span> : null}
                  {v.mileage !== undefined ? <span>{formatMileageInputDisplay(v.mileage)} mi</span> : null}
                  {photos > 0 ? <span>{autosInventoryBundlePhotoCount(lang, photos)}</span> : null}
                </div>
                <p className="mt-2 text-xs font-semibold text-[color:var(--lx-gold)]">
                  {ready ? autosInventoryBundleStatusReady(lang) : autosInventoryBundleStatusDraft(lang)}
                </p>
                <p className="mt-2 text-[10px] text-[color:var(--lx-muted)]">
                  {lang === "es" ? "ID Leonix se generará al publicar" : "Leonix ID generated on publish"}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
