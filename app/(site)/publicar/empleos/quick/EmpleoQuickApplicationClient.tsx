"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { EmpleosApplicationFinalStep } from "@/app/publicar/empleos/shared/components/EmpleosApplicationFinalStep";
import { EmpleosReadinessBanner } from "@/app/publicar/empleos/shared/components/EmpleosReadinessBanner";
import { EmpleosCtaFieldGroup } from "@/app/publicar/empleos/shared/components/EmpleosCtaFieldGroup";
import { EMPLEOS_PUBLISH_SHARED_COPY } from "@/app/publicar/empleos/shared/copy/empleosPublishSharedCopy";
import { useEmpleosDraftSession } from "@/app/publicar/empleos/shared/hooks/useEmpleosDraftSession";
import { EmpleosImageGalleryEditor } from "@/app/publicar/empleos/shared/media/EmpleosImageGalleryEditor";
import { EmpleosSingleImageField } from "@/app/publicar/empleos/shared/media/EmpleosSingleImageField";
import { EmpleosVideoDraftField } from "@/app/publicar/empleos/shared/media/EmpleosVideoDraftField";
import { buildEmpleosPublishEnvelopeFromQuick } from "@/app/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import { EmpleosPublishConfirmModal } from "@/app/publicar/empleos/shared/publish/EmpleosPublishConfirmModal";
import { clearEmpleosStagedPublish, writeEmpleosStagedPublish } from "@/app/publicar/empleos/shared/publish/empleosPublishStaging";
import { flushEmpleosDraftToSession } from "@/app/publicar/empleos/shared/lib/flushEmpleosDraftToSession";
import { gateEmpleosQuickPreview } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
import { EMPLEOS_SESSION_KEYS } from "@/app/publicar/empleos/shared/constants/empleosSessionKeys";
import { empleosHandoffPreviewUrl } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import { emptyEmpleosQuickDraft, type EmpleosQuickDraft } from "@/app/publicar/empleos/shared/types/empleosQuickDraft";
import { EmpleosFieldLabel, EmpleosSectionCard } from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";
import { EmpleosStringLinesEditor } from "@/app/publicar/empleos/shared/ui/empleosStringLinesEditor";

const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";

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
  const [stagedNotice, setStagedNotice] = useState(false);

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

  const labelsCta =
    lang === "es"
      ? {
          phone: "Teléfono",
          whatsapp: "WhatsApp",
          email: "Email",
          website: "Sitio web (opcional)",
          primary: "CTA principal *",
        }
      : {
          phone: "Phone",
          whatsapp: "WhatsApp",
          email: "Email",
          website: "Website (optional)",
          primary: "Primary CTA *",
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
          videoSection: "Video (opcional)",
          videoHint: "Archivo local o URL. No se sube a Mux en borrador.",
          videoUrlField: "URL del video",
          videoUrlPh: "https://…",
          videoApplyUrl: "Usar URL",
          videoPickFile: "Elegir archivo de video",
          videoClear: "Quitar video",
          benefitAdd: "+ Añadir beneficio",
          benefitRemove: "Quitar",
          benefitPh: "Beneficio",
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
          videoSection: "Video (optional)",
          videoHint: "Local file or URL. No Mux upload in draft.",
          videoUrlField: "Video URL",
          videoUrlPh: "https://…",
          videoApplyUrl: "Apply URL",
          videoPickFile: "Choose video file",
          videoClear: "Remove video",
          benefitAdd: "+ Add benefit",
          benefitRemove: "Remove",
          benefitPh: "Benefit",
          altImage: "Image alt text",
        };

  if (!hydrated) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] px-4 pb-24 pt-24 text-[color:var(--lx-text)] sm:px-5">
      <div className="mx-auto min-w-0 max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">{lang === "es" ? "Trabajo rápido" : "Quick job"}</h1>
          <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{copy.applicationPage.quickSubtitle}</p>
        </header>

        <EmpleosReadinessBanner visible={!gate.ok} intro={copy.gateFail} issues={previewIssues} />

        <div className="space-y-6">
          <EmpleosSectionCard title={lang === "es" ? "1. Información principal" : "1. Main details"}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Título del puesto" : "Job title"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.title} onChange={(e) => patch({ title: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Nombre del negocio" : "Business name"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.businessName} onChange={(e) => patch({ businessName: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Ciudad" : "City"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.city} onChange={(e) => patch({ city: e.target.value })} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Estado" : "State"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.state} onChange={(e) => patch({ state: e.target.value })} />
              </label>
            </div>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Tipo de empleo" : "Job type"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.jobType} onChange={(e) => patch({ jobType: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Horario" : "Schedule"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.schedule} onChange={(e) => patch({ schedule: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Pago" : "Pay"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.pay} onChange={(e) => patch({ pay: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Descripción corta" : "Short description"}</EmpleosFieldLabel>
              <textarea
                className={`${INPUT} min-h-[100px]`}
                value={state.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </label>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "2. Beneficios (opcional)" : "2. Benefits (optional)"}>
            <p className="text-xs text-[color:var(--lx-muted)]">
              {lang === "es" ? "Añade viñetas; solo las líneas con texto aparecen en el anuncio." : "Add bullets; only non-empty lines appear on the listing."}
            </p>
            <EmpleosStringLinesEditor
              items={state.benefits.length ? state.benefits : [""]}
              onChange={(benefits) => patch({ benefits })}
              addLabel={mediaCopy.benefitAdd}
              removeLabel={mediaCopy.benefitRemove}
              placeholder={mediaCopy.benefitPh}
            />
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "3. Multimedia" : "3. Media"}>
            <div>
              <div className="text-sm font-semibold text-[color:var(--lx-text)]">
                <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Imágenes" : "Images"}</EmpleosFieldLabel>
              </div>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                {lang === "es" ? "Incluye la imagen principal; puedes reordenar y marcar cuál es principal." : "Include the main image; reorder and set which is primary."}
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
              <p className="text-sm font-semibold text-[color:var(--lx-text)]">{mediaCopy.logo}</p>
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
              }}
            />
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "4. Contacto / CTA" : "4. Contact / CTA"}>
            <EmpleosCtaFieldGroup
              phone={state.phone}
              whatsapp={state.whatsapp}
              email={state.email}
              website={state.website}
              primaryCta={state.primaryCta}
              onChange={(p) => patch(p)}
              labels={labelsCta}
            />
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "5. Ubicación (opcional)" : "5. Location (optional)"}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Dirección línea 1" : "Address line 1"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.addressLine1} onChange={(e) => patch({ addressLine1: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Ciudad (detalle)" : "City (detail)"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.addressCity} onChange={(e) => patch({ addressCity: e.target.value })} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Estado (detalle)" : "State (detail)"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.addressState} onChange={(e) => patch({ addressState: e.target.value })} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "CP" : "ZIP"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.addressZip} onChange={(e) => patch({ addressZip: e.target.value })} />
              </label>
            </div>
          </EmpleosSectionCard>
        </div>

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
        />
      </div>

      <EmpleosPublishConfirmModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onConfirm={() => {
          const g = gateEmpleosQuickPreview(state, lang);
          if (!g.ok) return;
          const envelope = buildEmpleosPublishEnvelopeFromQuick(state, lang);
          writeEmpleosStagedPublish(envelope);
          setStagedNotice(true);
        }}
        title={copy.publishModal.title}
        intro={copy.publishModal.intro}
        checks={copy.publishModal.checks}
        confirmCta={copy.publishModal.confirmCta}
        cancelCta={copy.publishModal.cancelCta}
        blockedHint={copy.publishModal.blockedHint}
        closeOverlayAria={copy.publishModal.closeOverlayAria}
      />
    </main>
  );
}
