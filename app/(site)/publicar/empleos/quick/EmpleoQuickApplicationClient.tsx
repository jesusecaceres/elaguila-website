"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { EmpleosApplicationFinalStep } from "@/app/publicar/empleos/shared/components/EmpleosApplicationFinalStep";
import { EmpleosReadinessBanner } from "@/app/publicar/empleos/shared/components/EmpleosReadinessBanner";
import { EMPLEOS_PUBLISH_SHARED_COPY } from "@/app/publicar/empleos/shared/copy/empleosPublishSharedCopy";
import { useEmpleosDraftSession } from "@/app/publicar/empleos/shared/hooks/useEmpleosDraftSession";
import { EmpleosImageGalleryEditor } from "@/app/publicar/empleos/shared/media/EmpleosImageGalleryEditor";
import { EmpleosSingleImageField } from "@/app/publicar/empleos/shared/media/EmpleosSingleImageField";
import { EmpleosVideoDraftField } from "@/app/publicar/empleos/shared/media/EmpleosVideoDraftField";
import { buildEmpleosPublishEnvelopeFromQuick } from "@/app/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";
import { EmpleosPublishConfirmModal } from "@/app/publicar/empleos/shared/publish/EmpleosPublishConfirmModal";
import { saveEmpleosDraftAndStartPaidJobCheckout } from "@/app/publicar/empleos/shared/publish/empleosRevenueCheckout";
import { clearEmpleosStagedPublish } from "@/app/publicar/empleos/shared/publish/empleosPublishStaging";
import { replaceRouteForEmpleosResumeEdit } from "@/app/publicar/empleos/shared/lib/empleosEditLaneRedirect";
import { hydrateQuickDraftFromEnvelope } from "@/app/publicar/empleos/shared/lib/empleosDraftFromEnvelope";
import { flushEmpleosDraftToSession } from "@/app/publicar/empleos/shared/lib/flushEmpleosDraftToSession";
import { gateEmpleosQuickPreview } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
import { EMPLEOS_SESSION_KEYS } from "@/app/publicar/empleos/shared/constants/empleosSessionKeys";
import { empleosHandoffPreviewUrl } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import { EmpleosBenefitsPicker } from "@/app/publicar/empleos/shared/components/EmpleosBenefitsPicker";
import { EmpleosShiftScheduleEditor } from "@/app/publicar/empleos/shared/components/EmpleosShiftScheduleEditor";
import {
  EMPLEOS_PAY_UNIT_OPTIONS_EN,
  EMPLEOS_PAY_UNIT_OPTIONS_ES,
  composePayApplicationPreview,
  syncLegacyPayField,
} from "@/app/publicar/empleos/shared/lib/empleosPayDisplay";
import { emptyEmpleosQuickDraft, type EmpleosQuickDraft, type EmpleosQuickPreferredApplyMethod } from "@/app/publicar/empleos/shared/types/empleosQuickDraft";
import {
  sampleCategorySelectOptions,
  sampleExperienceOptions,
  sampleJobTypeSelectOptions,
  sampleModalityOptions,
} from "@/app/clasificados/empleos/data/empleosLandingSampleData";
import type { JobModalitySlug } from "@/app/clasificados/empleos/data/empleosJobTypes";

import { EmpleosFieldLabel, EmpleosSectionCard } from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";

const INPUT = "mt-1 w-full min-h-[44px] rounded-lg border border-black/10 px-3 py-2 text-sm";
const SELECT = `${INPUT} bg-white`;

const PREFERRED_APPLY_OPTIONS_ES: { value: EmpleosQuickPreferredApplyMethod; label: string }[] = [
  { value: "apply-link", label: "Aplicar en línea" },
  { value: "email", label: "Correo" },
  { value: "phone", label: "Teléfono" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "message", label: "Mensaje" },
];

const PREFERRED_APPLY_OPTIONS_EN: { value: EmpleosQuickPreferredApplyMethod; label: string }[] = [
  { value: "apply-link", label: "Apply online" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "message", label: "Message" },
];

export default function EmpleoQuickApplicationClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const copy = EMPLEOS_PUBLISH_SHARED_COPY[lang];

  const { state, patch, reset, hydrated } = useEmpleosDraftSession<EmpleosQuickDraft>(
    EMPLEOS_SESSION_KEYS.quick,
    emptyEmpleosQuickDraft()
  );

  const [publishOpen, setPublishOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [stagedNotice, setStagedNotice] = useState(false);
  const [serverListingId, setServerListingId] = useState<string | null>(null);
  const loadedEditRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const editId = sp?.get("edit")?.trim();
    if (!editId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(editId)) return;
    if (loadedEditRef.current === editId) return;
    loadedEditRef.current = editId;
    void (async () => {
      const sb = createSupabaseBrowserClient();
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/clasificados/empleos/listings/${editId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { ok?: boolean; envelope?: EmpleosPublishEnvelope | null; lane?: string };
      if (!json.ok || !json.envelope || typeof json.envelope !== "object") return;
      if (replaceRouteForEmpleosResumeEdit(router, { editId, lang, expected: "quick", actual: json.lane })) {
        loadedEditRef.current = null;
        return;
      }
      const next = hydrateQuickDraftFromEnvelope(json.envelope);
      if (next) {
        patch(() => next);
        setServerListingId(editId);
      }
    })();
  }, [hydrated, sp, patch, router, lang]);

  const gate = useMemo(() => gateEmpleosQuickPreview(state, lang), [state, lang]);
  const previewDisabled = !gate.ok;
  const previewIssues = gate.ok ? [] : gate.issues;

  const goPreview = useCallback(() => {
    if (previewDisabled) return;
    flushEmpleosDraftToSession(EMPLEOS_SESSION_KEYS.quick, state);
    markPublishFlowOpeningPreview();
    router.push(empleosHandoffPreviewUrl("quick", lang));
  }, [lang, previewDisabled, router, state]);

  const handleDeleteApplication = useCallback(() => {
    reset();
    setStagedNotice(false);
    clearEmpleosStagedPublish();
  }, [reset]);

  const revokeIfBlob = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  const preferredApplyOptions = lang === "es" ? PREFERRED_APPLY_OPTIONS_ES : PREFERRED_APPLY_OPTIONS_EN;
  const payUnitOptions = lang === "es" ? EMPLEOS_PAY_UNIT_OPTIONS_ES : EMPLEOS_PAY_UNIT_OPTIONS_EN;

  const patchPay = (partial: Partial<Pick<EmpleosQuickDraft, "payAmount" | "payUnit" | "payUnitCustom" | "payNote">>) => {
    patch((prev) => {
      const next = { ...prev, ...partial };
      return {
        ...next,
        pay: syncLegacyPayField({
          pay: prev.pay,
          payAmount: next.payAmount,
          payUnit: next.payUnit,
          payUnitCustom: next.payUnitCustom,
          payNote: next.payNote,
        }, lang),
      };
    });
  };

  const mediaCopy =
    lang === "es"
      ? {
          urlPh: "https://…",
          addUrl: "Añadir URL",
          upload: "Subir imagen",
          main: "Principal",
          remove: "Quitar",
          up: "Arriba",
          down: "Abajo",
          logo: "Logo (opcional)",
          logoUrl: "Pegar URL del logo",
          addLogoUrl: "Usar URL",
          uploadLogo: "Subir logo",
          removeLogo: "Quitar logo",
          altLogo: "Texto alternativo",
          videoSection: "Videos / Enlaces de video",
          videoHint: "Agrega enlaces públicos de YouTube, TikTok, Instagram u otra plataforma compatible. No se suben archivos de video.",
          videoUrlField: "Enlace de video",
          videoUrlPh: "https://…",
          videoApplyUrl: "Usar URL",
          videoPickFile: "",
          videoClear: "Quitar video",
          videoAdd: "Añadir video",
          videoRemove: "Quitar",
          videoLimitHint: "Puedes agregar hasta 4 enlaces de video.",
          videoDuplicate: "Ese enlace ya fue agregado.",
          videoEmpty: "Pega un enlace antes de añadirlo.",
          videoInvalidUrl: "Pega un enlace válido que empiece con https://",
          videoLocalRemoved: "Los archivos locales de video ya no se publican aquí. Agrega un enlace público.",
          benefitAdd: "+ Añadir beneficio",
          benefitRemove: "Quitar",
          benefitPh: "Ej. Seguro médico, pago semanal, bonos",
          altImage: "Texto alternativo (imagen)",
        }
      : {
          urlPh: "https://…",
          addUrl: "Add URL",
          upload: "Upload image",
          main: "Main",
          remove: "Remove",
          up: "Up",
          down: "Down",
          logo: "Logo (optional)",
          logoUrl: "Logo image URL",
          addLogoUrl: "Use URL",
          uploadLogo: "Upload logo",
          removeLogo: "Remove logo",
          altLogo: "Alt text",
          videoSection: "Videos / Video links",
          videoHint: "Add public links from YouTube, TikTok, Instagram, or another supported platform. Video files are not uploaded.",
          videoUrlField: "Video link",
          videoUrlPh: "https://…",
          videoApplyUrl: "Apply URL",
          videoPickFile: "",
          videoClear: "Remove video",
          videoAdd: "Add video",
          videoRemove: "Remove",
          videoLimitHint: "You can add up to 4 video links.",
          videoDuplicate: "That link was already added.",
          videoEmpty: "Paste a link before adding it.",
          videoInvalidUrl: "Paste a valid link that starts with https://",
          videoLocalRemoved: "Local video files are no longer publishable here. Add a public video link instead.",
          benefitAdd: "+ Add benefit",
          benefitRemove: "Remove",
          benefitPh: "e.g. Health insurance, weekly pay, bonuses",
          altImage: "Image alt text",
        };

  if (!hydrated) {
    return <div className="min-h-[50vh] bg-[#FCF9F2]" aria-busy="true" />;
  }

  const es = lang === "es";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FCF9F2] px-4 pb-24 pt-24 text-[#2A2826] sm:px-5">
      <div className="mx-auto min-w-0 max-w-3xl">

        {/* Header */}
        <header className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-[#2A2826] sm:text-3xl">
            {es ? "Publicar empleo" : "Post a job"}
          </h1>
          <p className="mt-2 text-sm text-[#5C564E]">{copy.applicationPage.quickSubtitle}</p>
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-[#C9B46A]/40 bg-[#FFFDF5] px-4 py-3">
            <span className="mt-0.5 text-[#C9B46A]" aria-hidden>★</span>
            <p className="text-sm font-semibold text-[#6B5320]">
              {es
                ? "$24.99 por 30 días. La publicación se activa después de la revisión final."
                : "$24.99 for 30 days. Your listing activates after final review."}
            </p>
          </div>
        </header>

        <EmpleosReadinessBanner visible={!gate.ok} intro={copy.gateFail} issues={previewIssues} />

        <div className="space-y-6">

          {/* ── SECTION 1: Puesto y empleador ─────────────────────────────────── */}
          <EmpleosSectionCard title={es ? "1. Puesto y empleador" : "1. Job and employer"}>
            <p className="text-xs text-[#7A756E]">
              {es
                ? "Esta información define cómo aparecerá el empleo en resultados y en la vista pública."
                : "This information controls how the job appears in results and on the public listing."}
            </p>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{es ? "Título del puesto" : "Job title"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.title} onChange={(e) => patch({ title: e.target.value })}
                placeholder={es ? "Ej. Cocinero, Técnico HVAC, Cajero" : "e.g. Cook, HVAC Tech, Cashier"} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{es ? "Nombre del negocio / empleador" : "Business or employer name"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.businessName} onChange={(e) => patch({ businessName: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{es ? "Categoría" : "Job category"}</EmpleosFieldLabel>
                <select className={SELECT} value={state.categorySlug} onChange={(e) => patch({ categorySlug: e.target.value })}>
                  {sampleCategorySelectOptions.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{es ? "Nivel de experiencia" : "Experience level"}</EmpleosFieldLabel>
                <select className={SELECT} value={state.experienceLevel}
                  onChange={(e) => patch({ experienceLevel: e.target.value as EmpleosQuickDraft["experienceLevel"] })}>
                  {sampleExperienceOptions.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
            {state.categorySlug === "otro" ? (
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{es ? "Describe la categoría" : "Describe the category"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.categoryCustom} onChange={(e) => patch({ categoryCustom: e.target.value })}
                  placeholder={es ? "Ej. Manufactura ligera" : "e.g. Light manufacturing"} />
              </label>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{es ? "Tipo de empleo" : "Employment type"}</EmpleosFieldLabel>
                <select className={SELECT} value={state.jobType} onChange={(e) => patch({ jobType: e.target.value })}>
                  <option value="">{es ? "Seleccionar…" : "Select…"}</option>
                  {sampleJobTypeSelectOptions.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{es ? "Modalidad" : "Workplace type"}</EmpleosFieldLabel>
                <select className={SELECT} value={state.workModality}
                  onChange={(e) => patch({ workModality: e.target.value as JobModalitySlug })}>
                  {sampleModalityOptions.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
            {state.jobType === "otro" ? (
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{es ? "Describe el tipo de empleo" : "Describe employment type"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.jobTypeCustom} onChange={(e) => patch({ jobTypeCustom: e.target.value })}
                  placeholder={es ? "Ej. Turno rotativo especial" : "e.g. Special rotating shift"} />
              </label>
            ) : null}
          </EmpleosSectionCard>

          <EmpleosSectionCard title={es ? "2. Descripción y requisitos" : "2. Description and requirements"}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{es ? "Descripción del puesto" : "Job description"}</EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[120px]`} value={state.description}
                onChange={(e) => patch({ description: e.target.value })} />
              <p className="mt-1 text-xs text-[#7A756E]">
                {es
                  ? "Incluye responsabilidades, requisitos, experiencia necesaria, documentos o certificaciones, e instrucciones de cómo aplicar."
                  : "Include responsibilities, requirements, experience, documents or certifications, and how candidates should apply."}
              </p>
            </label>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={es ? "3. Pago, horario y beneficios" : "3. Pay, schedule and benefits"}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{es ? "Pago (monto o rango)" : "Pay (amount or range)"}</EmpleosFieldLabel>
                <input
                  className={INPUT}
                  value={state.payAmount}
                  onChange={(e) => patchPay({ payAmount: e.target.value })}
                  placeholder={es ? "Ej. 18, 18 - 25" : "e.g. 18, 18 - 25"}
                  disabled={state.payUnit === "a-convenir" && !state.payAmount}
                />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{es ? "Tipo de pago" : "Pay type"}</EmpleosFieldLabel>
                <select
                  className={SELECT}
                  value={state.payUnit}
                  onChange={(e) => patchPay({ payUnit: e.target.value, payAmount: e.target.value === "a-convenir" ? "" : state.payAmount })}
                >
                  {payUnitOptions.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
            {state.payUnit === "otro" ? (
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{es ? "Etiqueta de pago personalizada" : "Custom pay label"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.payUnitCustom} onChange={(e) => patchPay({ payUnitCustom: e.target.value })}
                  placeholder={es ? "Ej. Por entrega" : "e.g. Per delivery"} />
              </label>
            ) : null}
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang}>{es ? "Nota de pago (opcional)" : "Pay note (optional)"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.payNote} onChange={(e) => patchPay({ payNote: e.target.value })}
                placeholder={es ? "Ej. más bonos, propinas incluidas" : "e.g. plus bonuses, tips included"} />
            </label>
            {state.payAmount || state.payUnit || state.pay ? (
              <p className="rounded-lg border border-[#C9B46A]/35 bg-[#FBF7EF] px-3 py-2 text-xs text-[#5C5346]">
                {es ? "Vista previa:" : "Preview:"}{" "}
                <span className="font-semibold text-[#7A1E2C]">
                  {composePayApplicationPreview({
                    pay: state.pay,
                    payAmount: state.payAmount,
                    payUnit: state.payUnit,
                    payUnitCustom: state.payUnitCustom,
                    payNote: state.payNote,
                  }, lang)}
                </span>
              </p>
            ) : null}
            <div>
              <EmpleosFieldLabel lang={lang} required>{es ? "Horario / turnos" : "Schedule / shifts"}</EmpleosFieldLabel>
              <p className="mt-0.5 text-xs text-[#7A756E]">
                {es
                  ? "Añade una fila por turno. Usa «Flexible» para empleos con horario abierto."
                  : "Add one row per shift. Use «Flexible» for open-schedule jobs."}
              </p>
              <div className="mt-2">
                <EmpleosShiftScheduleEditor
                  lang={lang}
                  rows={state.scheduleRows}
                  onChange={(scheduleRows, schedule) => patch({ scheduleRows, schedule })}
                />
              </div>
            </div>
            <div>
              <EmpleosFieldLabel lang={lang}>{es ? "Beneficios (opcional)" : "Benefits (optional)"}</EmpleosFieldLabel>
              <div className="mt-2">
                <EmpleosBenefitsPicker
                  lang={lang}
                  selected={state.benefits}
                  onChange={(benefits) => patch({ benefits })}
                />
              </div>
            </div>
          </EmpleosSectionCard>

          {/* ── SECTION 4: Multimedia ─────────────────────────────────────────── */}
          <EmpleosSectionCard title={es ? "4. Multimedia" : "4. Media"}>
            <div>
              <EmpleosFieldLabel lang={lang} required>{es ? "Imagen principal / flyer" : "Main image / flyer"}</EmpleosFieldLabel>
              <p className="mt-1 text-xs text-[#7A756E]">
                {es
                  ? "Puede ser un flyer de contratación, foto del lugar de trabajo, del equipo o un gráfico de hiring. Los flyers se muestran completos cuando es posible."
                  : "This can be a hiring flyer, workplace photo, team photo, or hiring graphic. Flyers are shown uncropped when possible."}
              </p>
              <div className="mt-3">
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
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2A2826]">{mediaCopy.logo}</p>
              <p className="mt-1 text-xs text-[#7A756E]">
                {es
                  ? "El logo aparece junto al nombre del empleador en el encabezado y en la tarjeta de contacto."
                  : "The logo appears next to the employer name in the header and contact card."}
              </p>
              <div className="mt-2">
                <EmpleosSingleImageField
                  url={state.logoUrl}
                  alt=""
                  onChange={({ url }) => patch({ logoUrl: url })}
                  urlPlaceholder={mediaCopy.logoUrl}
                  addUrlLabel={mediaCopy.addLogoUrl}
                  uploadLabel={mediaCopy.uploadLogo}
                  removeLabel={mediaCopy.removeLogo}
                  altLabel={mediaCopy.altLogo}
                  showAlt={false}
                />
              </div>
            </div>
            <EmpleosVideoDraftField
              objectUrl={state.videoObjectUrl}
              fileName={state.videoFileName}
              externalUrl={state.videoUrl}
              videoUrls={state.videoUrls}
              revokeIfBlob={revokeIfBlob}
              onPatch={(p) => patch((prev) => ({ ...prev, ...p }))}
              labels={{
                sectionTitle: mediaCopy.videoSection,
                hint: mediaCopy.videoHint,
                urlField: mediaCopy.videoUrlField,
                urlPlaceholder: mediaCopy.videoUrlPh,
                applyUrl: mediaCopy.videoApplyUrl,
                pickFile: mediaCopy.videoPickFile,
                clear: mediaCopy.videoClear,
                addVideo: mediaCopy.videoAdd,
                remove: mediaCopy.videoRemove,
                limitHint: mediaCopy.videoLimitHint,
                duplicateUrl: mediaCopy.videoDuplicate,
                emptyUrl: mediaCopy.videoEmpty,
                invalidUrl: mediaCopy.videoInvalidUrl,
                localFileRemoved: mediaCopy.videoLocalRemoved,
              }}
            />
          </EmpleosSectionCard>

          {/* ── SECTION 5: Tarjeta del empleador / contacto de contratación ── */}
          <EmpleosSectionCard title={es ? "5. Tarjeta del empleador / contacto de contratación" : "5. Employer card / hiring contact"}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang}>{es ? "Enlace para aplicar" : "Application link"}</EmpleosFieldLabel>
              <input className={INPUT} type="url" value={state.applyLink}
                onChange={(e) => patch({ applyLink: e.target.value })}
                placeholder="https://" />
              <p className="mt-1 text-xs text-[#7A756E]">
                {es ? "Si tienes un sitio de aplicaciones, pega el enlace. Aparecerá como el botón \"Aplicar ahora\"."
                    : "If you have an application portal, paste the link. It becomes the \"Apply now\" button."}
              </p>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{es ? "Teléfono de reclutamiento" : "Recruiting phone"}</EmpleosFieldLabel>
                <input className={INPUT} type="tel" value={state.phone}
                  onChange={(e) => patch({ phone: e.target.value })} placeholder="+1 (555) 000-0000" />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>WhatsApp</EmpleosFieldLabel>
                <input className={INPUT} type="tel" value={state.whatsapp}
                  onChange={(e) => patch({ whatsapp: e.target.value })} placeholder="15551234567" />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{es ? "Mensaje de texto / SMS" : "Text message / SMS"}</EmpleosFieldLabel>
                <input className={INPUT} type="tel" value={state.smsPhone}
                  onChange={(e) => patch({ smsPhone: e.target.value })} placeholder="+1 (555) 000-0000" />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{es ? "Correo de reclutamiento" : "Recruiting email"}</EmpleosFieldLabel>
                <input className={INPUT} type="email" value={state.email}
                  onChange={(e) => patch({ email: e.target.value })} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{es ? "Nombre de contacto" : "Contact name"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.contactPerson}
                  onChange={(e) => patch({ contactPerson: e.target.value })}
                  placeholder={es ? "Ej. Ana García" : "e.g. Ana García"} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{es ? "Título / cargo del contacto" : "Contact title / role"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.contactTitle}
                  onChange={(e) => patch({ contactTitle: e.target.value })}
                  placeholder={es ? "Ej. Gerente de RRHH, Reclutadora" : "e.g. HR Manager, Recruiter"} />
              </label>
            </div>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang}>{es ? "Método preferido de contacto" : "Preferred contact method"}</EmpleosFieldLabel>
              <select className={SELECT} value={state.preferredApplyMethod}
                onChange={(e) => patch({ preferredApplyMethod: e.target.value as EmpleosQuickPreferredApplyMethod })}>
                {preferredApplyOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <p className="text-xs text-[#7A756E]">
              {es
                ? "Al menos teléfono, WhatsApp o correo es necesario para que los candidatos te contacten."
                : "At least phone, WhatsApp, or email is required for candidates to reach you."}
            </p>
          </EmpleosSectionCard>

          {/* ── SECTION 6: Ubicación del empleo ─────────────────────────────── */}
          <EmpleosSectionCard title={es ? "6. Ubicación del empleo" : "6. Job location"}>
            <p className="text-xs leading-relaxed text-[#7A756E]">
              {es
                ? "Si el empleo es remoto, puedes dejar la dirección exacta en blanco. Ciudad y país se usan para búsqueda y filtros."
                : "For remote jobs, you may leave the exact address blank. City and country are used for search and filters."}
            </p>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang}>{es ? "Lugar / sucursal / zona de trabajo" : "Workplace / branch / work area"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.workspaceName}
                onChange={(e) => patch({ workspaceName: e.target.value })}
                placeholder={es ? "Ej. Planta Norte, Sucursal Centro" : "e.g. North Plant, Downtown Branch"} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang}>{es ? "Dirección línea 1" : "Address line 1"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.addressLine1} onChange={(e) => patch({ addressLine1: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang}>{es ? "Dirección línea 2" : "Address line 2"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.addressLine2} onChange={(e) => patch({ addressLine2: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{es ? "Ciudad" : "City"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.city}
                  onChange={(e) => patch({ city: e.target.value, addressCity: e.target.value })}
                  placeholder={es ? "Ej. Modesto, Ciudad de México" : "e.g. Modesto, Mexico City"} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{es ? "Estado / Región" : "State / Region"}</EmpleosFieldLabel>
                <input className={INPUT}
                  value={state.stateRegion || state.state}
                  onChange={(e) => patch({ state: e.target.value, stateRegion: e.target.value, addressState: e.target.value })}
                  placeholder={es ? "Ej. CA, Jalisco, Ontario" : "e.g. CA, Jalisco, Ontario"} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{es ? "País" : "Country"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.country}
                  onChange={(e) => patch({ country: e.target.value })}
                  placeholder={es ? "Ej. Estados Unidos, México, Canadá" : "e.g. United States, Mexico, Canada"} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{es ? "Código postal" : "ZIP / Postal code"}</EmpleosFieldLabel>
                <input className={INPUT}
                  value={state.postalCode || state.addressZip}
                  onChange={(e) => patch({ addressZip: e.target.value, postalCode: e.target.value })}
                  placeholder={es ? "Ej. 95350, 28013, K1A 0B1" : "e.g. 95350, 28013, K1A 0B1"} />
              </label>
            </div>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang}>{es ? "Área de servicio / notas de ubicación" : "Service area / location notes"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.locationNotes}
                onChange={(e) => patch({ locationNotes: e.target.value })}
                placeholder={es ? "Ej. Zona metropolitana, Valle Central, servicio a domicilio" : "e.g. Metro area, Central Valley, door-to-door"} />
            </label>
          </EmpleosSectionCard>

          {/* ── SECTION 7: Empresa y enlaces ─────────────────────────────── */}
          <EmpleosSectionCard title={es ? "7. Redes y enlaces del empleador" : "7. Employer links and social"}>
            <p className="text-xs text-[#7A756E]">
              {es
                ? "Solo se mostrarán los enlaces que completes. Úsalos para que los candidatos conozcan más tu empresa."
                : "Only filled links will be shown. Use them to help candidates learn about your company."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{es ? "Sitio web de la empresa" : "Company website"}</EmpleosFieldLabel>
                <input className={INPUT} type="url" value={state.website}
                  onChange={(e) => patch({ website: e.target.value })} placeholder="https://" />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{es ? "LinkedIn de la empresa" : "Company LinkedIn"}</EmpleosFieldLabel>
                <input className={INPUT} type="url" value={state.companyLinkedIn}
                  onChange={(e) => patch({ companyLinkedIn: e.target.value })}
                  placeholder="https://linkedin.com/company/…" />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>Facebook</EmpleosFieldLabel>
                <input className={INPUT} type="url" value={state.companyFacebook}
                  onChange={(e) => patch({ companyFacebook: e.target.value })}
                  placeholder="https://facebook.com/…" />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>Instagram</EmpleosFieldLabel>
                <input className={INPUT} type="url" value={state.companyInstagram}
                  onChange={(e) => patch({ companyInstagram: e.target.value })}
                  placeholder="https://instagram.com/…" />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>TikTok</EmpleosFieldLabel>
                <input className={INPUT} type="url" value={state.companyTikTok}
                  onChange={(e) => patch({ companyTikTok: e.target.value })}
                  placeholder="https://tiktok.com/@…" />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>YouTube</EmpleosFieldLabel>
                <input className={INPUT} type="url" value={state.companyYouTube}
                  onChange={(e) => patch({ companyYouTube: e.target.value })}
                  placeholder="https://youtube.com/@…" />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>X / Twitter</EmpleosFieldLabel>
                <input className={INPUT} type="url" value={state.companyX}
                  onChange={(e) => patch({ companyX: e.target.value })}
                  placeholder="https://x.com/…" />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>Snapchat</EmpleosFieldLabel>
                <input className={INPUT} type="url" value={state.companySnapchat}
                  onChange={(e) => patch({ companySnapchat: e.target.value })}
                  placeholder="https://snapchat.com/add/…" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{es ? "Etiqueta del otro enlace" : "Other link label"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.companyOtherLinkLabel}
                  onChange={(e) => patch({ companyOtherLinkLabel: e.target.value })}
                  placeholder={es ? "Ej. Portal de empleos, Telegram" : "e.g. Job portal, Telegram"} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{es ? "URL del otro enlace" : "Other link URL"}</EmpleosFieldLabel>
                <input className={INPUT} type="url" value={state.companyOtherLinkUrl}
                  onChange={(e) => patch({ companyOtherLinkUrl: e.target.value })} placeholder="https://" />
              </label>
            </div>
          </EmpleosSectionCard>

        </div>

        {/* ── Final review step ─────────────────────────────────────────────── */}
        <EmpleosApplicationFinalStep
          copy={copy.finalStep}
          previewDisabled={previewDisabled}
          onVistaPrevia={goPreview}
          onPublicar={() => {
            if (previewDisabled) return;
            setPublishOpen(true);
          }}
          onDelete={handleDeleteApplication}
          stagedSuccessText={stagedNotice ? copy.stagedSuccess : null}
          publishGateBlockedHint={previewDisabled ? copy.publishBlocked : null}
          saveDraftCta={null}
          onSaveDraft={() => {
            void (async () => {
              const g = gateEmpleosQuickPreview(state, lang);
              if (!g.ok) return;
              const sb = createSupabaseBrowserClient();
              const { data } = await sb.auth.getSession();
              if (!data.session?.access_token) {
                window.alert(es ? "Inicia sesión para guardar el borrador." : "Sign in to save a draft.");
                return;
              }
              const base = buildEmpleosPublishEnvelopeFromQuick(state, lang);
              const envelope = serverListingId ? { ...base, listingId: serverListingId } : base;
              const res = await fetch("/api/clasificados/empleos/listings", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
                body: JSON.stringify({ envelope, mode: "draft" }),
              });
              const json = (await res.json()) as { ok?: boolean; error?: string; id?: string };
              if (!json.ok) {
                window.alert(json.error ?? (es ? "No se pudo guardar" : "Could not save"));
                return;
              }
              if (json.id) setServerListingId(json.id);
              clearEmpleosStagedPublish();
              setStagedNotice(true);
            })();
          }}
        />
      </div>

      <EmpleosPublishConfirmModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onConfirm={() => {
          void (async () => {
            const g = gateEmpleosQuickPreview(state, lang);
            if (!g.ok) return;
            const sb = createSupabaseBrowserClient();
            const { data } = await sb.auth.getSession();
            if (!data.session?.access_token) {
              window.alert(es ? "Inicia sesión para publicar." : "Sign in to publish.");
              return;
            }
            setCheckoutBusy(true);
            const base = buildEmpleosPublishEnvelopeFromQuick(state, lang);
            const envelope = serverListingId ? { ...base, listingId: serverListingId } : base;
            const paid = await saveEmpleosDraftAndStartPaidJobCheckout({
              envelope,
              accessToken: data.session.access_token,
              lang,
            });
            setCheckoutBusy(false);
            if (!paid.ok) {
              window.alert(paid.message);
              return;
            }
            clearEmpleosStagedPublish();
            setPublishOpen(false);
          })();
        }}
        title={copy.publishModal.title}
        intro={copy.publishModal.intro}
        checks={copy.publishModal.checks}
        confirmCta={
          checkoutBusy
            ? es
              ? "Creando pago seguro…"
              : "Creating secure checkout…"
            : es
              ? "Pagar y publicar empleo"
              : "Pay and publish job post"
        }
        cancelCta={copy.publishModal.cancelCta}
        blockedHint={copy.publishModal.blockedHint}
        closeOverlayAria={copy.publishModal.closeOverlayAria}
      />
    </main>
  );
}
