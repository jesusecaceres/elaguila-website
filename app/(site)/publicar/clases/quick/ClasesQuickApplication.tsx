"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import type { DayKey } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import {
  ClasesClassLinksSection,
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
  CLASES_QUICK_COPY,
  COMMUNITY_PUBLISH_COPY,
  clasesCostLabel,
} from "@/app/(site)/publicar/community/shared/copy/communityPublishCopy";
import { WeeklyScheduleEditor } from "@/app/(site)/publicar/community/shared/components/WeeklyScheduleEditor";
import {
  flushCommunityDraftToSession,
  useCommunityDraftSession,
} from "@/app/(site)/publicar/community/shared/hooks/useCommunityDraftSession";
import { buildClasesQuickPublishEnvelope } from "@/app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope";
import { publishCommunityQuickToListings } from "@/app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings";
import {
  clearCommunityStagedPublish,
  writeCommunityStagedPublish,
} from "@/app/(site)/publicar/community/shared/publish/communityPublishStaging";
import { COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS } from "@/app/(site)/publicar/community/shared/constants/communitySessionKeys";
import {
  gateClasesQuickPreview,
  shouldBlockClasesPaidPublish,
} from "@/app/(site)/publicar/community/shared/required/communityRequiredForPreview";
import { useBusinessApplicationLeaveGuard } from "@/app/lib/businessApplications/useBusinessApplicationLeaveGuard";
import {
  CLASES_CATEGORY_OPTIONS,
  CLASES_SKILL_LEVEL_OPTIONS,
  COMMUNITY_AUDIENCE_OPTIONS,
  COMMUNITY_REGISTRATION_OPTIONS,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import {
  emptyClasesQuickDraft,
  normalizeClasesQuickDraft,
  MAX_CLASES_CATEGORIES,
  MAX_CLASES_AUDIENCES,
  type ClasesPriceFrequency,
  type ClasesQuickDraft,
  type ClasesScheduleMode,
} from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import {
  ctaLabels,
  INPUT,
  LocationSection,
  MEDIA_COPY,
} from "@/app/(site)/publicar/community/shared/components/communityFormPrimitives";
import { ClasesScheduleQuickApply } from "@/app/(site)/publicar/clases/components/ClasesScheduleQuickApply";
import {
  CLASES_PAYMENT_METHOD_ORDER,
  CUSTOM_PAYMENT_OTHER_MAX,
  getClasesPaymentMethodLabel,
} from "@/app/(site)/publicar/clases/lib/clasesPaymentMethods";

type RouterLike = ReturnType<typeof useRouter>;

/** Clases — category-owned editor composition. */
export default function ClasesQuickApplication() {
  const router = useRouter();
  const sp = useSearchParams();
  const { routeLang, copyLang: lang } = resolveClasificadosPublishLang(sp?.get("lang"));
  const sharedCopy = COMMUNITY_PUBLISH_COPY[lang];

  return <ClasesQuickApplicationBody lang={lang} routeLang={routeLang} sharedCopy={sharedCopy} router={router} />;
}

function ClasesQuickApplicationBody({
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

  // Globalization Build D-F5 — this application had zero native browser-exit protection.
  // useCommunityDraftSession already persists synchronously on every state change, so this only
  // adds the "are you sure" warning on a real tab close; the flush call is a harmless no-op
  // safety net for the same session storage write.
  useBusinessApplicationLeaveGuard({
    isDirty: hydrated && state.title.trim() !== "",
    persist: () =>
      flushCommunityDraftToSession(COMMUNITY_SESSION_KEYS.clases, state, (raw) =>
        normalizeClasesQuickDraft(raw),
      ),
  });

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
    router.push(communityHandoffPreviewUrl("clases", routeLang));
  }, [previewDisabled, state, router, routeLang]);

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
      let inFlightId: string | null = null;
      try {
        inFlightId = window.sessionStorage.getItem(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS.clases);
      } catch {
        /* sessionStorage optional */
      }
      const r = await publishCommunityQuickToListings({
        kind: "clases",
        draft: state,
        lang,
        existingListingId: inFlightId,
        onListingIdKnown: (listingId) => {
          try {
            window.sessionStorage.setItem(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS.clases, listingId);
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
        window.sessionStorage.removeItem(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS.clases);
      } catch {
        /* sessionStorage optional */
      }
      clearCommunityStagedPublish("clases");
      // Gate 4 (Globalization Build 04) — the draft itself must also be cleared on success, not
      // just the in-flight/staged-publish keys, or navigating Back to this form re-hydrates the
      // already-published draft and a resubmit creates a genuine duplicate listing row. Mirrors
      // the same clear-on-success behavior Busco/Mascotas already had (their own draft key is
      // removed directly in their publish bars).
      reset();
      router.push(withClasificadosPublishLang(`/clasificados/anuncio/${r.listingId}`, routeLang));
    } finally {
      setPublishing(false);
    }
  }, [publishDisabled, publishing, state, lang, routeLang, router, reset]);

  const onSaveDraft = useCallback(() => {
    const envelope = buildClasesQuickPublishEnvelope(state, lang);
    writeCommunityStagedPublish("clases", envelope);
    setSessionSaveNotice(true);
    setPublishError(null);
  }, [state, lang]);

  const organizerLogoFileRef = useRef<HTMLInputElement>(null);
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
            <fieldset>
              <legend className="text-sm font-semibold text-[color:var(--lx-text)]">
                {copy.fields.categoriesMulti} *
              </legend>
              <p className="mt-1 text-xs text-[color:var(--lx-text-2)]">{copy.fields.categoriesHelper}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CLASES_CATEGORY_OPTIONS.filter((o) => o.value).map((o) => {
                  const checked = state.categories.includes(o.value);
                  const atMax = state.categories.length >= MAX_CLASES_CATEGORIES;
                  return (
                    <label
                      key={o.value}
                      className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs ${
                        checked
                          ? "border-[color:var(--lx-cta-dark)]/50 bg-[color:var(--lx-cta-dark)]/10"
                          : "border-black/10 bg-white"
                      } ${!checked && atMax ? "opacity-40" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && atMax}
                        onChange={() => {
                          const next = checked
                            ? state.categories.filter((c) => c !== o.value)
                            : [...state.categories, o.value].slice(0, MAX_CLASES_CATEGORIES);
                          patch({ categories: next, category: next[0] ?? "" });
                        }}
                        className="h-3.5 w-3.5 rounded border-black/20"
                      />
                      {lang === "en" ? o.labelEn : o.labelEs}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {state.categories.includes("otro") ? (
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
                className={`${INPUT} min-h-[160px]`}
                value={state.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </label>
            <fieldset>
              <legend className="text-sm font-semibold text-[color:var(--lx-text)]">
                {copy.fields.audience} *
              </legend>
              <p className="mt-1 text-xs text-[color:var(--lx-text-2)]">{copy.fields.audiencesHelper}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMMUNITY_AUDIENCE_OPTIONS.map((o) => {
                  const checked = state.audiences.includes(o.value);
                  const atMax = state.audiences.length >= MAX_CLASES_AUDIENCES;
                  return (
                    <label
                      key={o.value}
                      className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs ${
                        checked
                          ? "border-[color:var(--lx-cta-dark)]/50 bg-[color:var(--lx-cta-dark)]/10"
                          : "border-black/10 bg-white"
                      } ${!checked && atMax ? "opacity-40" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && atMax}
                        onChange={() => {
                          const next = checked
                            ? state.audiences.filter((a) => a !== o.value)
                            : [...state.audiences, o.value].slice(0, MAX_CLASES_AUDIENCES);
                          patch({ audiences: next, audience: next[0] ?? "" });
                        }}
                        className="h-3.5 w-3.5 rounded border-black/20"
                      />
                      {lang === "en" ? o.labelEn : o.labelEs}
                    </label>
                  );
                })}
              </div>
            </fieldset>
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
              <p className="mb-1 text-xs text-[color:var(--lx-text-2)]">{copy.fields.bringNoteHelper}</p>
              <textarea
                className={`${INPUT} min-h-[120px]`}
                value={state.bringNote}
                onChange={(e) => patch({ bringNote: e.target.value })}
                placeholder={lang === "es" ? "Opcional" : "Optional"}
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.materialsNote}
              </EmpleosFieldLabel>
              <p className="mb-1 text-xs text-[color:var(--lx-text-2)]">{copy.fields.materialsNoteHelper}</p>
              <textarea
                className={`${INPUT} min-h-[120px]`}
                value={state.materialsNote}
                onChange={(e) => patch({ materialsNote: e.target.value })}
                placeholder={lang === "es" ? "Opcional" : "Optional"}
              />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {copy.fields.requirementsNote}
              </EmpleosFieldLabel>
              <p className="mb-1 text-xs text-[color:var(--lx-text-2)]">{copy.fields.requirementsNoteHelper}</p>
              <textarea
                className={`${INPUT} min-h-[120px]`}
                value={state.requirementsNote}
                onChange={(e) => patch({ requirementsNote: e.target.value })}
                placeholder={lang === "es" ? "Opcional" : "Optional"}
              />
            </label>
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
                    ? "La clase tiene costo para el estudiante. Publicar el anuncio en Leonix cuesta $24.99 por 30 días — al publicar te llevaremos a un pago seguro para completar la publicación."
                    : "This class has a cost for the student. The Leonix listing fee is $24.99 per 30 days — when you publish, we'll take you to secure checkout to complete the listing."}
                </p>
                <div className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-page)] px-3 py-3">
                  <p className="text-xs font-bold text-[color:var(--lx-text)]">{copy.priceSummary.title}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[color:var(--lx-text-2)]">{copy.priceSummary.classPriceLabel}</span>
                    <span className="font-semibold text-[color:var(--lx-text)]">
                      {state.priceAmount.trim() || "—"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-[color:var(--lx-text-2)]">
                      {lang === "es" ? "Tarifa de anuncio Leonix" : "Leonix listing fee"}
                    </span>
                    <span className="font-semibold text-[color:var(--lx-text)]">{copy.priceSummary.leonixFeePaid}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </EmpleosSectionCard>

          <EmpleosSectionCard title={copy.fields.paymentMethods}>
            <p className="text-xs text-[color:var(--lx-text-2)]">{copy.fields.paymentMethodsHelper}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CLASES_PAYMENT_METHOD_ORDER.map((id) => {
                const checked = state.paymentMethods.includes(id);
                return (
                  <label
                    key={id}
                    className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs ${
                      checked
                        ? "border-[color:var(--lx-cta-dark)]/50 bg-[color:var(--lx-cta-dark)]/10"
                        : "border-black/10 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? state.paymentMethods.filter((m) => m !== id)
                          : [...state.paymentMethods, id];
                        patch({ paymentMethods: next });
                      }}
                      className="h-3.5 w-3.5 rounded border-black/20"
                    />
                    {getClasesPaymentMethodLabel(id, lang)}
                  </label>
                );
              })}
            </div>
            {state.paymentMethods.includes("otro") ? (
              <label className="mt-3 block text-sm">
                <EmpleosFieldLabel lang={lang} optional>
                  {copy.fields.paymentMethodOther}
                </EmpleosFieldLabel>
                <input
                  className={INPUT}
                  value={state.paymentMethodOther}
                  maxLength={CUSTOM_PAYMENT_OTHER_MAX}
                  onChange={(e) => patch({ paymentMethodOther: e.target.value })}
                  placeholder={lang === "es" ? "Ej. Apple Pay" : "e.g. Apple Pay"}
                />
              </label>
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
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold text-[color:var(--lx-text)]">
                {copy.fields.scheduleMode} *
              </legend>
              <p className="mt-1 text-xs text-[color:var(--lx-text-2)]">{copy.fields.scheduleModeHelper}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {(["recurring", "one_time"] as const).map((value) => (
                  <label key={value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="clases-schedule-mode"
                      checked={state.scheduleMode === value}
                      onChange={() => patch({ scheduleMode: value as ClasesScheduleMode })}
                    />
                    {value === "recurring" ? copy.fields.scheduleModeRecurring : copy.fields.scheduleModeOneTime}
                  </label>
                ))}
              </div>
            </fieldset>

            {state.scheduleMode === "one_time" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="block text-sm">
                  <EmpleosFieldLabel lang={lang} required>
                    {copy.fields.oneTimeDate}
                  </EmpleosFieldLabel>
                  <input
                    type="date"
                    className={INPUT}
                    value={state.oneTimeDate}
                    onChange={(e) => patch({ oneTimeDate: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  <EmpleosFieldLabel lang={lang} required>
                    {copy.fields.oneTimeStart}
                  </EmpleosFieldLabel>
                  <input
                    type="time"
                    className={INPUT}
                    value={state.oneTimeStart}
                    onChange={(e) => patch({ oneTimeStart: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  <EmpleosFieldLabel lang={lang} required>
                    {copy.fields.oneTimeEnd}
                  </EmpleosFieldLabel>
                  <input
                    type="time"
                    className={INPUT}
                    value={state.oneTimeEnd}
                    onChange={(e) => patch({ oneTimeEnd: e.target.value })}
                  />
                </label>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  <EmpleosFieldLabel lang={lang} required>
                    {copy.fields.weeklySchedule}
                  </EmpleosFieldLabel>
                  <ClasesScheduleQuickApply
                    lang={lang}
                    rows={state.weeklySchedule}
                    onApply={(days, open, close) =>
                      patch({
                        weeklySchedule: state.weeklySchedule.map((r) =>
                          days.includes(r.day) ? { ...r, closed: false, open, close } : r,
                        ),
                      })
                    }
                  />
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
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <EmpleosFieldLabel lang={lang} optional>
                      {copy.fields.startDate}
                    </EmpleosFieldLabel>
                    <input
                      type="date"
                      className={INPUT}
                      value={state.startDate}
                      onChange={(e) => patch({ startDate: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <EmpleosFieldLabel lang={lang} optional>
                      {copy.fields.endDate}
                    </EmpleosFieldLabel>
                    <input
                      type="date"
                      className={INPUT}
                      value={state.endDate}
                      onChange={(e) => patch({ endDate: e.target.value })}
                    />
                  </label>
                </div>
                <p className="mt-1 text-xs text-[color:var(--lx-text-2)]">
                  {state.startDate.trim() || state.endDate.trim() ? copy.fields.dateRangeHelper : copy.fields.ongoingHelper}
                </p>
              </>
            )}
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

          <EmpleosSectionCard title={lang === "es" ? "Enlaces de la clase" : "Class links"}>
            <ClasesClassLinksSection
              lang={lang}
              registrationRequired={state.registrationRequired}
              classLinks={state.classLinks}
              onChangeLinks={(p) => patch({ classLinks: { ...state.classLinks, ...p } })}
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
          showSecondaryActions={false}
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
