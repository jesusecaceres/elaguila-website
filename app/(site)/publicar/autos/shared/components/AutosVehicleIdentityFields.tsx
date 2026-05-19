"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import {
  AUTOS_VEHICLE_MAKES,
  getAutosVehicleYearOptions,
  getModelsForMake,
  getTrimOptionsForMakeModel,
  resolveMakeToCanonical,
  resolveModelToCanonical,
} from "@/app/lib/clasificados/autos/autosVehicleTaxonomy";

const INPUT =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3.5 py-2.5 text-[15px] leading-snug text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";

const UNLISTED_MAKE = "__unlisted_make__";
const TRIM_CUSTOM = "__trim_custom__";

export type AutosVehicleIdentityLang = "es" | "en";

export type AutosVehicleIdentityFieldLabels = {
  year: string;
  make: string;
  model: string;
  trim: string;
};

function reqStar() {
  return (
    <span className="text-red-800" aria-hidden>
      *
    </span>
  );
}

function labelEl(base: string, required?: boolean) {
  return (
    <span className="block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">
      {required ? (
        <>
          {base} {reqStar()}
        </>
      ) : (
        base
      )}
    </span>
  );
}

export function AutosVehicleIdentityFields({
  lang,
  labels,
  year,
  make,
  model,
  trim,
  onPatch,
  requiredYear,
  requiredMake,
  requiredModel,
}: {
  lang: AutosVehicleIdentityLang;
  labels: AutosVehicleIdentityFieldLabels;
  year: number | undefined;
  make: string | undefined;
  model: string | undefined;
  trim: string | undefined;
  onPatch: (patch: { year?: number; make?: string; model?: string; trim?: string }) => void;
  requiredYear?: boolean;
  requiredMake?: boolean;
  requiredModel?: boolean;
}) {
  const years = useMemo(() => getAutosVehicleYearOptions(), []);
  const catalogMake = resolveMakeToCanonical(make);
  const models = useMemo(() => getModelsForMake(make), [make]);
  const catalogModel = resolveModelToCanonical(make, model);
  const trimSuggestions = useMemo(() => getTrimOptionsForMakeModel(make, model), [make, model]);

  const [makeUnlisted, setMakeUnlisted] = useState(false);
  const trimInCatalog = trim?.trim() && trimSuggestions.some((t) => t.toLowerCase() === trim.trim().toLowerCase());
  const [trimCustomMode, setTrimCustomMode] = useState(
    () => Boolean(trim?.trim()) && trimSuggestions.length > 0 && !trimInCatalog,
  );

  useEffect(() => {
    if (catalogMake) setMakeUnlisted(false);
  }, [catalogMake]);

  useEffect(() => {
    if (!trim?.trim()) setTrimCustomMode(false);
    else if (trimSuggestions.length === 0) setTrimCustomMode(true);
    else if (trimInCatalog) setTrimCustomMode(false);
  }, [trim, trimSuggestions.length, trimInCatalog]);

  const emptyYear = lang === "es" ? "Año" : "Year";
  const emptyMake = lang === "es" ? "Selecciona marca" : "Select make";
  const emptyModel = lang === "es" ? "Selecciona modelo" : "Select model";
  const unlistedMakeLabel = lang === "es" ? "Mi marca no está en la lista" : "My make is not listed";
  const backToList = lang === "es" ? "Volver a la lista de marcas" : "Back to make list";
  const trimHint =
    lang === "es" ? "Si no ves tu versión, escríbela manualmente." : "If you do not see your trim, enter it manually.";
  const trimPlaceholder = lang === "es" ? "Versión / trim" : "Trim / version";

  const yearInList = year !== undefined && years.includes(year);
  const yearSelectValue = year === undefined ? "" : String(year);

  const makeSelectValue = catalogMake ?? "";

  const legacyModel =
    model?.trim() && models.length > 0 && !catalogModel ? model.trim() : "";
  const modelSelectValue = catalogModel ?? legacyModel;

  function onMakeChange(next: string) {
    const v = next.trim() ? next : undefined;
    onPatch({ make: v, model: undefined, trim: undefined });
  }

  function onModelChange(next: string) {
    const v = next.trim() ? next : undefined;
    onPatch({ model: v, trim: undefined });
  }

  const showMakeFreeInput = makeUnlisted || Boolean(make?.trim() && !catalogMake);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4">
      <div>
        <label className="block">{labelEl(labels.year, requiredYear)}</label>
        <select
          className={INPUT}
          value={yearSelectValue}
          onChange={(e) => {
            const v = e.target.value;
            onPatch({ year: v ? parseInt(v, 10) : undefined });
          }}
        >
          <option value="">{emptyYear}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
          {year !== undefined && !yearInList ? (
            <option value={String(year)}>
              {year} ({lang === "es" ? "valor guardado" : "saved value"})
            </option>
          ) : null}
        </select>
      </div>
      <div>
        <label className="block">{labelEl(labels.make, requiredMake)}</label>
        {showMakeFreeInput ? (
          <div className="space-y-2">
            <input
              className={INPUT}
              value={make ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onPatch({ make: v.trim() ? v : undefined });
              }}
              placeholder={lang === "es" ? "Escribe la marca" : "Enter make"}
              autoComplete="off"
            />
            <button
              type="button"
              className="text-xs font-semibold text-[color:var(--lx-gold)] underline"
              onClick={() => {
                setMakeUnlisted(false);
                onPatch({ make: undefined, model: undefined, trim: undefined });
              }}
            >
              {backToList}
            </button>
          </div>
        ) : (
          <select className={INPUT} value={makeSelectValue} onChange={(e) => {
              const v = e.target.value;
              if (v === UNLISTED_MAKE) {
                setMakeUnlisted(true);
                onPatch({ make: undefined, model: undefined, trim: undefined });
                return;
              }
              onMakeChange(v);
            }}>
            <option value="">{emptyMake}</option>
            {AUTOS_VEHICLE_MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value={UNLISTED_MAKE}>{unlistedMakeLabel}</option>
          </select>
        )}
      </div>
      <div>
        <label className="block">{labelEl(labels.model, requiredModel)}</label>
        {models.length > 0 ? (
          <select className={INPUT} value={modelSelectValue} onChange={(e) => onModelChange(e.target.value)}>
            <option value="">{emptyModel}</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            {legacyModel ? (
              <option value={legacyModel}>{normalizeVehicleSegment(legacyModel) ?? legacyModel}</option>
            ) : null}
          </select>
        ) : (
          <input
            className={INPUT}
            value={model ?? ""}
            onChange={(e) => onPatch({ model: e.target.value.trim() ? e.target.value : undefined })}
            placeholder={lang === "es" ? "Escribe el modelo" : "Enter model"}
            autoComplete="off"
          />
        )}
      </div>
      <div className="sm:col-span-2">
        <label className="block">{labelEl(labels.trim, false)}</label>
        {trimSuggestions.length > 0 && !trimCustomMode ? (
          <select
            className={INPUT}
            value={trimInCatalog ? (trim ?? "") : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === TRIM_CUSTOM) {
                setTrimCustomMode(true);
                return;
              }
              setTrimCustomMode(false);
              onPatch({ trim: v.trim() ? v : undefined });
            }}
          >
            <option value="">{trimPlaceholder}</option>
            {trimSuggestions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value={TRIM_CUSTOM}>
              {lang === "es" ? "Escribir versión manualmente" : "Enter trim manually"}
            </option>
            {trim && !trimInCatalog ? (
              <option value={trim}>{normalizeVehicleSegment(trim) ?? trim}</option>
            ) : null}
          </select>
        ) : (
          <>
            <input
              className={INPUT}
              value={trim ?? ""}
              onChange={(e) => onPatch({ trim: e.target.value.trim() ? e.target.value : undefined })}
              placeholder={trimPlaceholder}
              autoComplete="off"
            />
            {trimSuggestions.length > 0 ? (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-[color:var(--lx-gold)] underline"
                onClick={() => {
                  setTrimCustomMode(false);
                  onPatch({ trim: undefined });
                }}
              >
                {lang === "es" ? "Volver a la lista de versiones" : "Back to trim list"}
              </button>
            ) : null}
          </>
        )}
        <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{trimHint}</p>
      </div>
    </div>
  );
}
