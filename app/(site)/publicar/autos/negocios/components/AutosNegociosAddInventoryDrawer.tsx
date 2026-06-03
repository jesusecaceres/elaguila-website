"use client";

import { useEffect, useMemo, useState } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutosAdditionalInventoryVehicleInput } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  applicationCanAddInventoryVehicle,
  countApplicationInventoryVehicles,
} from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import {
  autosAddInventoryAtLimitHelper,
  autosAddInventoryCancelCta,
  autosAddInventoryCountLabel,
  autosAddInventoryDrawerHelper,
  autosAddInventoryDrawerTitle,
  autosAddInventorySaveAndAnotherCta,
  autosAddInventorySaveCta,
  autosAddInventorySaveRequiresFields,
  autosAddInventorySectionComingSoon,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import {
  formatMileageInputDisplay,
  formatUsdIntegerInputDisplay,
  parseMileageInput,
  parseUsdIntegerInput,
} from "@/app/clasificados/autos/shared/utils/autosNumericInputUi";
import { autosDraftTextValue } from "@/app/lib/clasificados/autos/autosPublishFormText";

const INPUT =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3.5 py-2.5 text-[15px] text-[#1E1810] outline-none ring-[#C9B46A]/40 focus:ring-2";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[#6E5418]";

const EMPTY_FORM: AutosAdditionalInventoryVehicleInput = {};

type Props = {
  open: boolean;
  onClose: () => void;
  lang: AutosNegociosLang;
  additionalCount: number;
  onSave: (input: AutosAdditionalInventoryVehicleInput) => boolean;
  flushDraft?: () => Promise<void>;
};

export function AutosNegociosAddInventoryDrawer({
  open,
  onClose,
  lang,
  additionalCount,
  onSave,
  flushDraft,
}: Props) {
  const [form, setForm] = useState<AutosAdditionalInventoryVehicleInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const used = countApplicationInventoryVehicles(additionalCount);
  const canAdd = applicationCanAddInventoryVehicle(additionalCount);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setError(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const sectionLabels = useMemo(
    () =>
      lang === "es"
        ? {
            main: "Información principal del vehículo",
            specs: "Especificaciones",
            media: "Fotos y medios",
            description: "Descripción",
          }
        : {
            main: "Vehicle main information",
            specs: "Specifications",
            media: "Photos and media",
            description: "Description",
          },
    [lang],
  );

  if (!open) return null;

  const persist = async (input: AutosAdditionalInventoryVehicleInput, andAnother: boolean) => {
    setBusy(true);
    setError(null);
    try {
      if (flushDraft) await flushDraft();
      const ok = onSave(input);
      if (!ok) {
        setError(autosAddInventorySaveRequiresFields(lang));
        return;
      }
      if (andAnother) {
        setForm(EMPTY_FORM);
      } else {
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center lg:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="autos-add-inventory-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1810]/45 backdrop-blur-[2px]"
        aria-label={autosAddInventoryCancelCta(lang)}
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(92dvh,720px)] w-full flex-col rounded-t-[24px] border border-[#E8DFD0] bg-[#FAF7F2] shadow-2xl lg:max-w-xl lg:rounded-[24px]">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#D4C4A8] lg:hidden" aria-hidden />
        <div className="shrink-0 border-b border-[#E8DFD0] px-4 py-3 sm:px-5">
          <h2 id="autos-add-inventory-title" className="font-serif text-lg font-semibold text-[#1E1810]">
            {autosAddInventoryDrawerTitle(lang)}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#2C2416]">{autosAddInventoryDrawerHelper(lang)}</p>
          <p className="mt-2 text-xs font-semibold text-[#6E5418]">
            {autosAddInventoryCountLabel(lang, used, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT)}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {!canAdd ? (
            <p className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950">
              {autosAddInventoryAtLimitHelper(lang)}
            </p>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6E5418]">{sectionLabels.main}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className={LABEL}>{lang === "es" ? "Año" : "Year"}</label>
                  <input
                    className={INPUT}
                    inputMode="numeric"
                    value={form.year ?? ""}
                    onChange={(e) => {
                      const t = e.target.value.trim();
                      if (!t) {
                        setForm((f) => ({ ...f, year: undefined }));
                        return;
                      }
                      const n = parseInt(t, 10);
                      setForm((f) => ({ ...f, year: Number.isFinite(n) ? n : undefined }));
                    }}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={LABEL}>{lang === "es" ? "Marca" : "Make"}</label>
                  <input
                    className={INPUT}
                    value={form.make ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, make: autosDraftTextValue(e.target.value) }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>{lang === "es" ? "Modelo" : "Model"}</label>
                  <input
                    className={INPUT}
                    value={form.model ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, model: autosDraftTextValue(e.target.value) }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>{lang === "es" ? "Versión / trim" : "Trim / version"}</label>
                  <input
                    className={INPUT}
                    value={form.trim ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, trim: autosDraftTextValue(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className={LABEL}>{lang === "es" ? "Precio" : "Price"}</label>
                  <input
                    className={INPUT}
                    inputMode="numeric"
                    value={formatUsdIntegerInputDisplay(form.price)}
                    onChange={(e) => setForm((f) => ({ ...f, price: parseUsdIntegerInput(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className={LABEL}>{lang === "es" ? "Millas" : "Mileage"}</label>
                  <input
                    className={INPUT}
                    inputMode="numeric"
                    value={formatMileageInputDisplay(form.mileage)}
                    onChange={(e) => setForm((f) => ({ ...f, mileage: parseMileageInput(e.target.value) }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>{lang === "es" ? "URL de imagen (opcional)" : "Image URL (optional)"}</label>
                  <input
                    className={INPUT}
                    type="url"
                    value={form.imageUrl ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>{lang === "es" ? "Descripción breve (opcional)" : "Short description (optional)"}</label>
                  <textarea
                    className={`${INPUT} min-h-[80px]`}
                    value={form.description ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, description: autosDraftTextValue(e.target.value) }))}
                  />
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {[sectionLabels.specs, sectionLabels.media, sectionLabels.description].map((label) => (
                  <li
                    key={label}
                    className="rounded-xl border border-dashed border-[#D4C4A8]/60 bg-[#FFFCF7]/80 px-3 py-2 text-xs text-[#5C5346]"
                  >
                    {autosAddInventorySectionComingSoon(lang, label)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {error ? (
            <p className="mt-3 text-sm font-medium text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 space-y-2 border-t border-[#E8DFD0] bg-[#FAF7F2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          <button
            type="button"
            disabled={!canAdd || busy}
            onClick={() => void persist(form, false)}
            className="w-full rounded-2xl bg-[#2A2620] py-3.5 text-sm font-bold text-[#FAF7F2] shadow-md hover:bg-[#1E1810] disabled:opacity-50"
          >
            {busy ? (lang === "es" ? "Guardando…" : "Saving…") : autosAddInventorySaveCta(lang)}
          </button>
          <button
            type="button"
            disabled={!canAdd || busy}
            onClick={() => void persist(form, true)}
            className="w-full rounded-2xl border border-[#C9B46A]/50 bg-white py-3.5 text-sm font-bold text-[#6E5418] disabled:opacity-50"
          >
            {autosAddInventorySaveAndAnotherCta(lang)}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl py-2.5 text-sm font-semibold text-[#5C5346] hover:underline"
          >
            {autosAddInventoryCancelCta(lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
