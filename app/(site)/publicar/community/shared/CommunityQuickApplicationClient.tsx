"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import type { DayKey } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { CommunityExtendedContactFields } from "./components/CommunityExtendedContactFields";
import { CommunityPublishConfirmationSection } from "./components/CommunityPublishConfirmationSection";
import { EmpleosApplicationFinalStep } from "@/app/publicar/empleos/shared/components/EmpleosApplicationFinalStep";
import { EmpleosCtaFieldGroup } from "@/app/publicar/empleos/shared/components/EmpleosCtaFieldGroup";
import { EmpleosReadinessBanner } from "@/app/publicar/empleos/shared/components/EmpleosReadinessBanner";
import { EmpleosImageGalleryEditor } from "@/app/publicar/empleos/shared/media/EmpleosImageGalleryEditor";
import {
  EmpleosFieldLabel,
  EmpleosSectionCard,
} from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";

import {
  COMMUNITY_SESSION_KEYS,
  type CommunityKind,
} from "./constants/communitySessionKeys";
import {
  communityHandoffPreviewUrl,
} from "./constants/communityPublishRoutes";
import {
  CLASES_QUICK_COPY,
  COMMUNITY_PUBLISH_COPY,
  COMUNIDAD_QUICK_COPY,
  clasesCostLabel,
} from "./copy/communityPublishCopy";
import { WeeklyScheduleEditor } from "./components/WeeklyScheduleEditor";
import { ComunidadSmartScheduleSection } from "./components/ComunidadSmartScheduleSection";
import {
  flushCommunityDraftToSession,
  useCommunityDraftSession,
} from "./hooks/useCommunityDraftSession";
import {
  buildClasesQuickPublishEnvelope,
  buildComunidadQuickPublishEnvelope,
} from "./publish/buildCommunityPublishEnvelope";
import { publishCommunityQuickToListings } from "./publish/publishCommunityQuickToListings";
import {
  clearCommunityStagedPublish,
  writeCommunityStagedPublish,
} from "./publish/communityPublishStaging";
import {
  gateClasesQuickPreview,
  gateComunidadQuickPreview,
  shouldBlockClasesPaidPublish,
} from "./required/communityRequiredForPreview";
import {
  CLASES_CATEGORY_OPTIONS,
  CLASES_SKILL_LEVEL_OPTIONS,
  COMUNIDAD_ACCESSIBILITY_OPTIONS,
  COMUNIDAD_CATEGORY_OPTIONS,
  COMMUNITY_AUDIENCE_OPTIONS,
  COMMUNITY_REGISTRATION_OPTIONS,
} from "./taxonomy/communityTaxonomy";
import {
  emptyClasesQuickDraft,
  emptyComunidadQuickDraft,
  normalizeClasesQuickDraft,
  normalizeComunidadQuickDraft,
  type ClasesPriceFrequency,
  type ClasesQuickDraft,
  type CommunityCommonDraft,
  type ComunidadCostType,
  type ComunidadQuickDraft,
} from "./types/communityQuickDraft";

const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";

type Props = { kind: CommunityKind };

export default function CommunityQuickApplicationClient({ kind }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const sharedCopy = COMMUNITY_PUBLISH_COPY[lang];

  if (kind === "clases") {
    return (
      <ClasesQuickApplication
        lang={lang}
        sharedCopy={sharedCopy}
        router={router}
      />
    );
  }
  return (
    <ComunidadQuickApplication
      lang={lang}
      sharedCopy={sharedCopy}
      router={router}
    />
  );
}

type RouterLike = ReturnType<typeof useRouter>;

type SubProps = {
  lang: Lang;
  sharedCopy: typeof COMMUNITY_PUBLISH_COPY[Lang];
  router: RouterLike;
};

function ctaLabels(lang: Lang) {
  return lang === "es"
    ? {
        phone: "Teléfono",
        whatsapp: "WhatsApp",
        email: "Correo",
        website: "Sitio web / registro",
        primary: "Acción principal preferida *",
      }
    : {
        phone: "Phone",
        whatsapp: "WhatsApp",
        email: "Email",
        website: "Website / registration link",
        primary: "Preferred primary action *",
      };
}

const MEDIA_COPY = {
  es: {
    urlPh: "https://… (URL de imagen o PDF)",
    addUrl: "Añadir URL",
    upload: "Sube imagen, PDF o archivo del volante",
    main: "Principal",
    remove: "Quitar",
    up: "Arriba",
    down: "Abajo",
    altImage: "Texto alternativo (imagen)",
  },
  en: {
    urlPh: "https://… (image or PDF URL)",
    addUrl: "Add URL",
    upload: "Upload an image, PDF, or flyer file",
    main: "Main",
    remove: "Remove",
    up: "Up",
    down: "Down",
    altImage: "Image alt text",
  },
} as const;

function ClasesQuickApplication({ lang, sharedCopy, router }: SubProps) {
  const copy = CLASES_QUICK_COPY[lang];
  const { state, patch, reset, hydrated } = useCommunityDraftSession<ClasesQuickDraft>(
    COMMUNITY_SESSION_KEYS.clases,
    emptyClasesQuickDraft(),
    (raw) => normalizeClasesQuickDraft(raw),
  );

  const [sessionSaveNotice, setSessionSaveNotice] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [paidBlockNotice, setPaidBlockNotice] = useState(false);

  const gate = useMemo(() => gateClasesQuickPreview(state, lang), [state, lang]);
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
      COMMUNITY_SESSION_KEYS.clases,
      state,
      (raw) => normalizeClasesQuickDraft(raw),
    );
    markPublishFlowOpeningPreview();
    router.push(communityHandoffPreviewUrl("clases", lang));
  }, [previewDisabled, state, router, lang]);

  const handleDelete = useCallback(() => {
    reset();
    setSessionSaveNotice(false);
    setPaidBlockNotice(false);
    setPublishError(null);
    clearCommunityStagedPublish("clases");
  }, [reset]);

  const handlePublish = useCallback(async () => {
    if (publishDisabled || publishing) return;
    if (shouldBlockClasesPaidPublish(state)) {
      setPaidBlockNotice(true);
      return;
    }
    setPaidBlockNotice(false);
    setPublishError(null);
    setSessionSaveNotice(false);
    setPublishing(true);
    try {
      const r = await publishCommunityQuickToListings({ kind: "clases", draft: state, lang });
      if (!r.ok) {
        setPublishError(r.error);
        return;
      }
      clearCommunityStagedPublish("clases");
      router.push(`/clasificados/anuncio/${r.listingId}?lang=${lang}`);
    } finally {
      setPublishing(false);
    }
  }, [publishDisabled, publishing, state, lang, router]);

  const onSaveDraft = useCallback(() => {
    const envelope = buildClasesQuickPublishEnvelope(state, lang);
    writeCommunityStagedPublish("clases", envelope);
    setSessionSaveNotice(true);
    setPublishError(null);
  }, [state, lang]);

  const ctaL = ctaLabels(lang);
  const ctaPrimaryHint = copy.primaryCtaHint;
  const mediaCopy = MEDIA_COPY[lang];

  if (!hydrated) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  const publishBtnDisabled = publishDisabled || publishing;

  const isPaid = state.classCostType === "pagada";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] px-4 pb-24 pt-24 text-[color:var(--lx-text)] sm:px-5">
      <div className="mx-auto min-w-0 max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">{copy.pageTitle}</h1>
          <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{copy.pageSubtitle}</p>
          <p className="mt-1 text-xs font-semibold text-[color:var(--lx-muted)]">
            {sharedCopy.discoveryRegionLine}
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
              <EmpleosFieldLabel lang={lang} required>
                {copy.fields.category}
              </EmpleosFieldLabel>
              <select
                className={INPUT}
                value={state.category}
                onChange={(e) => patch({ category: e.target.value })}
              >
                {CLASES_CATEGORY_OPTIONS.map((o) => (
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
                    lang === "es" ? "Ej. Boxeo profesional" : "e.g. Professional boxing"
                  }
                />
              </label>
            ) : null}
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>
                {copy.fields.description}
              </EmpleosFieldLabel>
              <textarea
                className={`${INPUT} min-h-[100px]`}
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
                {copy.fields.skillLevel}
              </EmpleosFieldLabel>
              <select className={INPUT} value={state.skillLevel} onChange={(e) => patch({ skillLevel: e.target.value })}>
                <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
                {CLASES_SKILL_LEVEL_OPTIONS.map((o) => (
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
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.bringNote}
              </EmpleosFieldLabel>
              <textarea
                className={`${INPUT} min-h-[72px]`}
                value={state.bringNote}
                onChange={(e) => patch({ bringNote: e.target.value })}
                placeholder={lang === "es" ? "Opcional" : "Optional"}
              />
            </label>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={copy.sections.cost}>
            <fieldset>
              <legend className="text-sm font-semibold text-[color:var(--lx-text)]">
                {copy.fields.classCostType} *
              </legend>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {(["gratis", "pagada"] as const).map((value) => (
                  <label key={value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="clases-cost-type"
                      checked={state.classCostType === value}
                      onChange={() =>
                        patch({
                          classCostType: value,
                          ...(value === "gratis"
                            ? { priceAmount: "", priceFrequency: state.priceFrequency, priceNote: "" }
                            : null),
                        })
                      }
                    />
                    {clasesCostLabel(value, lang)}
                  </label>
                ))}
              </div>
            </fieldset>
            {isPaid ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <EmpleosFieldLabel lang={lang} required>
                      {copy.fields.priceAmount}
                    </EmpleosFieldLabel>
                    <input
                      className={INPUT}
                      value={state.priceAmount}
                      onChange={(e) => patch({ priceAmount: e.target.value })}
                      placeholder={lang === "es" ? "Ej. $20" : "e.g. $20"}
                      inputMode="decimal"
                    />
                  </label>
                  <label className="block text-sm">
                    <EmpleosFieldLabel lang={lang} required>
                      {copy.fields.priceFrequency}
                    </EmpleosFieldLabel>
                    <select
                      className={INPUT}
                      value={state.priceFrequency}
                      onChange={(e) =>
                        patch({ priceFrequency: e.target.value as ClasesPriceFrequency })
                      }
                    >
                      <option value="porClase">
                        {lang === "es" ? "por clase" : "per class"}
                      </option>
                      <option value="porSesion">
                        {lang === "es" ? "por sesión" : "per session"}
                      </option>
                      <option value="porMes">
                        {lang === "es" ? "por mes" : "per month"}
                      </option>
                      <option value="porCursoCompleto">
                        {lang === "es" ? "por curso completo" : "per full course"}
                      </option>
                      <option value="otro">{lang === "es" ? "otro" : "other"}</option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm">
                  <EmpleosFieldLabel lang={lang} optional>
                    {copy.fields.priceNote}
                  </EmpleosFieldLabel>
                  <input
                    className={INPUT}
                    value={state.priceNote}
                    onChange={(e) => patch({ priceNote: e.target.value })}
                    placeholder={
                      lang === "es"
                        ? "Ej. Incluye material; pagos por Zelle"
                        : "e.g. Materials included; pay via Zelle"
                    }
                  />
                </label>
                <p className="rounded-lg border border-amber-300/70 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-950">
                  {lang === "es"
                    ? "Las clases pagadas requieren activación de publicación pagada (en preparación)."
                    : "Paid classes require paid publishing activation (in preparation)."}
                </p>
              </div>
            ) : null}
          </EmpleosSectionCard>

          <EmpleosSectionCard title={copy.sections.mode}>
            <fieldset>
              <legend className="text-sm font-semibold text-[color:var(--lx-text)]">
                {copy.fields.mode} *
              </legend>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {(["presencial", "enLinea", "hibrida"] as const).map((value) => (
                  <label key={value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="clases-mode"
                      checked={state.mode === value}
                      onChange={() => patch({ mode: value })}
                    />
                    {value === "presencial"
                      ? copy.fields.modePresencial
                      : value === "enLinea"
                        ? copy.fields.modeEnLinea
                        : copy.fields.modeHibrida}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-4">
              <EmpleosFieldLabel lang={lang} required>
                {copy.fields.weeklySchedule}
              </EmpleosFieldLabel>
              <WeeklyScheduleEditor
                lang={lang}
                rows={state.weeklySchedule}
                closedLabel={copy.fields.weeklyClosed}
                helperText={copy.fields.weeklyHelper}
                onPatchDay={(day: DayKey, pr) =>
                  patch({
                    weeklySchedule: state.weeklySchedule.map((r) =>
                      r.day === day ? { ...r, ...pr } : r,
                    ),
                  })
                }
              />
            </div>
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
          variant="clases"
          lang={lang}
          value={state.publishConfirmations}
          onChange={(p) =>
            patch({ publishConfirmations: { ...state.publishConfirmations, ...p } })
          }
        />

        <EmpleosApplicationFinalStep
          copy={sharedCopy.finalStep}
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
        />

        {paidBlockNotice ? (
          <p
            className="mt-4 rounded-xl border border-amber-300/70 bg-amber-50/95 px-3 py-2.5 text-sm text-amber-950"
            role="status"
          >
            {sharedCopy.paidClassPublishBlocked}
          </p>
        ) : null}
      </div>
    </main>
  );
}

function ComunidadQuickApplication({ lang, sharedCopy, router }: SubProps) {
  const copy = COMUNIDAD_QUICK_COPY[lang];
  const { state, patch, reset, hydrated } = useCommunityDraftSession<ComunidadQuickDraft>(
    COMMUNITY_SESSION_KEYS.comunidad,
    emptyComunidadQuickDraft(),
    (raw) => normalizeComunidadQuickDraft(raw),
  );

  const [sessionSaveNotice, setSessionSaveNotice] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

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
    router.push(communityHandoffPreviewUrl("comunidad", lang));
  }, [previewDisabled, state, router, lang]);

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
      const r = await publishCommunityQuickToListings({ kind: "comunidad", draft: state, lang });
      if (!r.ok) {
        setPublishError(r.error);
        return;
      }
      clearCommunityStagedPublish("comunidad");
      router.push(`/clasificados/anuncio/${r.listingId}?lang=${lang}`);
    } finally {
      setPublishing(false);
    }
  }, [publishDisabled, publishing, state, lang, router]);

  const onSaveDraft = useCallback(() => {
    const envelope = buildComunidadQuickPublishEnvelope(state, lang);
    writeCommunityStagedPublish("comunidad", envelope);
    setSessionSaveNotice(true);
    setPublishError(null);
  }, [state, lang]);

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
                className={`${INPUT} min-h-[100px]`}
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
                  return (
                    <label key={o.value} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? state.accessibilityKeys.filter((k) => k !== o.value)
                            : [...state.accessibilityKeys, o.value];
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
                className={`${INPUT} min-h-[72px]`}
                value={state.bringNote}
                onChange={(e) => patch({ bringNote: e.target.value })}
                placeholder={lang === "es" ? "Opcional" : "Optional"}
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
          copy={sharedCopy.finalStep}
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
        />
      </div>
    </main>
  );
}

type LocationProps = {
  lang: Lang;
  discoveryLine: string;
  cityHint: string;
  publicCity: string;
  publicCityLabel: string;
  stateLabel: string;
  zipLabel: string;
  venueLabel: string;
  addressLabel: string;
  addressLine2Label: string;
  addressHelperText: string;
  addressPlaceholder: string;
  countryLabel: string;
  zipValue: string;
  venueValue: string;
  addressValue: string;
  addressLine2Value: string;
  stateValue: string;
  countryValue: string;
  sectionTitle: string;
  onChange: (p: Partial<CommunityCommonDraft>) => void;
};

function LocationSection({
  lang,
  discoveryLine,
  cityHint,
  publicCity,
  publicCityLabel,
  stateLabel,
  zipLabel,
  venueLabel,
  addressLabel,
  addressLine2Label,
  addressHelperText,
  addressPlaceholder,
  countryLabel,
  zipValue,
  venueValue,
  addressValue,
  addressLine2Value,
  stateValue,
  countryValue,
  sectionTitle,
  onChange,
}: LocationProps) {
  return (
    <EmpleosSectionCard title={sectionTitle}>
      <p className="text-xs text-[color:var(--lx-muted)]">{discoveryLine}</p>

      <label className="block text-sm">
        <EmpleosFieldLabel lang={lang} optional>
          {venueLabel}
        </EmpleosFieldLabel>
        <input
          className={INPUT}
          value={venueValue}
          onChange={(e) => onChange({ venue: e.target.value })}
          placeholder={lang === "es" ? "Ej. Centro Comunitario" : "e.g. Community Center"}
        />
      </label>

      <label className="block text-sm">
        <EmpleosFieldLabel lang={lang} optional>
          {addressLabel}
        </EmpleosFieldLabel>
        <input
          className={INPUT}
          value={addressValue}
          onChange={(e) => onChange({ addressLine1: e.target.value })}
          placeholder={addressPlaceholder}
        />
        <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{addressHelperText}</p>
      </label>

      <label className="block text-sm">
        <EmpleosFieldLabel lang={lang} optional>
          {addressLine2Label}
        </EmpleosFieldLabel>
        <input
          className={INPUT}
          value={addressLine2Value}
          onChange={(e) => onChange({ addressLine2: e.target.value })}
          placeholder={lang === "es" ? "Apto, Suite, Unidad…" : "Apt, Suite, Unit…"}
        />
      </label>

      <div className="block text-sm">
        <EmpleosFieldLabel lang={lang} required>
          {publicCityLabel}
        </EmpleosFieldLabel>
        <CityAutocomplete
          className="mt-1"
          value={publicCity}
          onChange={(v) => onChange({ publicCity: v })}
          lang={lang}
          variant="light"
          stripInvalidOnBlur
          placeholder={
            lang === "es" ? "Ej. San José, Stockton, Ciudad de México…" : "e.g. San José, Stockton, Mexico City…"
          }
        />
        <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{cityHint}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <EmpleosFieldLabel lang={lang} optional>
            {stateLabel}
          </EmpleosFieldLabel>
          <input
            className={INPUT}
            value={stateValue}
            onChange={(e) => onChange({ state: e.target.value })}
            placeholder={lang === "es" ? "CA, TX, CDMX…" : "CA, TX, NY…"}
          />
        </label>
        <label className="block text-sm">
          <EmpleosFieldLabel lang={lang} optional>
            {countryLabel}
          </EmpleosFieldLabel>
          <input
            className={INPUT}
            value={countryValue}
            onChange={(e) => onChange({ country: e.target.value })}
            placeholder={lang === "es" ? "Ej. Estados Unidos, México…" : "e.g. United States, Mexico…"}
          />
        </label>
      </div>

      <label className="block text-sm">
        <EmpleosFieldLabel lang={lang} optional>
          {zipLabel}
        </EmpleosFieldLabel>
        <input
          className={INPUT}
          value={zipValue}
          onChange={(e) => onChange({ zip: e.target.value })}
          placeholder={lang === "es" ? "95110, C.P. 06600…" : "95110, M5V 3A8…"}
          inputMode="numeric"
        />
      </label>
    </EmpleosSectionCard>
  );
}
