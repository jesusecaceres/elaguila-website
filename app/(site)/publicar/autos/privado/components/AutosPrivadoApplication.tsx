"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AutosApplicationFinalActions } from "@/app/publicar/autos/shared/components/AutosApplicationFinalActions";
import { AutosApplicationMissingItemsBanner } from "@/app/publicar/autos/shared/components/AutosApplicationMissingItemsBanner";
import { useEffect, useMemo } from "react";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { useAutosPrivadoLang } from "@/app/clasificados/autos/privado/lib/useAutosPrivadoLang";
import { useAutoPrivadoDraft } from "@/app/publicar/autos/privado/hooks/useAutoPrivadoDraft";
import { buildVehicleTitle } from "@/app/publicar/autos/negocios/lib/autoDealerTitle";
import {
  BODY_STYLE_OPTIONS,
  DRIVETRAIN_OPTIONS,
  EXTERIOR_COLOR_OPTIONS,
  FEATURE_OPTIONS,
  FUEL_OPTIONS,
  INTERIOR_COLOR_OPTIONS,
  TITLE_STATUS_OPTIONS,
  TRANSMISSION_OPTIONS,
  US_STATE_OPTIONS,
} from "@/app/publicar/autos/negocios/lib/autoDealerTaxonomy";
import { SelectWithOtherField } from "@/app/publicar/autos/negocios/components/SelectWithOtherField";
import { AutosNegociosMediaManager } from "@/app/publicar/autos/negocios/components/AutosNegociosMediaManager";
import {
  formatMileageInputDisplay,
  formatUsdIntegerInputDisplay,
  parseMileageInput,
  parseUsdIntegerInput,
} from "@/app/clasificados/autos/shared/utils/autosNumericInputUi";
import { formatPhoneInputDisplay } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { getAutosPreviewBlockingStepIndices } from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import { autosDraftTextValue } from "@/app/lib/clasificados/autos/autosPublishFormText";
import {
  autosVehicleCityHelper,
  autosVehicleCityPlaceholder,
  autosVehicleZipHelper,
} from "@/app/lib/clasificados/autos/autosVehicleLocationCopy";
import { AUTOS_PUBLISH_FINAL_STEP_INDEX } from "@/app/lib/clasificados/autos/autosEditorDraftStep";
import { AutosApplicationSteppedShell } from "@/app/publicar/autos/shared/components/AutosApplicationSteppedShell";
import { AutosPublishApplicationHeader } from "@/app/publicar/autos/shared/components/AutosPublishApplicationHeader";
import { AutosApplicationReviewStep } from "@/app/publicar/autos/shared/components/AutosApplicationReviewStep";
import { getAutosApplicationStepLabels } from "@/app/publicar/autos/shared/lib/autosApplicationStepShellCopy";
import { AutosVehicleIdentityFields } from "@/app/publicar/autos/shared/components/AutosVehicleIdentityFields";
import { AutosVinDecodeBlock } from "@/app/publicar/autos/shared/components/AutosVinDecodeBlock";
import { AutosDraftSessionRestoredBanner } from "@/app/publicar/autos/shared/components/AutosDraftSessionRestoredBanner";
import { AutosPricingPlanBanner } from "@/app/publicar/autos/shared/components/AutosPricingPlanBanner";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-6";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3.5 py-2.5 text-[15px] leading-snug text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const GRID2 = "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4";

function reqLabel(label: string) {
  return (
    <>
      {label}{" "}
      <span className="text-red-800" aria-hidden>
        *
      </span>
    </>
  );
}

export function AutosPrivadoApplication() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { lang, routeLang, t } = useAutosPrivadoLang();
  const {
    hydrated,
    restoredFromSession,
    listing,
    setListingPatch,
    resetDraft,
    flushDraft,
    editorStep,
    editorMaxReached,
    setEditorProgress,
  } = useAutoPrivadoDraft();

  const autoTitlePreview = useMemo(
    () => buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim),
    [listing.year, listing.make, listing.model, listing.trim],
  );

  useEffect(() => {
    document.title = t.meta.applicationTitle;
  }, [t.meta.applicationTitle]);

  useEffect(() => {
    if (!hydrated) return;
    if (!searchParams || !pathname) return;
    if (searchParams.get("resume") !== "1") return;
    const p = new URLSearchParams(searchParams.toString());
    p.delete("resume");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [hydrated, pathname, router, searchParams]);

  const stepLabels = getAutosApplicationStepLabels(lang, "privado");
  const stepBlockWarnings = useMemo(() => getAutosPreviewBlockingStepIndices("privado", listing), [listing]);

  const previewHref = withLangParam("/clasificados/autos/privado/preview", routeLang);

  if (!hydrated) {
    return <div className="min-h-[40vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  function toggleFeature(label: string) {
    const cur = new Set(listing.features ?? []);
    if (cur.has(label)) cur.delete(label);
    else cur.add(label);
    setListingPatch({ features: [...cur] });
  }

  return (
    <AutosApplicationSteppedShell
      lang={lang}
      lane="privado"
      stepLabels={stepLabels}
      stepBlockWarnings={stepBlockWarnings}
      initialStep={editorStep}
      initialMaxReached={editorMaxReached}
      onStepChange={setEditorProgress}
      header={
        <AutosPublishApplicationHeader
          lang={lang}
          lane="privado"
          title={t.app.pageTitle}
          helper={t.app.intro}
          draftLabel={t.app.badgeLocal}
          banner={
            <>
              <AutosPricingPlanBanner lang={lang} lane="privado" />
              <AutosDraftSessionRestoredBanner lang={lang} restoredFromSession={restoredFromSession} />
            </>
          }
        />
      }
      topActions={(stepCtx) =>
        stepCtx.activeStep >= stepCtx.stepCount - 1 ? null : (
          <AutosApplicationMissingItemsBanner lane="privado" lang={lang} copy={t} listing={listing} stepCtx={stepCtx} />
        )
      }
    >
      {(ctx) => {
        const { activeStep } = ctx;
        return (
        <>
          {/* A — Principal (alineado con Negocios; sin pago mensual ni stock) */}
          <section className={`${CARD} ${activeStep === 0 ? "" : "hidden"}`} aria-hidden={activeStep !== 0}>
            <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{t.app.sections.main}</h2>
            <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{t.app.sections.mainSub}</p>
            <div className={`${GRID2} mt-5`}>
              <AutosVehicleIdentityFields
                lang={lang}
                labels={{
                  year: t.app.labels.year,
                  make: t.app.labels.make,
                  model: t.app.labels.model,
                  trim: t.app.labels.trim,
                }}
                year={listing.year}
                make={listing.make}
                model={listing.model}
                trim={listing.trim}
                vinDetectedTrim={listing.vinDetectedTrim}
                onPatch={(p) => setListingPatch(p)}
                requiredYear
                requiredMake
                requiredModel
              />
            </div>

            <div className="mt-5" data-autos-vin-decode-anchor="privado-main">
              <AutosVinDecodeBlock
                lang={lang}
                vinLabel={t.app.labels.vin}
                vin={listing.vin}
                modelYear={listing.year}
                currentVehicle={listing}
                onVinChange={(v) => setListingPatch({ vin: v })}
                onApplyPatch={(patch) => setListingPatch(patch)}
              />
            </div>

            <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4">
              <p className="text-sm font-semibold text-[color:var(--lx-text)]">
                {lang === "es" ? "Título del anuncio" : "Listing headline"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">
                {lang === "es"
                  ? "Se arma automáticamente con año, marca, modelo y versión para mantener filtros y búsqueda consistentes."
                  : "Built automatically from year, make, model, and trim so search and filters stay consistent."}
              </p>
              <p
                className="mt-3 text-lg font-bold leading-snug tracking-tight text-[color:var(--lx-text)]"
                aria-live="polite"
              >
                {autoTitlePreview || (lang === "es" ? "Completa año, marca y modelo" : "Add year, make, and model")}
              </p>
            </div>

            <div className={`${GRID2} mt-4`}>
              <div>
                <label className={LABEL}>{t.app.labels.condition}</label>
                <select
                  className={INPUT}
                  value={listing.condition ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setListingPatch({
                      condition: v === "" ? undefined : (v as AutoDealerListing["condition"]),
                    });
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
                <label className={LABEL}>{reqLabel(t.app.labels.price)}</label>
                <div className="relative mt-1">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[color:var(--lx-muted)]"
                    aria-hidden
                  >
                    $
                  </span>
                  <input
                    className={`${INPUT} pl-7 tabular-nums`}
                    inputMode="numeric"
                    autoComplete="off"
                    value={formatUsdIntegerInputDisplay(listing.price)}
                    onChange={(e) => setListingPatch({ price: parseUsdIntegerInput(e.target.value) })}
                    aria-label={t.app.labels.price}
                  />
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.hints.priceInputHint}</p>
              </div>
              <div>
                <label className={LABEL}>{t.app.labels.mileage}</label>
                <input
                  className={`${INPUT} tabular-nums`}
                  inputMode="numeric"
                  autoComplete="off"
                  value={formatMileageInputDisplay(listing.mileage)}
                  onChange={(e) => setListingPatch({ mileage: parseMileageInput(e.target.value) })}
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.hints.mileageInputHint}</p>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>{reqLabel(t.app.labels.city)}</label>
                <CityAutocomplete
                  value={listing.city ?? ""}
                  onChange={(v) => setListingPatch({ city: v || undefined })}
                  lang={lang}
                  variant="brForm"
                  freeText
                  placeholder={autosVehicleCityPlaceholder(lang)}
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{autosVehicleCityHelper(lang)}</p>
              </div>
              <div>
                <label className={LABEL}>{reqLabel(t.app.labels.state)}</label>
                <select
                  className={INPUT}
                  value={listing.state ?? ""}
                  onChange={(e) => setListingPatch({ state: e.target.value || undefined })}
                >
                  {US_STATE_OPTIONS.map((s) => (
                    <option key={s || "empty"} value={s}>
                      {s || t.taxonomy.selectEmpty}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>{reqLabel(t.app.labels.zip)}</label>
                <input
                  className={INPUT}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  placeholder={t.app.placeholders.zip}
                  value={listing.zip ?? ""}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(0, 5);
                    setListingPatch({ zip: d ? d : undefined });
                  }}
                  aria-label={t.app.labels.zip}
                />
                <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{autosVehicleZipHelper(lang)}</p>
              </div>
            </div>
          </section>

          {/* B — Especificaciones (sin motor, MPG, puertas ni asientos en Privado) */}
          <section className={`${CARD} ${activeStep === 1 ? "" : "hidden"}`} aria-hidden={activeStep !== 1}>
            <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{t.app.sections.specs}</h2>
            <div className={`${GRID2} mt-5`}>
              <SelectWithOtherField
                label={t.app.labels.transmission}
                options={TRANSMISSION_OPTIONS}
                optionLabels={t.taxonomy.transmission}
                emptyLabel={t.taxonomy.selectEmpty}
                value={listing.transmission}
                customValue={listing.transmissionCustom}
                onChange={({ value, custom }) =>
                  setListingPatch({ transmission: value, transmissionCustom: custom })
                }
                customPlaceholder={t.app.hints.transPh}
                incompleteHint={t.app.hints.transmission}
              />
              <SelectWithOtherField
                label={t.app.labels.drivetrain}
                options={DRIVETRAIN_OPTIONS}
                optionLabels={t.taxonomy.drivetrain}
                emptyLabel={t.taxonomy.selectEmpty}
                value={listing.drivetrain}
                customValue={listing.drivetrainCustom}
                onChange={({ value, custom }) =>
                  setListingPatch({ drivetrain: value, drivetrainCustom: custom })
                }
                customPlaceholder={t.app.hints.drivePh}
                incompleteHint={t.app.hints.drivetrain}
              />
              <SelectWithOtherField
                label={t.app.labels.fuel}
                options={FUEL_OPTIONS}
                optionLabels={t.taxonomy.fuel}
                emptyLabel={t.taxonomy.selectEmpty}
                value={listing.fuelType}
                customValue={listing.fuelTypeCustom}
                onChange={({ value, custom }) => setListingPatch({ fuelType: value, fuelTypeCustom: custom })}
                customPlaceholder={t.app.hints.fuelPh}
                incompleteHint={t.app.hints.fuel}
              />
              <SelectWithOtherField
                label={t.app.labels.bodyStyle}
                options={BODY_STYLE_OPTIONS}
                optionLabels={t.taxonomy.bodyStyle}
                emptyLabel={t.taxonomy.selectEmpty}
                value={listing.bodyStyle}
                customValue={listing.bodyStyleCustom}
                onChange={({ value, custom }) => setListingPatch({ bodyStyle: value, bodyStyleCustom: custom })}
                customPlaceholder={t.app.hints.bodyPh}
                incompleteHint={t.app.hints.bodyStyle}
              />
              <SelectWithOtherField
                label={t.app.labels.exteriorColor}
                options={EXTERIOR_COLOR_OPTIONS}
                optionLabels={t.taxonomy.exterior}
                emptyLabel={t.taxonomy.selectEmpty}
                value={listing.exteriorColor}
                customValue={listing.exteriorColorCustom}
                onChange={({ value, custom }) =>
                  setListingPatch({ exteriorColor: value, exteriorColorCustom: custom })
                }
                customPlaceholder={t.app.hints.extPh}
                incompleteHint={t.app.hints.exterior}
              />
              <SelectWithOtherField
                label={t.app.labels.interiorColor}
                options={INTERIOR_COLOR_OPTIONS}
                optionLabels={t.taxonomy.interior}
                emptyLabel={t.taxonomy.selectEmpty}
                value={listing.interiorColor}
                customValue={listing.interiorColorCustom}
                onChange={({ value, custom }) =>
                  setListingPatch({ interiorColor: value, interiorColorCustom: custom })
                }
                customPlaceholder={t.app.hints.intPh}
                incompleteHint={t.app.hints.interior}
              />
              <SelectWithOtherField
                label={t.app.labels.titleStatus}
                options={TITLE_STATUS_OPTIONS}
                optionLabels={t.taxonomy.titleStatus}
                emptyLabel={t.taxonomy.selectEmpty}
                value={listing.titleStatus}
                customValue={listing.titleStatusCustom}
                onChange={({ value, custom }) =>
                  setListingPatch({ titleStatus: value, titleStatusCustom: custom })
                }
                customPlaceholder={t.app.hints.titlePh}
                incompleteHint={t.app.hints.titleStatus}
              />
            </div>
          </section>

          {/* C — Destacados (solo equipamiento; sin insignias de concesionario) */}
          <section className={`${CARD} ${activeStep === 2 ? "" : "hidden"}`} aria-hidden={activeStep !== 2}>
            <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{t.app.sections.badges}</h2>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{t.app.equipmentHeading}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {FEATURE_OPTIONS.map((f, i) => (
                <label key={f} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[color:var(--lx-text-2)]">
                  <input
                    type="checkbox"
                    checked={(listing.features ?? []).includes(f)}
                    onChange={() => toggleFeature(f)}
                    className="rounded border-[color:var(--lx-nav-border)]"
                  />
                  {t.taxonomy.features[i]}
                </label>
              ))}
            </div>
            <div className="mt-8">
              <label className={LABEL}>
                {lang === "es" ? "Otros equipos, mejoras o detalles" : "Other equipment, upgrades, or details"}
              </label>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">
                {lang === "es"
                  ? "Agrega mejoras, equipo no listado, mantenimiento reciente o detalles importantes."
                  : "Add upgrades, unlisted equipment, recent maintenance, or important details."}
              </p>
              <textarea
                className={`${INPUT} mt-2 min-h-[100px]`}
                value={listing.otherEquipmentDetails ?? ""}
                onChange={(e) => setListingPatch({ otherEquipmentDetails: e.target.value || undefined })}
              />
            </div>
          </section>

          {/* D — Multimedia */}
          <div className={activeStep === 3 ? "" : "hidden"} aria-hidden={activeStep !== 3}>
            <AutosNegociosMediaManager
              listing={listing}
              setListingPatch={setListingPatch}
              copy={t}
              hideDealerLogo
              sectionId="autos-clasificados-app-media"
              lang={lang}
            />
          </div>

          {/* E — Vendedor / contacto */}
          <section className={`${CARD} ${activeStep === 4 ? "" : "hidden"}`} aria-hidden={activeStep !== 4}>
            <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{t.app.sections.dealer}</h2>
            <p className="mt-1 text-sm text-[color:var(--lx-muted)]">
              {lang === "es"
                ? "Nombre y canales de contacto reales para compradores. Privado no muestra perfil, redes o herramientas de dealer."
                : "Real contact channels for buyers. Private listings do not show dealer profiles, socials, or business tools."}
            </p>
            <p className="mt-2 text-xs font-semibold text-[color:var(--lx-text-2)]">
              <span className="text-red-800" aria-hidden>
                *
              </span>{" "}
              {t.app.hints.previewNeed_sellerContact}
            </p>
            <div className={`${GRID2} mt-5`}>
              <div className="sm:col-span-2">
                <label className={LABEL}>{t.app.labels.dealerName}</label>
                <input
                  className={INPUT}
                  value={listing.dealerName ?? ""}
                  onChange={(e) => setListingPatch({ dealerName: e.target.value || undefined })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>{t.app.labels.phoneOffice}</label>
                <input
                  className={`${INPUT} tabular-nums`}
                  inputMode="tel"
                  autoComplete="tel"
                  value={formatPhoneInputDisplay(listing.dealerPhoneOffice ?? "")}
                  onChange={(e) => {
                    const v = formatPhoneInputDisplay(e.target.value);
                    setListingPatch({ dealerPhoneOffice: v.trim() ? v : undefined });
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>{t.app.labels.whatsapp}</label>
                <input
                  className={`${INPUT} tabular-nums`}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t.app.placeholders.whatsapp}
                  value={formatPhoneInputDisplay(listing.dealerWhatsapp ?? "")}
                  onChange={(e) => {
                    const v = formatPhoneInputDisplay(e.target.value);
                    setListingPatch({ dealerWhatsapp: v.trim() ? v : undefined });
                  }}
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.hints.whatsapp}</p>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>{t.app.labels.sellerEmail}</label>
                <input
                  className={INPUT}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={listing.dealerEmail ?? ""}
                  onChange={(e) => setListingPatch({ dealerEmail: autosDraftTextValue(e.target.value) })}
                />
              </div>
            </div>
          </section>

          {/* F — Descripción */}
          <section className={`${CARD} ${activeStep === 5 ? "" : "hidden"}`} aria-hidden={activeStep !== 5}>
            <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{t.app.sections.description}</h2>
            <textarea
              className={`${INPUT} mt-3 min-h-[140px]`}
              placeholder={t.app.placeholders.description}
              value={listing.description ?? ""}
              onChange={(e) => setListingPatch({ description: e.target.value || undefined })}
            />
          </section>

          <div className={activeStep === 6 ? "" : "hidden"} aria-hidden={activeStep !== 6}>
            <AutosApplicationReviewStep lane="privado" listing={listing} copy={t} lang={lang} />
            <AutosApplicationFinalActions
              lane="privado"
              lang={lang}
              copy={t}
              listing={listing}
              stepCtx={ctx}
              flushDraft={flushDraft}
              onPreview={async () => {
                const finalStep = AUTOS_PUBLISH_FINAL_STEP_INDEX;
                setEditorProgress(finalStep, Math.max(editorMaxReached, finalStep));
                await flushDraft({
                  editorStep: finalStep,
                  editorMaxReached: Math.max(editorMaxReached, finalStep),
                });
                router.push(previewHref);
              }}
              onDeleteApplication={resetDraft}
            />
          </div>
        </>
        );
      }}
    </AutosApplicationSteppedShell>
  );
}
