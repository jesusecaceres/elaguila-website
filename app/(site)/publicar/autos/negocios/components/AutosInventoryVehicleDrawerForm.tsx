"use client";

import { useMemo } from "react";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing, VehicleBadge } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { buildVehicleTitle } from "../lib/autoDealerTitle";
import {
  BADGE_OPTIONS,
  BODY_STYLE_OPTIONS,
  DRIVETRAIN_OPTIONS,
  EXTERIOR_COLOR_OPTIONS,
  FEATURE_OPTIONS,
  FUEL_OPTIONS,
  INTERIOR_COLOR_OPTIONS,
  TITLE_STATUS_OPTIONS,
  TRANSMISSION_OPTIONS,
  US_STATE_OPTIONS,
} from "../lib/autoDealerTaxonomy";
import { SelectWithOtherField } from "./SelectWithOtherField";
import { AutosNegociosMediaManager } from "./AutosNegociosMediaManager";
import { AutosVehicleIdentityFields } from "@/app/publicar/autos/shared/components/AutosVehicleIdentityFields";
import { AutosVehicleEngineField } from "@/app/publicar/autos/shared/components/AutosVehicleEngineField";
import { useAutosVehicleStructuredSpecFill } from "@/app/publicar/autos/shared/components/useAutosVehicleStructuredSpecFill";
import { AutosCustomEquipmentField } from "@/app/publicar/autos/shared/components/AutosCustomEquipmentField";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  additionalInventoryVehicleTitle,
  computeInventoryVehicleStatus,
  inventoryVehicleDraftToListingSlice,
  inventoryVehiclePhotoCount,
} from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  autosInventoryBundleStatusDraft,
  autosInventoryBundleStatusReady,
  autosInventoryDrawerLocationInheritHint,
  autosInventoryDrawerSectionDescription,
  autosInventoryDrawerSectionHighlights,
  autosInventoryDrawerSectionMain,
  autosInventoryDrawerSectionMedia,
  autosInventoryDrawerSectionReview,
  autosInventoryDrawerSectionSpecs,
  autosInventoryInheritedBusinessNotice,
  autosInventoryBundlePhotoCount,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import {
  formatMileageInputDisplay,
  formatUsdIntegerInputDisplay,
  parseMileageInput,
  parseUsdIntegerInput,
} from "@/app/clasificados/autos/shared/utils/autosNumericInputUi";
import { autosDraftTextValue } from "@/app/lib/clasificados/autos/autosPublishFormText";

const CARD =
  "rounded-[16px] border border-[#E8DFD0] bg-[#FFFCF7] p-4 shadow-sm sm:p-5";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3.5 py-2.5 text-[15px] leading-snug text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const GRID2 = "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3";
const SECTION = "text-sm font-extrabold text-[#1E1810]";

function parseOptInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : undefined;
}

type Props = {
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  draft: AutosAdditionalInventoryVehicleDraft;
  onPatch: (patch: Partial<AutosAdditionalInventoryVehicleDraft>) => void;
};

export function AutosInventoryVehicleDrawerForm({ lang, copy, draft, onPatch }: Props) {
  const t = copy;
  const override = draft.vehicleTitleOverride === true;
  const autoTitle = useMemo(
    () => buildVehicleTitle(draft.year, draft.make, draft.model, draft.trim),
    [draft.year, draft.make, draft.model, draft.trim],
  );

  const mediaListing = useMemo(() => inventoryVehicleDraftToListingSlice(draft), [draft]);

  const setMediaPatch = (patch: Partial<AutoDealerListing>) => {
    onPatch(patch as Partial<AutosAdditionalInventoryVehicleDraft>);
  };

  const toggleBadge = (key: VehicleBadge) => {
    const cur = draft.badges ?? [];
    onPatch({ badges: cur.includes(key) ? cur.filter((b) => b !== key) : [...cur, key] });
  };

  const toggleFeature = (f: string) => {
    const cur = draft.features ?? [];
    onPatch({ features: cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f] });
  };

  const status =
    computeInventoryVehicleStatus(draft) === "ready_for_preview"
      ? autosInventoryBundleStatusReady(lang)
      : autosInventoryBundleStatusDraft(lang);
  const photoCount = inventoryVehiclePhotoCount(draft);

  useAutosVehicleStructuredSpecFill({
    lang,
    listing: draft as AutoDealerListing,
    onPatch: (p) => onPatch(p as Partial<AutosAdditionalInventoryVehicleDraft>),
  });

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-[#C9B46A]/40 bg-[#FFFCF7] px-4 py-3 text-xs leading-relaxed text-[#5C5346]">
        {autosInventoryInheritedBusinessNotice(lang)}
      </p>

      <section className={CARD}>
        <h3 className={SECTION}>{autosInventoryDrawerSectionMain(lang)}</h3>
        <div className={`${GRID2} mt-4`}>
          <div className="sm:col-span-2">
            <AutosVehicleIdentityFields
              lang={lang}
              labels={{
                year: t.app.labels.year,
                make: t.app.labels.make,
                model: t.app.labels.model,
                trim: t.app.labels.trim,
              }}
              year={draft.year}
              make={draft.make}
              model={draft.model}
              trim={draft.trim}
              onPatch={(p) => onPatch(p)}
              requiredMake
              requiredModel
            />
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-semibold text-[color:var(--lx-text)]">{t.app.titleBlock.title}</label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[color:var(--lx-text-2)]">
              <input
                type="checkbox"
                checked={override}
                onChange={(e) => onPatch({ vehicleTitleOverride: e.target.checked })}
                className="rounded border-[color:var(--lx-nav-border)]"
              />
              {t.app.titleBlock.customize}
            </label>
          </div>
          <input
            className={`${INPUT} mt-2`}
            value={(override ? draft.vehicleTitle : autoTitle) ?? ""}
            readOnly={!override}
            onChange={(e) => onPatch({ vehicleTitle: autosDraftTextValue(e.target.value) || undefined })}
          />
        </div>
        <div className={`${GRID2} mt-4`}>
          <div>
            <label className={LABEL}>{t.app.labels.condition}</label>
            <select
              className={INPUT}
              value={draft.condition ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onPatch({ condition: v === "" ? undefined : (v as AutoDealerListing["condition"]) });
              }}
            >
              {t.taxonomy.condition.map((o) => (
                <option key={o.value || "empty"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>{t.app.labels.price}</label>
            <input
              className={`${INPUT} tabular-nums`}
              inputMode="numeric"
              value={formatUsdIntegerInputDisplay(draft.price)}
              onChange={(e) => onPatch({ price: parseUsdIntegerInput(e.target.value) })}
            />
          </div>
          <div>
            <label className={LABEL}>{t.app.labels.monthly}</label>
            <input
              className={INPUT}
              placeholder={t.app.placeholders.monthly}
              value={draft.monthlyEstimate ?? ""}
              onChange={(e) => onPatch({ monthlyEstimate: autosDraftTextValue(e.target.value) })}
            />
          </div>
          <div>
            <label className={LABEL}>{t.app.labels.mileage}</label>
            <input
              className={`${INPUT} tabular-nums`}
              inputMode="numeric"
              value={formatMileageInputDisplay(draft.mileage)}
              onChange={(e) => onPatch({ mileage: parseMileageInput(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>{t.app.labels.city}</label>
            <CityAutocomplete
              value={draft.city ?? ""}
              onChange={(v) => onPatch({ city: v || undefined })}
              lang={lang}
              variant="brForm"
              placeholder={t.app.placeholders.city}
            />
            <p className="mt-1 text-[11px] text-[color:var(--lx-muted)]">{autosInventoryDrawerLocationInheritHint(lang)}</p>
          </div>
          <div>
            <label className={LABEL}>{t.app.labels.state}</label>
            <select className={INPUT} value={draft.state ?? ""} onChange={(e) => onPatch({ state: e.target.value || undefined })}>
              {US_STATE_OPTIONS.map((s) => (
                <option key={s || "empty"} value={s}>
                  {s || t.taxonomy.selectEmpty}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>{t.app.labels.zip}</label>
            <input
              className={INPUT}
              inputMode="numeric"
              maxLength={5}
              value={draft.zip ?? ""}
              onChange={(e) => onPatch({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) || undefined })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>{t.app.labels.vin}</label>
            <input className={INPUT} value={draft.vin ?? ""} onChange={(e) => onPatch({ vin: e.target.value || undefined })} />
          </div>
          <div>
            <label className={LABEL}>{t.app.labels.stock}</label>
            <input
              className={INPUT}
              value={draft.stockNumber ?? ""}
              onChange={(e) => onPatch({ stockNumber: e.target.value || undefined })}
            />
          </div>
        </div>
      </section>

      <section className={CARD}>
        <h3 className={SECTION}>{autosInventoryDrawerSectionSpecs(lang)}</h3>
        <div className={`${GRID2} mt-4`}>
          <SelectWithOtherField
            label={t.app.labels.transmission}
            options={TRANSMISSION_OPTIONS}
            optionLabels={t.taxonomy.transmission}
            emptyLabel={t.taxonomy.selectEmpty}
            value={draft.transmission}
            customValue={draft.transmissionCustom}
            onChange={({ value, custom }) => onPatch({ transmission: value, transmissionCustom: custom })}
            customPlaceholder={t.app.hints.transPh}
            incompleteHint={t.app.hints.transmission}
          />
          <SelectWithOtherField
            label={t.app.labels.drivetrain}
            options={DRIVETRAIN_OPTIONS}
            optionLabels={t.taxonomy.drivetrain}
            emptyLabel={t.taxonomy.selectEmpty}
            value={draft.drivetrain}
            customValue={draft.drivetrainCustom}
            onChange={({ value, custom }) => onPatch({ drivetrain: value, drivetrainCustom: custom })}
            customPlaceholder={t.app.hints.drivePh}
            incompleteHint={t.app.hints.drivetrain}
          />
          <AutosVehicleEngineField
            lang={lang}
            labels={{
              engine: t.app.labels.engine,
              selectEngine: lang === "es" ? "Selecciona motor" : "Select engine",
              customHint: t.app.engine.customHint,
              customPlaceholder: t.app.engine.customPlaceholder,
              filterNote: t.app.engine.filterNote,
            }}
            make={draft.make}
            model={draft.model}
            trim={draft.trim}
            engine={draft.engine}
            onPatch={(p) => onPatch(p)}
          />
          <SelectWithOtherField
            label={t.app.labels.fuel}
            options={FUEL_OPTIONS}
            optionLabels={t.taxonomy.fuel}
            emptyLabel={t.taxonomy.selectEmpty}
            value={draft.fuelType}
            customValue={draft.fuelTypeCustom}
            onChange={({ value, custom }) => onPatch({ fuelType: value, fuelTypeCustom: custom })}
            customPlaceholder={t.app.hints.fuelPh}
            incompleteHint={t.app.hints.fuel}
          />
          <div>
            <label className={LABEL}>{t.app.labels.mpgCity}</label>
            <input
              className={INPUT}
              inputMode="numeric"
              value={draft.mpgCity ?? ""}
              onChange={(e) => onPatch({ mpgCity: e.target.value === "" ? undefined : parseOptInt(e.target.value) })}
            />
          </div>
          <div>
            <label className={LABEL}>{t.app.labels.mpgHighway}</label>
            <input
              className={INPUT}
              inputMode="numeric"
              value={draft.mpgHighway ?? ""}
              onChange={(e) => onPatch({ mpgHighway: e.target.value === "" ? undefined : parseOptInt(e.target.value) })}
            />
          </div>
          <SelectWithOtherField
            label={t.app.labels.bodyStyle}
            options={BODY_STYLE_OPTIONS}
            optionLabels={t.taxonomy.bodyStyle}
            emptyLabel={t.taxonomy.selectEmpty}
            value={draft.bodyStyle}
            customValue={draft.bodyStyleCustom}
            onChange={({ value, custom }) => onPatch({ bodyStyle: value, bodyStyleCustom: custom })}
            customPlaceholder={t.app.hints.bodyPh}
            incompleteHint={t.app.hints.bodyStyle}
          />
          <SelectWithOtherField
            label={t.app.labels.exteriorColor}
            options={EXTERIOR_COLOR_OPTIONS}
            optionLabels={t.taxonomy.exterior}
            emptyLabel={t.taxonomy.selectEmpty}
            value={draft.exteriorColor}
            customValue={draft.exteriorColorCustom}
            onChange={({ value, custom }) => onPatch({ exteriorColor: value, exteriorColorCustom: custom })}
            customPlaceholder={t.app.hints.extPh}
            incompleteHint={t.app.hints.exterior}
          />
          <SelectWithOtherField
            label={t.app.labels.interiorColor}
            options={INTERIOR_COLOR_OPTIONS}
            optionLabels={t.taxonomy.interior}
            emptyLabel={t.taxonomy.selectEmpty}
            value={draft.interiorColor}
            customValue={draft.interiorColorCustom}
            onChange={({ value, custom }) => onPatch({ interiorColor: value, interiorColorCustom: custom })}
            customPlaceholder={t.app.hints.intPh}
            incompleteHint={t.app.hints.interior}
          />
          <div>
            <label className={LABEL}>{t.app.labels.doors}</label>
            <input className={INPUT} inputMode="numeric" value={draft.doors ?? ""} onChange={(e) => onPatch({ doors: parseOptInt(e.target.value) })} />
          </div>
          <div>
            <label className={LABEL}>{t.app.labels.seats}</label>
            <input className={INPUT} inputMode="numeric" value={draft.seats ?? ""} onChange={(e) => onPatch({ seats: parseOptInt(e.target.value) })} />
          </div>
          <SelectWithOtherField
            label={t.app.labels.titleStatus}
            options={TITLE_STATUS_OPTIONS}
            optionLabels={t.taxonomy.titleStatus}
            emptyLabel={t.taxonomy.selectEmpty}
            value={draft.titleStatus}
            customValue={draft.titleStatusCustom}
            onChange={({ value, custom }) => onPatch({ titleStatus: value, titleStatusCustom: custom })}
            customPlaceholder={t.app.hints.titlePh}
            incompleteHint={t.app.hints.titleStatus}
          />
        </div>
      </section>

      <section className={CARD}>
        <h3 className={SECTION}>{autosInventoryDrawerSectionHighlights(lang)}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {BADGE_OPTIONS.map(({ key }) => {
            const label = t.taxonomy.badges.find((b) => b.key === key)?.label ?? key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleBadge(key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  (draft.badges ?? []).includes(key)
                    ? "border-[color:var(--lx-gold)] bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)]"
                    : "border-[color:var(--lx-nav-border)] bg-[#FFFCF7] text-[color:var(--lx-text-2)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{t.app.equipmentHeading}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {FEATURE_OPTIONS.map((f, i) => (
            <label key={f} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[color:var(--lx-text-2)]">
              <input
                type="checkbox"
                checked={(draft.features ?? []).includes(f)}
                onChange={() => toggleFeature(f)}
                className="rounded border-[color:var(--lx-nav-border)]"
              />
              {t.taxonomy.features[i]}
            </label>
          ))}
        </div>
        <AutosCustomEquipmentField
          lang={lang}
          items={(draft.customEquipment ?? []).filter(Boolean)}
          onChange={(customEquipment) => onPatch({ customEquipment })}
        />
        <div className="mt-4">
          <label className={LABEL}>
            {lang === "es" ? "Otros equipos, mejoras o detalles" : "Other equipment, upgrades, or details"}
          </label>
          <textarea
            className={`${INPUT} mt-2 min-h-[90px]`}
            value={draft.otherEquipmentDetails ?? ""}
            onChange={(e) => onPatch({ otherEquipmentDetails: autosDraftTextValue(e.target.value) || undefined })}
          />
        </div>
      </section>

      <section className={CARD}>
        <h3 className={SECTION}>{autosInventoryDrawerSectionMedia(lang)}</h3>
        <div className="mt-3">
          <AutosNegociosMediaManager
            listing={mediaListing}
            setListingPatch={setMediaPatch}
            copy={copy}
            hideDealerLogo
            sectionId="autos-inventory-drawer-media"
          />
        </div>
      </section>

      <section className={CARD}>
        <h3 className={SECTION}>{autosInventoryDrawerSectionDescription(lang)}</h3>
        <textarea
          className={`${INPUT} mt-3 min-h-[120px]`}
          placeholder={t.app.placeholders.description}
          value={draft.description ?? ""}
          onChange={(e) => onPatch({ description: autosDraftTextValue(e.target.value) || undefined })}
        />
      </section>

      <section className={`${CARD} border-[#C9B46A]/50 bg-[#FAF7F2]`}>
        <h3 className={SECTION}>{autosInventoryDrawerSectionReview(lang)}</h3>
        <dl className="mt-3 space-y-2 text-sm text-[#2C2416]">
          <div className="flex justify-between gap-3">
            <dt className="font-semibold">{lang === "es" ? "Título" : "Title"}</dt>
            <dd className="text-right">{additionalInventoryVehicleTitle(draft)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold">{t.app.labels.price}</dt>
            <dd>{draft.price !== undefined ? `$${formatUsdIntegerInputDisplay(draft.price)}` : "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold">{t.app.labels.mileage}</dt>
            <dd>{draft.mileage !== undefined ? formatMileageInputDisplay(draft.mileage) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold">{lang === "es" ? "Fotos" : "Photos"}</dt>
            <dd>{autosInventoryBundlePhotoCount(lang, photoCount)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold">{lang === "es" ? "Estado" : "Status"}</dt>
            <dd>{status}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-[#6E5418]">{autosInventoryInheritedBusinessNotice(lang)}</p>
      </section>
    </div>
  );
}
