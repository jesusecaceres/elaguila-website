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
import { AutosVinDecodeBlock } from "@/app/publicar/autos/shared/components/AutosVinDecodeBlock";
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
  autosResultsCardLeonixIdNote,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import {
  formatMileageInputDisplay,
  formatUsdIntegerInputDisplay,
  parseMileageInput,
  parseUsdIntegerInput,
} from "@/app/clasificados/autos/shared/utils/autosNumericInputUi";
import { autosDraftTextValue } from "@/app/lib/clasificados/autos/autosPublishFormText";
import { autosDrawerNativeSelectProps } from "@/app/lib/clasificados/autos/autosDrawerNativeSelectInteraction";
import {
  autosVehicleCityHelper,
  autosVehicleCityPlaceholder,
  autosVehicleZipHelper,
} from "@/app/lib/clasificados/autos/autosVehicleLocationCopy";

import {
  AUTOS_NEGOCIOS_FORM_CARD,
  AUTOS_NEGOCIOS_FORM_GRID2,
  AUTOS_NEGOCIOS_FORM_INPUT,
  AUTOS_NEGOCIOS_FORM_LABEL,
  parseAutosNegociosOptInt,
} from "../lib/autosNegociosApplicationFormUi";

function stepVisible(steppedMode: boolean | undefined, activeStep: number | undefined, index: number): boolean {
  if (!steppedMode || activeStep === undefined) return true;
  return activeStep === index;
}

export type AutosNegociosVehicleApplicationMode = "main-negocios" | "inventory-child";

type Props = {
  mode: AutosNegociosVehicleApplicationMode;
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  listing: AutoDealerListing;
  onPatch: (patch: Partial<AutoDealerListing>) => void;
  vehicleTitleOverride: boolean;
  onVehicleTitleOverrideChange: (override: boolean) => void;
  autoTitlePreview: string;
  inventoryAddMode?: boolean;
  /** When set, only the matching step section renders (0–3, 5–6). Step 4 is inherited in child drawer. */
  activeStep?: number;
  steppedMode?: boolean;
  /** Inventory-child Step 7 review summary */
  includeChildReview?: boolean;
};

export function AutosNegociosVehicleApplicationSteps({
  mode,
  lang,
  copy,
  listing,
  onPatch,
  vehicleTitleOverride,
  onVehicleTitleOverrideChange,
  autoTitlePreview,
  inventoryAddMode = false,
  activeStep,
  steppedMode = false,
  includeChildReview = false,
}: Props) {
  const t = copy;
  const isChild = mode === "inventory-child";
  const draft = listing as AutosAdditionalInventoryVehicleDraft;

  const mediaListing = useMemo(
    () => (isChild ? inventoryVehicleDraftToListingSlice(draft) : listing),
    [isChild, draft, listing],
  );

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

  const sectionTitle = (step: number) => {
    if (step === 0) return t.app.sections.main;
    if (step === 1) return t.app.sections.specs;
    if (step === 2) return t.app.sections.badges;
    if (step === 3) return t.app.sections.media;
    if (step === 5) return t.app.sections.description;
    if (step === 6) return isChild ? autosInventoryDrawerSectionReview(lang) : t.app.sections.description;
    return "";
  };

  const CARD = AUTOS_NEGOCIOS_FORM_CARD;
  const LABEL = AUTOS_NEGOCIOS_FORM_LABEL;
  const INPUT = AUTOS_NEGOCIOS_FORM_INPUT;
  const GRID2 = AUTOS_NEGOCIOS_FORM_GRID2;
  const SECTION = "text-lg font-bold text-[color:var(--lx-text)]";
  const modalSelect = (extraClass = "") => autosDrawerNativeSelectProps(`${INPUT}${extraClass}`, isChild);

  useAutosVehicleStructuredSpecFill({
    lang,
    listing,
    onPatch,
  });

  return (
    <div className="space-y-5">
      {!steppedMode ? (
        <p className="rounded-xl border border-[#C9B46A]/40 bg-[#FFFCF7] px-4 py-3 text-xs leading-relaxed text-[#5C5346]">
          {autosInventoryInheritedBusinessNotice(lang)}
        </p>
      ) : null}

      {stepVisible(steppedMode, activeStep, 0) ? (
      <section className={CARD}>
        <h2 className={SECTION}>{sectionTitle(0)}</h2>
        {!isChild && (
          <>
            <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{t.app.sections.mainSub}</p>
            <p className="mt-3 rounded-xl border border-[color:var(--lx-gold-border)]/70 bg-[color:var(--lx-section)] px-4 py-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
              {inventoryAddMode ? t.app.dealer.inventoryAddHelper : t.app.dealer.inventoryMainHelper}
            </p>
          </>
        )}
        <div className={`${GRID2} mt-5`}>
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
              vinDetectedTrim={draft.vinDetectedTrim}
              onPatch={(p) => onPatch(p)}
              requiredMake
              requiredModel
              insideModal={isChild}
            />
          </div>
        </div>
        <div className="mt-5" data-autos-vin-decode-anchor={isChild ? "negocios-inventory-child" : "negocios-main"}>
          <AutosVinDecodeBlock
            lang={lang}
            vinLabel={t.app.labels.vin}
            vin={draft.vin}
            modelYear={draft.year}
            currentVehicle={draft}
            onVinChange={(v) => onPatch({ vin: v })}
            onApplyPatch={(patch) => onPatch(patch)}
          />
        </div>
        <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-semibold text-[color:var(--lx-text)]">{t.app.titleBlock.title}</label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[color:var(--lx-text-2)]">
              <input
                type="checkbox"
                checked={vehicleTitleOverride}
                onChange={(e) => onVehicleTitleOverrideChange(e.target.checked)}
                className="rounded border-[color:var(--lx-nav-border)]"
              />
              {t.app.titleBlock.customize}
            </label>
          </div>
          {!vehicleTitleOverride && !isChild ? (
            <p className="mt-1 text-[11px] text-[color:var(--lx-muted)]">{t.app.titleBlock.generatedNote}</p>
          ) : null}
          <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{t.app.titleBlock.hint}</p>
          <input
            className={`${INPUT} mt-2`}
            value={(vehicleTitleOverride ? listing.vehicleTitle : autoTitlePreview) ?? ""}
            readOnly={!vehicleTitleOverride}
            onChange={(e) => onPatch({ vehicleTitle: autosDraftTextValue(e.target.value) || undefined })}
          />
        </div>
        <div className={`${GRID2} mt-4`}>
          <div>
            <label className={LABEL}>{t.app.labels.condition}</label>
            <select
              {...modalSelect()}
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
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[color:var(--lx-muted)]" aria-hidden>
                $
              </span>
              <input
                className={`${INPUT} pl-7 tabular-nums`}
                inputMode="numeric"
                autoComplete="off"
                value={formatUsdIntegerInputDisplay(listing.price)}
                onChange={(e) => onPatch({ price: parseUsdIntegerInput(e.target.value) })}
                aria-label={t.app.labels.price}
              />
            </div>
            {!isChild ? <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.hints.priceInputHint}</p> : null}
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
              freeText
              placeholder={autosVehicleCityPlaceholder(lang)}
            />
            <p className="mt-1 text-[11px] text-[color:var(--lx-muted)]">
              {isChild ? autosInventoryDrawerLocationInheritHint(lang) : autosVehicleCityHelper(lang)}
            </p>
          </div>
          <div>
            <label className={LABEL}>{t.app.labels.state}</label>
            <select {...modalSelect()} value={draft.state ?? ""} onChange={(e) => onPatch({ state: e.target.value || undefined })}>
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
            <p className="mt-1 text-[11px] text-[color:var(--lx-muted)]">{autosVehicleZipHelper(lang)}</p>
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
      ) : null}

      {stepVisible(steppedMode, activeStep, 1) ? (
      <section className={CARD}>
        <h2 className={SECTION}>{sectionTitle(1)}</h2>
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
            insideModal={isChild}
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
            insideModal={isChild}
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
            year={draft.year}
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
            insideModal={isChild}
          />
          <div>
            <label className={LABEL}>{t.app.labels.mpgCity}</label>
            <input
              className={INPUT}
              inputMode="numeric"
              value={draft.mpgCity ?? ""}
              onChange={(e) => onPatch({ mpgCity: e.target.value === "" ? undefined : parseAutosNegociosOptInt(e.target.value) })}
            />
          </div>
          <div>
            <label className={LABEL}>{t.app.labels.mpgHighway}</label>
            <input
              className={INPUT}
              inputMode="numeric"
              value={draft.mpgHighway ?? ""}
              onChange={(e) => onPatch({ mpgHighway: e.target.value === "" ? undefined : parseAutosNegociosOptInt(e.target.value) })}
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
            insideModal={isChild}
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
            insideModal={isChild}
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
            insideModal={isChild}
          />
          <div>
            <label className={LABEL}>{t.app.labels.doors}</label>
            <input className={INPUT} inputMode="numeric" value={listing.doors ?? ""} onChange={(e) => onPatch({ doors: parseAutosNegociosOptInt(e.target.value) })} />
          </div>
          <div>
            <label className={LABEL}>{t.app.labels.seats}</label>
            <input className={INPUT} inputMode="numeric" value={listing.seats ?? ""} onChange={(e) => onPatch({ seats: parseAutosNegociosOptInt(e.target.value) })} />
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
            insideModal={isChild}
          />
        </div>
      </section>
      ) : null}

      {stepVisible(steppedMode, activeStep, 2) ? (
      <section className={CARD}>
        <h2 className={SECTION}>{sectionTitle(2)}</h2>
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
      ) : null}

      {stepVisible(steppedMode, activeStep, 3) ? (
      isChild ? (
      <section className={CARD}>
        <h2 className={SECTION}>{sectionTitle(3)}</h2>
        <div className="mt-3">
          <AutosNegociosMediaManager
            listing={mediaListing}
            setListingPatch={setMediaPatch}
            copy={copy}
            hideDealerLogo
            sectionId="autos-inventory-child-media"
            lang={lang}
            insideModal
          />
        </div>
      </section>
      ) : (
      <div className="min-w-0">
        <AutosNegociosMediaManager listing={listing} setListingPatch={onPatch} copy={copy} hideDealerLogo lang={lang} />
      </div>
      )
      ) : null}

      {stepVisible(steppedMode, activeStep, 5) ? (
      <section className={CARD}>
        <h2 className={SECTION}>{sectionTitle(5)}</h2>
        <textarea
          className={`${INPUT} mt-3 min-h-[120px]`}
          placeholder={t.app.placeholders.description}
          value={draft.description ?? ""}
          onChange={(e) => onPatch({ description: autosDraftTextValue(e.target.value) || undefined })}
        />
      </section>
      ) : null}

      {includeChildReview && stepVisible(steppedMode, activeStep, 6) ? (
      <section className={`${CARD} border-[color:var(--lx-gold-border)]/50 bg-[color:var(--lx-section)]/60`}>
        <h2 className={SECTION}>{sectionTitle(6)}</h2>
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
        {steppedMode ? (
          <p className="mt-3 text-xs text-[#6E5418]">{autosResultsCardLeonixIdNote(lang)}</p>
        ) : (
          <p className="mt-3 text-xs text-[#6E5418]">{autosInventoryInheritedBusinessNotice(lang)}</p>
        )}
      </section>
      ) : null}
    </div>
  );
}
