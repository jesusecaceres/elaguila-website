"use client";

import { useRouter } from "next/navigation";
import { AutosApplicationTopActions } from "@/app/publicar/autos/shared/components/AutosApplicationTopActions";
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
import { AUTOS_PRIVADO_PRODUCT } from "@/app/clasificados/autos/privado/contracts/autosPrivadoProduct";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-5";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const GRID2 = "grid gap-4 sm:grid-cols-2";

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

function parseOptInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseOptFloat(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : undefined;
}

export function AutosPrivadoApplication() {
  const router = useRouter();
  const { lang, t } = useAutosPrivadoLang();
  const {
    hydrated,
    vehicleTitleOverride,
    setVehicleTitleOverrideState,
    listing,
    setListingPatch,
    resetDraft,
    flushDraft,
  } = useAutoPrivadoDraft();

  const autoTitlePreview = useMemo(
    () => buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim),
    [listing.year, listing.make, listing.model, listing.trim],
  );

  useEffect(() => {
    document.title = t.meta.applicationTitle;
  }, [t.meta.applicationTitle]);

  const previewHref = withLangParam("/clasificados/autos/privado/preview", lang);
  const publishConfirmHref = withLangParam("/publicar/autos/privado/confirm", lang);

  if (!hydrated) {
    return <div className="min-h-[40vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  function toggleFeature(label: string) {
    const cur = new Set(listing.features ?? []);
    if (cur.has(label)) cur.delete(label);
    else cur.add(label);
    setListingPatch({ features: [...cur] });
  }

  const siteMessageOn = listing.privadoSiteMessageEnabled !== false;

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-20 text-[color:var(--lx-text)]"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.16), transparent 55%)",
      }}
    >
      <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
        <header className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">{t.app.kicker}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--lx-text)] md:text-4xl">{t.app.pageTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)]">{t.app.intro}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[color:var(--lx-muted)]">
            <span className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-1">
              {t.app.badgeLocal}
            </span>
            <span className="rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-3 py-1 text-[color:var(--lx-text-2)]">
              {t.app.badgeAutosave}
            </span>
          </div>
          <div
            className="mt-5 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-3 text-sm leading-relaxed text-[color:var(--lx-text-2)] shadow-sm"
            role="note"
          >
            <p className="font-semibold text-[color:var(--lx-text)]">{t.app.noteTitle}</p>
            <p className="mt-1 text-[13px] text-[color:var(--lx-muted)]">{t.app.noteBody}</p>
          </div>
          <details className="mt-5 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-3 text-sm text-[color:var(--lx-text-2)] shadow-sm open:pb-4">
            <summary className="cursor-pointer list-none font-semibold text-[color:var(--lx-text)] [&::-webkit-details-marker]:hidden">
              {lang === "es" ? "Paquete Privado (vista rápida)" : "Private package (quick view)"}
            </summary>
            <div className="mt-3 space-y-3 text-[13px] leading-relaxed">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">
                  {lang === "es" ? "Incluye" : "Includes"}
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {AUTOS_PRIVADO_PRODUCT.includes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">
                  {lang === "es" ? "No incluye" : "Does not include"}
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {AUTOS_PRIVADO_PRODUCT.excludes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        </header>

        <AutosApplicationTopActions
          lane="privado"
          copy={t}
          listing={listing}
          mediaSectionId="autos-clasificados-app-media"
          onFlushOpenSameTab={async () => {
            await flushDraft();
            router.push(previewHref);
          }}
          onFlushOpenNewTab={async () => {
            await flushDraft();
            window.open(previewHref, "_blank", "noopener,noreferrer");
          }}
          onDeleteApplication={resetDraft}
          publishConfirmHref={publishConfirmHref}
        />

        <div className="flex flex-col gap-5 sm:gap-6">
          {/* A — Principal (alineado con Negocios; sin pago mensual ni stock) */}
          <section className={CARD}>
            <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{t.app.sections.main}</h2>
            <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{t.app.sections.mainSub}</p>
            <div className={`${GRID2} mt-5`}>
              <div>
                <label className={LABEL}>{reqLabel(t.app.labels.year)}</label>
                <input
                  className={INPUT}
                  inputMode="numeric"
                  value={listing.year ?? ""}
                  onChange={(e) => setListingPatch({ year: parseOptInt(e.target.value) })}
                />
              </div>
              <div>
                <label className={LABEL}>{reqLabel(t.app.labels.make)}</label>
                <input
                  className={INPUT}
                  value={listing.make ?? ""}
                  onChange={(e) => setListingPatch({ make: e.target.value || undefined })}
                />
              </div>
              <div>
                <label className={LABEL}>{reqLabel(t.app.labels.model)}</label>
                <input
                  className={INPUT}
                  value={listing.model ?? ""}
                  onChange={(e) => setListingPatch({ model: e.target.value || undefined })}
                />
              </div>
              <div>
                <label className={LABEL}>{t.app.labels.trim}</label>
                <input
                  className={INPUT}
                  value={listing.trim ?? ""}
                  onChange={(e) => setListingPatch({ trim: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-[color:var(--lx-text)]">{t.app.titleBlock.title}</label>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[color:var(--lx-text-2)]">
                  <input
                    type="checkbox"
                    checked={vehicleTitleOverride}
                    onChange={(e) => setVehicleTitleOverrideState(e.target.checked)}
                    className="rounded border-[color:var(--lx-nav-border)]"
                  />
                  {t.app.titleBlock.customize}
                </label>
              </div>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{t.app.titleBlock.hint}</p>
              <input
                className={`${INPUT} mt-2`}
                value={(vehicleTitleOverride ? listing.vehicleTitle : autoTitlePreview) ?? ""}
                readOnly={!vehicleTitleOverride}
                onChange={(e) => setListingPatch({ vehicleTitle: e.target.value || undefined })}
              />
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
                <input
                  className={INPUT}
                  inputMode="decimal"
                  value={listing.price ?? ""}
                  onChange={(e) => setListingPatch({ price: parseOptFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className={LABEL}>{t.app.labels.mileage}</label>
                <input
                  className={INPUT}
                  inputMode="numeric"
                  value={listing.mileage ?? ""}
                  onChange={(e) => setListingPatch({ mileage: parseOptFloat(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>{reqLabel(t.app.labels.city)}</label>
                <CityAutocomplete
                  value={listing.city ?? ""}
                  onChange={(v) => setListingPatch({ city: v || undefined })}
                  lang={lang}
                  variant="brForm"
                  placeholder={t.app.placeholders.city}
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.hints.cityNorCal}</p>
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
                <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.hints.zip}</p>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>{t.app.labels.vin}</label>
                <input
                  className={INPUT}
                  value={listing.vin ?? ""}
                  onChange={(e) => setListingPatch({ vin: e.target.value || undefined })}
                />
              </div>
            </div>
          </section>

          {/* B — Especificaciones (sin motor, MPG, puertas ni asientos en Privado) */}
          <section className={CARD}>
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
          <section className={CARD}>
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
          </section>

          {/* D — Multimedia */}
          <AutosNegociosMediaManager
            listing={listing}
            setListingPatch={setListingPatch}
            copy={t}
            hideDealerLogo
            sectionId="autos-clasificados-app-media"
          />

          {/* E — Vendedor / contacto */}
          <section className={CARD}>
            <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{t.app.sections.dealer}</h2>
            <p className="mt-1 text-sm text-[color:var(--lx-muted)]">
              {lang === "es"
                ? "Nombre y canales de contacto. Sin sitio web, citas ni redes en este paquete."
                : "Name and contact channels. No website, booking, or social profiles in this package."}
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
                  className={INPUT}
                  inputMode="tel"
                  autoComplete="tel"
                  value={listing.dealerPhoneOffice ?? ""}
                  onChange={(e) => setListingPatch({ dealerPhoneOffice: e.target.value || undefined })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>{t.app.labels.whatsapp}</label>
                <input
                  className={INPUT}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t.app.placeholders.whatsapp}
                  value={listing.dealerWhatsapp ?? ""}
                  onChange={(e) => setListingPatch({ dealerWhatsapp: e.target.value.trim() ? e.target.value : undefined })}
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
                  onChange={(e) => setListingPatch({ dealerEmail: e.target.value.trim() ? e.target.value : undefined })}
                />
              </div>
              <div className="sm:col-span-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-3">
                <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-[color:var(--lx-text)]">
                  <input
                    type="checkbox"
                    checked={siteMessageOn}
                    onChange={(e) => setListingPatch({ privadoSiteMessageEnabled: e.target.checked })}
                    className="mt-0.5 rounded border-[color:var(--lx-nav-border)]"
                  />
                  <span>
                    {t.app.labels.siteMessageCta}
                    <span className="mt-1 block text-xs font-normal text-[color:var(--lx-muted)]">{t.app.labels.siteMessageCtaHint}</span>
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* F — Descripción */}
          <section className={CARD}>
            <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{t.app.sections.description}</h2>
            <textarea
              className={`${INPUT} mt-3 min-h-[140px]`}
              placeholder={t.app.placeholders.description}
              value={listing.description ?? ""}
              onChange={(e) => setListingPatch({ description: e.target.value || undefined })}
            />
          </section>

        </div>
      </div>
    </div>
  );
}
