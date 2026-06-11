"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AutosApplicationFinalActions } from "@/app/publicar/autos/shared/components/AutosApplicationFinalActions";
import { AutosApplicationMissingItemsBanner } from "@/app/publicar/autos/shared/components/AutosApplicationMissingItemsBanner";
import type {
  AutoDealerListing,
  DealerCustomLink,
} from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeDealerCustomLinks } from "@/app/lib/clasificados/autos/autosDealerCustomLinks";
import { useAutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/useAutosNegociosLang";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { useAutoDealerDraft } from "../hooks/useAutoDealerDraft";
import { buildVehicleTitle } from "../lib/autoDealerTitle";
import { AutosNegociosVehicleApplicationSteps } from "./AutosNegociosVehicleApplicationSteps";
import { AutosApplicationSteppedShell } from "@/app/publicar/autos/shared/components/AutosApplicationSteppedShell";
import { AutosPublishApplicationHeader } from "@/app/publicar/autos/shared/components/AutosPublishApplicationHeader";
import { AutosApplicationReviewStep } from "@/app/publicar/autos/shared/components/AutosApplicationReviewStep";
import { AutosNegociosInventoryValueModule } from "./AutosNegociosInventoryValueModule";
import { AutosNegociosInventoryBundlePreview } from "./AutosNegociosInventoryBundlePreview";
import { AutosNegociosResultsCardPreview } from "./AutosNegociosResultsCardPreview";
import { getAutosApplicationStepLabels } from "@/app/publicar/autos/shared/lib/autosApplicationStepShellCopy";
import { AutosDealerStructuredAddressFields } from "@/app/publicar/autos/shared/components/AutosDealerStructuredAddressFields";
import { AutosDealerLogoUpload } from "@/app/publicar/autos/shared/components/AutosDealerLogoUpload";
import { AutosDealerFinanceFields } from "@/app/publicar/autos/shared/components/AutosDealerFinanceFields";
import { AutosDealerHoursEditor } from "@/app/publicar/autos/shared/components/AutosDealerHoursEditor";
import { syncDealerAddressFromStructured } from "@/app/lib/clasificados/autos/autosDealerStructuredAddress";
import {
  formatUsdIntegerInputDisplay,
  parseUsdIntegerInput,
} from "@/app/clasificados/autos/shared/utils/autosNumericInputUi";
import { formatPhoneInputDisplay } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { getAutosPreviewBlockingStepIndices } from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import { autosDraftTextValue, autosDraftUrlValue } from "@/app/lib/clasificados/autos/autosPublishFormText";
import { AUTOS_PUBLISH_FINAL_STEP_INDEX } from "@/app/lib/clasificados/autos/autosEditorDraftStep";

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

function newHourRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `custom-${Date.now()}`;
}

export function AutosNegociosApplication() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { lang, t } = useAutosNegociosLang();
  const {
    hydrated,
    vehicleTitleOverride,
    setVehicleTitleOverrideState,
    listing,
    setListingPatch,
    resetDraft,
    flushDraft,
    updateDealerHourRow,
    removeDealerHourRow,
    inventoryAddMode,
    inventoryAddContext,
    editorStep,
    editorMaxReached,
    setEditorProgress,
    additionalInventoryVehicles,
    upsertAdditionalInventoryVehicle,
    removeAdditionalInventoryVehicle,
    inProgressInventoryVehicleDraft,
    updateInProgressInventoryVehicleDraft,
    inventoryDrawerOpen,
    inventoryDrawerEditingId,
    setInventoryDrawerOpen,
  } = useAutoDealerDraft();

  const inventoryDrawerProps = {
    drawerOpen: inventoryDrawerOpen,
    drawerEditingId: inventoryDrawerEditingId,
    onDrawerOpenChange: setInventoryDrawerOpen,
    inProgressDraft: inProgressInventoryVehicleDraft,
    onInProgressChange: updateInProgressInventoryVehicleDraft,
    onEditParentDealerStep: () => {
      setInventoryDrawerOpen(false, null);
      setEditorProgress(4, Math.max(editorMaxReached, 4));
    },
  };

  const autoTitlePreview = useMemo(
    () => buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim),
    [listing.year, listing.make, listing.model, listing.trim],
  );

  useEffect(() => {
    document.title = t.meta.applicationTitle;
  }, [t.meta.applicationTitle]);

  useEffect(() => {
    if (!hydrated || !searchParams || !pathname) return;
    if (searchParams.get("resume") !== "1") return;
    const p = new URLSearchParams(searchParams.toString());
    p.delete("resume");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [hydrated, pathname, router, searchParams]);

  const stepLabels = getAutosApplicationStepLabels(lang, "negocios");
  const stepBlockWarnings = useMemo(() => getAutosPreviewBlockingStepIndices("negocios", listing), [listing]);

  const previewHref = withLangParam("/clasificados/autos/negocios/preview", lang);

  if (!hydrated) {
    return <div className="min-h-[40vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  const inventoryBanner =
    inventoryAddMode && inventoryAddContext
      ? lang === "es"
        ? "Vehículo adicional del inventario — Estás agregando un vehículo adicional al inventario. Este vehículo tendrá su propia ficha, su propio Leonix Ad ID y aparecerá en búsqueda/resultados. También se mostrará como parte del inventario del dealer."
        : "Additional inventory vehicle — You are adding an additional inventory vehicle. This vehicle gets its own listing, its own Leonix Ad ID, and appears in search/results. It will also show as part of the dealer inventory."
      : null;

  return (
    <AutosApplicationSteppedShell
      lang={lang}
      lane="negocios"
      stepLabels={stepLabels}
      stepBlockWarnings={stepBlockWarnings}
      initialStep={editorStep}
      initialMaxReached={editorMaxReached}
      onStepChange={setEditorProgress}
      header={
        <AutosPublishApplicationHeader
          lang={lang}
          lane="negocios"
          title={t.app.pageTitle}
          helper={t.app.intro}
          draftLabel={t.app.badgeLocal}
          banner={
            inventoryBanner ? (
              <p className="rounded-xl border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] px-4 py-3 text-sm font-medium text-[color:var(--lx-text)]">
                {inventoryBanner}
              </p>
            ) : undefined
          }
        />
      }
      topActions={(stepCtx) =>
        stepCtx.activeStep >= stepCtx.stepCount - 1 ? null : (
          <AutosApplicationMissingItemsBanner lane="negocios" lang={lang} copy={t} listing={listing} stepCtx={stepCtx} />
        )
      }
    >
      {(ctx) => {
        const { activeStep } = ctx;
        return (
        <>
          <AutosNegociosVehicleApplicationSteps
            mode="main-negocios"
            lang={lang}
            copy={t}
            listing={listing}
            onPatch={setListingPatch}
            vehicleTitleOverride={vehicleTitleOverride}
            onVehicleTitleOverrideChange={setVehicleTitleOverrideState}
            autoTitlePreview={autoTitlePreview}
            inventoryAddMode={inventoryAddMode}
            activeStep={activeStep}
            steppedMode
          />

          {/* E — Negocio */}
          <section className={`${CARD} ${activeStep === 4 ? "" : "hidden"}`} aria-hidden={activeStep !== 4}>
            <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{t.app.sections.dealer}</h2>
            <div className={`${GRID2} mt-5`}>
              <div className="sm:col-span-2">
                <label className={LABEL}>{t.app.labels.dealerName}</label>
                <input
                  className={INPUT}
                  value={listing.dealerName ?? ""}
                  onChange={(e) => setListingPatch({ dealerName: e.target.value || undefined })}
                />
              </div>
              <AutosDealerLogoUpload
                listing={listing}
                setListingPatch={setListingPatch}
                copy={{
                  heading: t.app.dealer.logoHeading,
                  intro: t.app.dealer.logoIntro,
                  urlLabel: t.media.logoUrlLabel,
                  urlHint: t.media.logoUrlHint,
                  useLogoUrl: t.media.useLogoUrl,
                  logoUrlSaved: t.media.logoUrlSaved,
                  uploadLogo: t.media.uploadLogo,
                  uploadLogoHint: t.media.uploadLogoHint,
                  logoPreviewTitle: t.media.logoPreviewTitle,
                  logoPreviewFile: t.media.logoPreviewFile,
                  logoPreviewUrl: t.media.logoPreviewUrl,
                  removeLogo: t.media.removeLogo,
                  httpsPlaceholder: t.app.placeholders.https,
                }}
                lang={lang}
              />
              <div>
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
              <div>
                <label className={LABEL}>{t.app.labels.phoneMobile}</label>
                <input
                  className={`${INPUT} tabular-nums`}
                  inputMode="tel"
                  autoComplete="tel"
                  value={formatPhoneInputDisplay(listing.dealerPhoneMobile ?? "")}
                  onChange={(e) => {
                    const v = formatPhoneInputDisplay(e.target.value);
                    setListingPatch({ dealerPhoneMobile: v.trim() ? v : undefined });
                  }}
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.hints.phoneMobile}</p>
              </div>
              <div>
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
              <div>
                <label className={LABEL}>{t.app.dealer.smsPhone}</label>
                <input
                  className={`${INPUT} tabular-nums`}
                  inputMode="tel"
                  autoComplete="tel"
                  value={formatPhoneInputDisplay(listing.dealerSmsPhone ?? "")}
                  onChange={(e) => {
                    const v = formatPhoneInputDisplay(e.target.value);
                    setListingPatch({ dealerSmsPhone: v.trim() ? v : undefined });
                  }}
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.dealer.smsPhoneHint}</p>
              </div>
              <div>
                <label className={LABEL}>{t.app.labels.website}</label>
                <input
                  className={INPUT}
                  placeholder={t.app.placeholders.https}
                  value={listing.dealerWebsite ?? ""}
                  onChange={(e) => setListingPatch({ dealerWebsite: autosDraftUrlValue(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>{t.app.labels.bookingUrl}</label>
                <input
                  className={INPUT}
                  placeholder={t.app.placeholders.https}
                  value={listing.dealerBookingUrl ?? ""}
                  onChange={(e) =>
                    setListingPatch({ dealerBookingUrl: autosDraftUrlValue(e.target.value) })
                  }
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.hints.bookingUrl}</p>
              </div>
              <AutosDealerStructuredAddressFields
                labels={{
                  streetNumber: t.app.labels.dealerStreetNumber,
                  streetName: t.app.labels.dealerStreetName,
                  unitOrSuite: t.app.labels.dealerUnitOrSuite,
                  city: t.app.labels.dealerAddressCity,
                  state: t.app.labels.dealerAddressState,
                  zipCode: t.app.labels.dealerAddressZip,
                  helperMaps: t.app.hints.dealerAddressMaps,
                  helperSearch: t.app.hints.dealerAddressSearch,
                }}
                values={listing}
                onPatch={(p) => setListingPatch(syncDealerAddressFromStructured({ ...listing, ...p }))}
              />
            </div>

            <AutosDealerFinanceFields listing={listing} setListingPatch={setListingPatch} copy={t} lang={lang} />

            <h3 className="mt-6 text-sm font-extrabold text-[color:var(--lx-text)]">{t.app.dealer.dealershipContactsHeading}</h3>
            <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.dealer.dealershipContactsHelper}</p>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">{t.app.dealer.socialHeading}</p>
            <div className={`${GRID2} mt-3`}>
              {(
                [
                  ["instagram", t.app.dealer.socialLabels.instagram],
                  ["facebook", t.app.dealer.socialLabels.facebook],
                  ["tiktok", t.app.dealer.socialLabels.tiktok],
                  ["youtube", t.app.dealer.socialLabels.youtube],
                  ["linkedin", t.app.dealer.socialLabels.linkedin],
                  ["x", t.app.dealer.socialLabels.x],
                  ["snapchat", t.app.dealer.socialLabels.snapchat],
                  ["pinterest", t.app.dealer.socialLabels.pinterest],
                  ["whatsappProfile", t.app.dealer.socialLabels.whatsappProfile],
                ] as const
              ).map(([k, lab]) => (
                <div key={k}>
                  <label className={LABEL}>{lab}</label>
                  <input
                    className={INPUT}
                    placeholder={t.app.placeholders.https}
                    value={listing.dealerSocials?.[k] ?? ""}
                    onChange={(e) =>
                      setListingPatch({
                        dealerSocials: { ...listing.dealerSocials, [k]: autosDraftUrlValue(e.target.value) },
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className={`${GRID2} mt-6`}>
              <div>
                <label className={LABEL}>{t.app.dealer.googleReviews}</label>
                <input
                  className={INPUT}
                  placeholder={t.app.placeholders.https}
                  value={listing.googleReviewsUrl ?? ""}
                  onChange={(e) => setListingPatch({ googleReviewsUrl: autosDraftUrlValue(e.target.value) })}
                />
              </div>
              <div>
                <label className={LABEL}>{t.app.dealer.yelpReviews}</label>
                <input
                  className={INPUT}
                  placeholder={t.app.placeholders.https}
                  value={listing.yelpReviewsUrl ?? ""}
                  onChange={(e) => setListingPatch({ yelpReviewsUrl: autosDraftUrlValue(e.target.value) })}
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.dealer.reviewsHelper}</p>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">
              {t.app.dealer.usefulDealershipLinksHeading}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.app.dealer.usefulDealershipLinksHelper}</p>
            <div className="mt-4 space-y-3">
              {normalizeDealerCustomLinks(listing.dealerCustomLinks, { keepEmptyRows: true }).map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3"
                >
                  <div className={`${GRID2}`}>
                    <div>
                      <label className={LABEL}>{t.app.dealer.customLinkTitle}</label>
                      <input
                        className={INPUT}
                        value={row.label ?? ""}
                        onChange={(e) => {
                          const rows = normalizeDealerCustomLinks(listing.dealerCustomLinks, { keepEmptyRows: true });
                          setListingPatch({
                            dealerCustomLinks: rows.map((r) =>
                              r.id === row.id ? { ...r, label: autosDraftTextValue(e.target.value) } : r,
                            ),
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>{t.app.dealer.customLinkUrl}</label>
                      <input
                        className={INPUT}
                        placeholder={t.app.placeholders.https}
                        value={row.url ?? ""}
                        onChange={(e) => {
                          const rows = normalizeDealerCustomLinks(listing.dealerCustomLinks, { keepEmptyRows: true });
                          setListingPatch({
                            dealerCustomLinks: rows.map((r) =>
                              r.id === row.id ? { ...r, url: autosDraftUrlValue(e.target.value) } : r,
                            ),
                          });
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-3 min-h-[44px] text-xs font-bold text-red-700 hover:underline"
                    onClick={() => {
                      const rows = normalizeDealerCustomLinks(listing.dealerCustomLinks, { keepEmptyRows: true }).filter(
                        (r) => r.id !== row.id,
                      );
                      setListingPatch({ dealerCustomLinks: rows });
                    }}
                  >
                    {t.app.dealer.removeCustomLink}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={normalizeDealerCustomLinks(listing.dealerCustomLinks, { keepEmptyRows: true }).length >= 2}
              className="mt-3 rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                const rows = normalizeDealerCustomLinks(listing.dealerCustomLinks, { keepEmptyRows: true });
                if (rows.length >= 2) return;
                const next: DealerCustomLink = { id: newHourRowId(), label: undefined, url: undefined };
                setListingPatch({ dealerCustomLinks: [...rows, next] });
              }}
            >
              {t.app.dealer.addDealershipLink}
            </button>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
                onClick={() =>
                  setListingPatch({
                    dealerHours: [...t.weekdayTemplate.map((h) => ({ ...h }))],
                  })
                }
              >
                {t.app.dealer.applyHoursTemplate}
              </button>
              <button
                type="button"
                className="rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
                onClick={() =>
                  setListingPatch({
                    dealerHours: [
                      ...(listing.dealerHours ?? []),
                      {
                        rowId: newHourRowId(),
                        day: t.app.dealer.newDayPlaceholder,
                        open: "09:00",
                        close: "17:00",
                        closed: false,
                      },
                    ],
                  })
                }
              >
                {t.app.dealer.addHoursRow}
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[color:var(--lx-muted)]">{t.app.dealer.scheduleHelper}</p>

            <AutosDealerHoursEditor
              lang={lang}
              rows={listing.dealerHours ?? []}
              copy={{
                day: t.app.dealer.day,
                open: t.app.dealer.open,
                close: t.app.dealer.close,
                closed: t.app.dealer.closed,
                remove: t.app.dealer.remove,
              }}
              onUpdateRow={(rowId, patch) => updateDealerHourRow(rowId, patch)}
              onRemoveRow={(rowId) => removeDealerHourRow(rowId)}
            />
          </section>

          <div className={activeStep === 6 ? "" : "hidden"} aria-hidden={activeStep !== 6}>
            {!inventoryAddMode ? (
              <>
                <AutosNegociosResultsCardPreview
                  lang={lang}
                  listing={listing}
                  additionalCount={additionalInventoryVehicles.length}
                />
                <AutosNegociosInventoryBundlePreview
                  lang={lang}
                  copy={t}
                  listing={listing}
                  additionalVehicles={additionalInventoryVehicles}
                  additionalCount={additionalInventoryVehicles.length}
                  onSaveVehicle={(vehicle) => {
                    const ok = upsertAdditionalInventoryVehicle(vehicle);
                    if (ok) void flushDraft();
                    return ok;
                  }}
                  onRemoveVehicle={(id) => {
                    removeAdditionalInventoryVehicle(id);
                  }}
                  flushDraft={flushDraft}
                  {...inventoryDrawerProps}
                />
                <AutosNegociosInventoryValueModule
                  lang={lang}
                  prePublishMode
                  copy={t}
                  parentListing={listing}
                  parentListingId={inventoryAddContext?.parentListingId ?? null}
                  dealerInventoryGroupId={inventoryAddContext?.dealerInventoryGroupId ?? null}
                  flushDraft={flushDraft}
                  additionalInventoryCount={additionalInventoryVehicles.length}
                  additionalVehicles={additionalInventoryVehicles}
                  onSaveAdditionalVehicle={(vehicle) => {
                    const ok = upsertAdditionalInventoryVehicle(vehicle);
                    if (ok) void flushDraft();
                    return ok;
                  }}
                  inventoryDrawerProps={inventoryDrawerProps}
                  boostEditorContext={{
                    editorPath: pathname ?? "",
                    editorSearch: searchParams?.toString() ? `?${searchParams.toString()}` : "",
                    activeStep: ctx.activeStep,
                    parentListingId: inventoryAddContext?.parentListingId ?? null,
                    returnToListingId: inventoryAddContext?.returnToListingId ?? null,
                    dealerInventoryGroupId: inventoryAddContext?.dealerInventoryGroupId ?? null,
                  }}
                />
              </>
            ) : null}
            <AutosApplicationReviewStep lane="negocios" listing={listing} copy={t} lang={lang} />
            <AutosApplicationFinalActions
              lane="negocios"
              lang={lang}
              copy={t}
              listing={listing}
              stepCtx={ctx}
              flushDraft={flushDraft}
              inventoryAddMode={inventoryAddMode}
              inventoryAddContext={inventoryAddContext}
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
