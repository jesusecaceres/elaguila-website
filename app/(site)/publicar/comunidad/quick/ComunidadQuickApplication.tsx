"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import {
  ComunidadEventLinksSection,
  CommunityExtendedContactFields,
} from "@/app/(site)/publicar/community/shared/components/CommunityExtendedContactFields";
import { CommunityPublishConfirmationSection } from "@/app/(site)/publicar/community/shared/components/CommunityPublishConfirmationSection";
import { EmpleosApplicationFinalStep } from "@/app/publicar/empleos/shared/components/EmpleosApplicationFinalStep";
import { EmpleosCtaFieldGroup } from "@/app/publicar/empleos/shared/components/EmpleosCtaFieldGroup";
import { EmpleosReadinessBanner } from "@/app/publicar/empleos/shared/components/EmpleosReadinessBanner";
import { EmpleosImageGalleryEditor } from "@/app/publicar/empleos/shared/media/EmpleosImageGalleryEditor";
import {
  EmpleosFieldLabel,
  EmpleosSectionCard,
} from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";

import { COMMUNITY_SESSION_KEYS } from "@/app/(site)/publicar/community/shared/constants/communitySessionKeys";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import type { SupportedLang } from "@/app/lib/language";

import { communityHandoffPreviewUrl } from "@/app/(site)/publicar/community/shared/constants/communityPublishRoutes";
import {
  COMMUNITY_PUBLISH_COPY,
  COMUNIDAD_QUICK_COPY,
} from "@/app/(site)/publicar/community/shared/copy/communityPublishCopy";
import { ComunidadSmartScheduleSection } from "@/app/(site)/publicar/community/shared/components/ComunidadSmartScheduleSection";
import {
  flushCommunityDraftToSession,
  useCommunityDraftSession,
} from "@/app/(site)/publicar/community/shared/hooks/useCommunityDraftSession";
import { buildComunidadQuickPublishEnvelope } from "@/app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope";
import { publishCommunityQuickToListings } from "@/app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings";
import {
  clearCommunityStagedPublish,
  writeCommunityStagedPublish,
} from "@/app/(site)/publicar/community/shared/publish/communityPublishStaging";
import { COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS } from "@/app/(site)/publicar/community/shared/constants/communitySessionKeys";
import { gateComunidadQuickPreview } from "@/app/(site)/publicar/community/shared/required/communityRequiredForPreview";
import { useBusinessApplicationLeaveGuard } from "@/app/lib/businessApplications/useBusinessApplicationLeaveGuard";
import {
  COMUNIDAD_ACCESSIBILITY_OPTIONS,
  COMUNIDAD_ACCESSIBILITY_UNCERTAIN_VALUE,
  COMUNIDAD_CATEGORY_OPTIONS,
  COMMUNITY_AUDIENCE_OPTIONS,
  COMMUNITY_REGISTRATION_OPTIONS,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import {
  emptyComunidadQuickDraft,
  normalizeComunidadQuickDraft,
  type ComunidadCostType,
  type ComunidadQuickDraft,
} from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import {
  ctaLabels,
  INPUT,
  LocationSection,
  MEDIA_COPY,
} from "@/app/(site)/publicar/community/shared/components/communityFormPrimitives";

type RouterLike = ReturnType<typeof useRouter>;

/** Comunidad y Eventos — category-owned editor composition. */
export default function ComunidadQuickApplication() {
  const router = useRouter();
  const sp = useSearchParams();
  const { routeLang, copyLang: lang } = resolveClasificadosPublishLang(sp?.get("lang"));
  const sharedCopy = COMMUNITY_PUBLISH_COPY[lang];

  return <ComunidadQuickApplicationBody lang={lang} routeLang={routeLang} sharedCopy={sharedCopy} router={router} />;
}

function ComunidadQuickApplicationBody({
  lang,
  routeLang,
  sharedCopy,
  router,
}: {
  lang: Lang;
  routeLang: SupportedLang;
  sharedCopy: typeof COMMUNITY_PUBLISH_COPY[Lang];
  router: RouterLike;
}) {
  const copy = COMUNIDAD_QUICK_COPY[lang];
  const { state, patch, reset, hydrated } = useCommunityDraftSession<ComunidadQuickDraft>(
    COMMUNITY_SESSION_KEYS.comunidad,
    emptyComunidadQuickDraft(),
    (raw) => normalizeComunidadQuickDraft(raw),
  );
  const [sessionSaveNotice, setSessionSaveNotice] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const organizerLogoFileRef = useRef<HTMLInputElement>(null);

  // Globalization Build D-F5 — this application had zero native browser-exit protection.
  // useCommunityDraftSession already persists synchronously on every state change, so this only
  // adds the "are you sure" warning on a real tab close; the flush call is a harmless no-op
  // safety net for the same session storage write.
  useBusinessApplicationLeaveGuard({
    isDirty: hydrated && state.title.trim() !== "",
    persist: () =>
      flushCommunityDraftToSession(COMMUNITY_SESSION_KEYS.comunidad, state, (raw) =>
        normalizeComunidadQuickDraft(raw),
      ),
  });

  const gate = useMemo(() => gateComunidadQuickPreview(state, lang), [state, lang]);
  const previewDisabled = !gate.ok;
  const previewIssues = gate.ok ? [] : gate.issues;

  const approvalsOk =
    state.publishConfirmations.infoTruthful &&
    state.publishConfirmations.mediaAccurate &&
    state.publishConfirmations.rulesAccepted;
  const publishDisabled = previewDisabled || !approvalsOk;

  const goPreview = useCallback(() => {
    if (previewDisabled) return;
    setPublishError(null);
    flushCommunityDraftToSession(
      COMMUNITY_SESSION_KEYS.comunidad,
      state,
      (raw) => normalizeComunidadQuickDraft(raw),
    );
    markPublishFlowOpeningPreview();
    router.push(communityHandoffPreviewUrl("comunidad", routeLang));
  }, [previewDisabled, state, router, routeLang]);

  const handleDelete = useCallback(() => {
    reset();
    setSessionSaveNotice(false);
    setPublishError(null);
    clearCommunityStagedPublish("comunidad");
  }, [reset]);

  const handlePublish = useCallback(async () => {
    if (publishDisabled || publishing) return;
    setPublishError(null);
    setSessionSaveNotice(false);
    setPublishing(true);
    try {
      let inFlightId: string | null = null;
      try {
        inFlightId = window.sessionStorage.getItem(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS.comunidad);
      } catch {
        /* sessionStorage optional */
      }
      const r = await publishCommunityQuickToListings({
        kind: "comunidad",
        draft: state,
        lang,
        existingListingId: inFlightId,
        onListingIdKnown: (listingId) => {
          try {
            window.sessionStorage.setItem(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS.comunidad, listingId);
          } catch {
            /* sessionStorage optional */
          }
        },
      });
      if (!r.ok) {
        setPublishError(r.error);
        return;
      }
      try {
        window.sessionStorage.removeItem(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS.comunidad);
      } catch {
        /* sessionStorage optional */
      }
      clearCommunityStagedPublish("comunidad");
      // Gate 4 (Globalization Build 04) — clear the draft itself on success, not just the
      // in-flight/staged-publish keys (see matching comment in the Clases publish handler).
      reset();
      router.push(withClasificadosPublishLang(`/clasificados/anuncio/${r.listingId}`, routeLang));
    } finally {
      setPublishing(false);
    }
  }, [publishDisabled, publishing, state, lang, routeLang, router, reset]);

  const onSaveDraft = useCallback(() => {
    const envelope = buildComunidadQuickPublishEnvelope(state, lang);
    writeCommunityStagedPublish("comunidad", envelope);
    setSessionSaveNotice(true);
    setPublishError(null);
  }, [state, lang]);

  const handleOrganizerLogoUpload = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      patch({ organizerLogoUrl: String(reader.result ?? "") });
    };
    reader.readAsDataURL(file);
  }, [patch]);

  const ctaL = ctaLabels(lang);
  const ctaPrimaryHint = copy.primaryCtaHint;
  const mediaCopy = MEDIA_COPY[lang];

  if (!hydrated) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  const publishBtnDisabled = publishDisabled || publishing;

  const requiresAdmissionNote = state.eventCost === "pagado" || state.eventCost === "donacion";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] px-4 pb-24 pt-24 text-[color:var(--lx-text)] sm:px-5">
      <div className="mx-auto min-w-0 max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">{copy.pageTitle}</h1>
          <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{copy.pageSubtitle}</p>
          <p className="mt-1 text-xs font-semibold text-[color:var(--lx-muted)]">
            {sharedCopy.discoveryRegionLine}
          </p>
          <p className="mt-3 rounded-xl border border-emerald-300/70 bg-emerald-50/85 px-3 py-2 text-xs font-medium text-emerald-950">
            {copy.freePostingNotice}
          </p>
        </header>

        <EmpleosReadinessBanner
          visible={!gate.ok}
          intro={sharedCopy.gateFail}
          issues={previewIssues}
        />

        <div className="space-y-6">
          <EmpleosSectionCard title={copy.sections.main}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>
                {copy.fields.title}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                value={state.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>
                {copy.fields.organizer}
              </EmpleosFieldLabel>
              <input
                className={INPUT}
                value={state.organizer}
                onChange={(e) => patch({ organizer: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {lang === "es" ? "Logo o foto del organizador" : "Organizer logo or photo"}
              </EmpleosFieldLabel>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className={`${INPUT} flex-1`}
                    type="url"
                    value={state.organizerLogoUrl && !state.organizerLogoUrl.startsWith("data:") ? state.organizerLogoUrl : ""}
                    onChange={(e) => patch({ organizerLogoUrl: e.target.value })}
                    placeholder={lang === "es" ? "https://… (URL de imagen)" : "https://… (image URL)"}
                  />
                  <input
                    ref={organizerLogoFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleOrganizerLogoUpload(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => organizerLogoFileRef.current?.click()}
                    className="min-h-[42px] rounded-lg border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 text-xs font-bold"
                  >
                    {lang === "es" ? "Subir imagen" : "Upload image"}
                  </button>
                </div>
                {state.organizerLogoUrl ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-black/10 bg-neutral-100">
                    <Image
                      src={state.organizerLogoUrl}
                      alt={lang === "es" ? "Vista previa del logo del organizador" : "Organizer logo preview"}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  </div>
                ) : null}
                <p className="mt-1 text-xs text-[color:var(--lx-text-2)]">
                  {lang === "es"
                    ? "Opcional. Sube un logo/foto del organizador o pega una URL de imagen."
                    : "Optional. Upload an organizer logo/photo or paste an image URL."}
                </p>
              </div>
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>
                {copy.fields.category}
              </EmpleosFieldLabel>
              <select
                className={INPUT}
                value={state.category}
                onChange={(e) => patch({ category: e.target.value })}
              >
                {COMUNIDAD_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {lang === "en" ? o.labelEn : o.labelEs}
                  </option>
                ))}
              </select>
            </label>
            {state.category === "otro" ? (
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>
                  {copy.fields.categoryOther}
                </EmpleosFieldLabel>
                <input
                  className={INPUT}
                  value={state.categoryCustom}
                  onChange={(e) => patch({ categoryCustom: e.target.value })}
                  placeholder={
                    lang === "es" ? "Ej. Festival cultural" : "e.g. Cultural festival"
                  }
                />
              </label>
            ) : null}
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>
                {copy.fields.description}
              </EmpleosFieldLabel>
              <textarea
                className={`${INPUT} min-h-[160px]`}
                value={state.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>
                {copy.fields.audience}
              </EmpleosFieldLabel>
              <select className={INPUT} value={state.audience} onChange={(e) => patch({ audience: e.target.value })}>
                <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
                {COMMUNITY_AUDIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {lang === "en" ? o.labelEn : o.labelEs}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>
                {copy.fields.registrationRequired}
              </EmpleosFieldLabel>
              <select
                className={INPUT}
                value={state.registrationRequired}
                onChange={(e) => patch({ registrationRequired: e.target.value })}
              >
                <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
                {COMMUNITY_REGISTRATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {lang === "en" ? o.labelEn : o.labelEs}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="block text-sm">
              <legend className="text-sm font-semibold text-[color:var(--lx-text)]">{copy.fields.accessibility}</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {COMUNIDAD_ACCESSIBILITY_OPTIONS.map((o) => {
                  const checked = state.accessibilityKeys.includes(o.value);
                  const isUncertain = o.value === COMUNIDAD_ACCESSIBILITY_UNCERTAIN_VALUE;
                  return (
                    <label key={o.value} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            patch({ accessibilityKeys: state.accessibilityKeys.filter((k) => k !== o.value) });
                            return;
                          }
                          // "No estoy seguro" is an uncertainty state, not a real feature — it must
                          // never co-render with concrete accessibility attributes as if it were one.
                          const next = isUncertain
                            ? [o.value]
                            : [...state.accessibilityKeys.filter((k) => k !== COMUNIDAD_ACCESSIBILITY_UNCERTAIN_VALUE), o.value];
                          patch({ accessibilityKeys: next });
                        }}
                      />
                      {lang === "en" ? o.labelEn : o.labelEs}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.bringNote}
              </EmpleosFieldLabel>
              <textarea
                className={`${INPUT} min-h-[120px]`}
                value={state.bringNote}
                onChange={(e) => patch({ bringNote: e.target.value })}
                placeholder={copy.fields.bringNoteHelper}
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.restrictionsNote}
              </EmpleosFieldLabel>
              <textarea
                className={`${INPUT} min-h-[120px]`}
                value={state.restrictionsNote}
                onChange={(e) => patch({ restrictionsNote: e.target.value })}
                placeholder={copy.fields.restrictionsNoteHelper}
              />
            </label>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={copy.sections.cost}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>
                {copy.fields.eventCost}
              </EmpleosFieldLabel>
              <select
                className={INPUT}
                value={state.eventCost}
                onChange={(e) => patch({ eventCost: e.target.value as ComunidadCostType })}
              >
                <option value="gratis">{copy.fields.eventCostFree}</option>
                <option value="pagado">{copy.fields.eventCostPaid}</option>
                <option value="donacion">{copy.fields.eventCostDonation}</option>
                <option value="noConfirmado">{copy.fields.eventCostUnknown}</option>
              </select>
            </label>
            {requiresAdmissionNote ? (
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>
                  {copy.fields.admissionNote}
                </EmpleosFieldLabel>
                <input
                  className={INPUT}
                  value={state.admissionNote}
                  onChange={(e) => patch({ admissionNote: e.target.value })}
                  placeholder={
                    lang === "es"
                      ? "Ej. $5 por persona / donación voluntaria"
                      : "e.g. $5 per person / voluntary donation"
                  }
                />
              </label>
            ) : null}
          </EmpleosSectionCard>

          <EmpleosSectionCard title={copy.sections.schedule}>
            <ComunidadSmartScheduleSection
              lang={lang}
              date={state.date}
              eventEndDate={state.eventEndDate}
              eventSessionStart={state.eventSessionStart}
              eventSessionEnd={state.eventSessionEnd}
              weeklySchedule={state.weeklySchedule}
              copyFields={{
                date: copy.fields.date,
                eventEndDate: copy.fields.eventEndDate,
                eventSessionStart: copy.fields.eventSessionStart,
                eventSessionEnd: copy.fields.eventSessionEnd,
                weeklySchedule: copy.fields.weeklySchedule,
                weeklyClosed: copy.fields.weeklyClosed,
                weeklyHelper: copy.fields.weeklyHelper,
              }}
              onChange={(p) => patch(p)}
            />
          </EmpleosSectionCard>

          <EmpleosSectionCard title={copy.sections.media}>
            <p className="text-xs text-[color:var(--lx-muted)]">{copy.fields.imageHint}</p>
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.image}
            </EmpleosFieldLabel>
            <EmpleosImageGalleryEditor
              images={state.images}
              onChange={(images) => patch({ images })}
              urlPlaceholder={mediaCopy.urlPh}
              addUrlLabel={mediaCopy.addUrl}
              uploadLabel={mediaCopy.upload}
              mainLabel={mediaCopy.main}
              removeLabel={mediaCopy.remove}
              upLabel={mediaCopy.up}
              downLabel={mediaCopy.down}
              altPlaceholder={mediaCopy.altImage}
              uploadMode="imagesAndPdf"
              lang={lang}
            />
          </EmpleosSectionCard>

          <EmpleosSectionCard title={copy.sections.cta}>
            <EmpleosCtaFieldGroup
              phone={state.phone}
              whatsapp={state.whatsapp}
              email={state.email}
              website={state.website}
              primaryCta={state.primaryCta === "website" ? "phone" : state.primaryCta}
              onChange={(p) => patch(p)}
              labels={ctaL}
              primaryHint={ctaPrimaryHint}
              formatUsPhone
              websiteInputType="text"
              showPrimaryCtaSelector={false}
            />
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "Más contacto" : "More contact"}>
            <CommunityExtendedContactFields
              lang={lang}
              smsPhone={state.smsPhone}
              socialLinks={state.socialLinks}
              onChange={(p) => patch(p)}
            />
          </EmpleosSectionCard>

          <ComunidadEventLinksSection
            lang={lang}
            registrationRequired={state.registrationRequired}
            eventLinks={state.eventLinks}
            onChangeLinks={(p) => patch({ eventLinks: { ...state.eventLinks, ...p } })}
          />

          <LocationSection
            lang={lang}
            discoveryLine={sharedCopy.discoveryRegionLine}
            cityHint={sharedCopy.cityAutocompleteHint}
            publicCity={state.publicCity}
            publicCityLabel={copy.fields.publicCity}
            stateLabel={copy.fields.stateLabel}
            countryLabel={copy.fields.countryLabel}
            zipLabel={copy.fields.zipLabel}
            venueLabel={copy.fields.venue}
            addressLabel={copy.fields.addressLine1}
            addressLine2Label={copy.fields.addressLine2}
            addressHelperText={copy.fields.addressLine1Helper}
            addressPlaceholder={copy.fields.addressLine1Placeholder}
            zipValue={state.zip}
            venueValue={state.venue}
            addressValue={state.addressLine1}
            addressLine2Value={state.addressLine2}
            stateValue={state.state}
            countryValue={state.country}
            sectionTitle={copy.sections.location}
            onChange={(p) => patch(p)}
          />
        </div>

        <CommunityPublishConfirmationSection
          variant="comunidad"
          lang={lang}
          value={state.publishConfirmations}
          onChange={(p) =>
            patch({ publishConfirmations: { ...state.publishConfirmations, ...p } })
          }
        />

        <EmpleosApplicationFinalStep
          copy={{ ...sharedCopy.finalStep, intro: copy.finalStepIntro }}
          previewDisabled={previewDisabled}
          publishDisabled={publishBtnDisabled}
          onVistaPrevia={goPreview}
          onPublicar={handlePublish}
          onDelete={handleDelete}
          stagedSuccessText={sessionSaveNotice ? sharedCopy.saveDraftSessionNotice : null}
          publishErrorText={publishError}
          publishWorking={publishing}
          publishWorkingLabel={lang === "es" ? "Publicando..." : "Publishing..."}
          publishGateBlockedHint={previewDisabled ? sharedCopy.publishBlocked : null}
          publishOnlyBlockedHint={
            !previewDisabled && publishDisabled ? sharedCopy.approvalPublishBlocked : null
          }
          allowSaveDraftWhenBlocked
          finalBlockingIssues={previewIssues}
          finalBlockingIntro={
            previewDisabled && previewIssues.length ? sharedCopy.stillNeededTitle : null
          }
          saveDraftCta={sharedCopy.finalStep.saveDraftCta}
          onSaveDraft={onSaveDraft}
          showSecondaryActions={false}
        />
      </div>
    </main>
  );
}
