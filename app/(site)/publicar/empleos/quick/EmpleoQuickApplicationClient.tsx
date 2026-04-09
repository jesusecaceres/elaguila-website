"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { EmpleosApplicationTopActions } from "@/app/publicar/empleos/shared/components/EmpleosApplicationTopActions";
import { EmpleosCtaFieldGroup } from "@/app/publicar/empleos/shared/components/EmpleosCtaFieldGroup";
import { EMPLEOS_PUBLISH_SHARED_COPY } from "@/app/publicar/empleos/shared/copy/empleosPublishSharedCopy";
import { useEmpleosDraftSession } from "@/app/publicar/empleos/shared/hooks/useEmpleosDraftSession";
import { EmpleosImageGalleryEditor } from "@/app/publicar/empleos/shared/media/EmpleosImageGalleryEditor";
import { EmpleosSingleImageField } from "@/app/publicar/empleos/shared/media/EmpleosSingleImageField";
import { EmpleosPublishConfirmModal } from "@/app/publicar/empleos/shared/publish/EmpleosPublishConfirmModal";
import { gateEmpleosQuickPreview } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
import { EMPLEOS_SESSION_KEYS } from "@/app/publicar/empleos/shared/constants/empleosSessionKeys";
import { empleosHandoffPreviewUrl } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import { emptyEmpleosQuickDraft, type EmpleosQuickDraft } from "@/app/publicar/empleos/shared/types/empleosQuickDraft";
import { EmpleosFieldLabel, EmpleosSectionCard } from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";

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

  const gate = useMemo(() => gateEmpleosQuickPreview(state), [state]);
  const previewDisabled = !gate.ok;
  const previewDisabledReason = gate.ok ? null : `${copy.gateFail} ${gate.issues.join(", ")}`;

  const goPreview = useCallback(() => {
    if (previewDisabled) return;
    markPublishFlowOpeningPreview();
    router.push(empleosHandoffPreviewUrl("quick", lang));
  }, [lang, previewDisabled, router]);

  const openPreviewTab = useCallback(() => {
    if (previewDisabled) return;
    markPublishFlowOpeningPreview();
    window.open(empleosHandoffPreviewUrl("quick", lang), "_blank", "noopener,noreferrer");
  }, [lang, previewDisabled]);

  const revokeIfBlob = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  const onVideoFile = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      patch((prev) => {
        revokeIfBlob(prev.videoObjectUrl);
        return { ...prev, videoObjectUrl: URL.createObjectURL(file), videoFileName: file.name };
      });
    },
    [patch, revokeIfBlob]
  );

  const clearVideo = useCallback(() => {
    patch((prev) => {
      revokeIfBlob(prev.videoObjectUrl);
      return { ...prev, videoObjectUrl: null, videoFileName: "" };
    });
  }, [patch, revokeIfBlob]);

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
          video: "Video (solo vista previa local, sin Mux)",
          pickVideo: "Elegir video",
          clearVideo: "Quitar video",
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
          video: "Video (local preview only, no Mux)",
          pickVideo: "Choose video",
          clearVideo: "Remove video",
        };

  if (!hydrated) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  return (
    <main className="min-h-screen bg-[color:var(--lx-page)] px-4 pb-24 pt-24 text-[color:var(--lx-text)]">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">{lang === "es" ? "Trabajo rápido" : "Quick job"}</h1>
          <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">
            {lang === "es"
              ? "Completa los campos obligatorios (*) y abre la vista previa para ver el anuncio final."
              : "Complete required fields (*) and open preview to see the final listing."}
          </p>
        </header>

        <EmpleosApplicationTopActions
          copy={copy.topActions}
          onVistaPrevia={goPreview}
          onAbrirVistaPrevia={openPreviewTab}
          onDelete={reset}
          previewDisabled={previewDisabled}
          previewDisabledReason={previewDisabledReason}
        />

        <div className="space-y-6">
          <EmpleosSectionCard title={lang === "es" ? "1. Información principal" : "1. Main details"}>
            <label className="block text-sm">
              <EmpleosFieldLabel required>{lang === "es" ? "Título del puesto" : "Job title"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.title} onChange={(e) => patch({ title: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel required>{lang === "es" ? "Nombre del negocio" : "Business name"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.businessName} onChange={(e) => patch({ businessName: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel required>{lang === "es" ? "Ciudad" : "City"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.city} onChange={(e) => patch({ city: e.target.value })} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel required>{lang === "es" ? "Estado" : "State"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.state} onChange={(e) => patch({ state: e.target.value })} />
              </label>
            </div>
            <label className="block text-sm">
              <EmpleosFieldLabel required>{lang === "es" ? "Tipo de empleo" : "Job type"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.jobType} onChange={(e) => patch({ jobType: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel required>{lang === "es" ? "Horario" : "Schedule"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.schedule} onChange={(e) => patch({ schedule: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel required>{lang === "es" ? "Pago" : "Pay"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.pay} onChange={(e) => patch({ pay: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel required>{lang === "es" ? "Descripción corta" : "Short description"}</EmpleosFieldLabel>
              <textarea
                className={`${INPUT} min-h-[100px]`}
                value={state.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </label>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "2. Beneficios (opcional)" : "2. Benefits (optional)"}>
            <label className="block text-sm">
              <EmpleosFieldLabel optional>{lang === "es" ? "Un beneficio por línea" : "One benefit per line"}</EmpleosFieldLabel>
              <textarea
                className={`${INPUT} min-h-[88px]`}
                value={state.benefitsText}
                onChange={(e) => patch({ benefitsText: e.target.value })}
              />
            </label>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "3. Multimedia" : "3. Media"}>
            <div>
              <div className="text-sm font-semibold text-[color:var(--lx-text)]">
                <EmpleosFieldLabel required>{lang === "es" ? "Imágenes" : "Images"}</EmpleosFieldLabel>
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

            <div>
              <p className="text-sm font-semibold">{mediaCopy.video}</p>
              {state.videoObjectUrl ? (
                <video src={state.videoObjectUrl} controls className="mt-2 max-h-56 w-full rounded-lg border border-black/10 bg-black/5" />
              ) : null}
              {state.videoFileName ? <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{state.videoFileName}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <input type="file" accept="video/*" className="text-sm" onChange={(e) => void onVideoFile(e.target.files)} />
                {state.videoObjectUrl ? (
                  <button type="button" className="text-sm font-semibold text-red-800 underline" onClick={clearVideo}>
                    {mediaCopy.clearVideo}
                  </button>
                ) : null}
              </div>
            </div>
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
              <EmpleosFieldLabel optional>{lang === "es" ? "Dirección línea 1" : "Address line 1"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.addressLine1} onChange={(e) => patch({ addressLine1: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <EmpleosFieldLabel optional>{lang === "es" ? "Ciudad (detalle)" : "City (detail)"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.addressCity} onChange={(e) => patch({ addressCity: e.target.value })} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel optional>{lang === "es" ? "Estado (detalle)" : "State (detail)"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.addressState} onChange={(e) => patch({ addressState: e.target.value })} />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel optional>{lang === "es" ? "CP" : "ZIP"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.addressZip} onChange={(e) => patch({ addressZip: e.target.value })} />
              </label>
            </div>
          </EmpleosSectionCard>
        </div>

        <div className="mt-10 rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 sm:p-5">
          <p className="text-sm text-[color:var(--lx-text-2)]">
            {lang === "es"
              ? "Cuando estés listo, abre la confirmación final (sin pago todavía)."
              : "When ready, open the final confirmation (no payment yet)."}
          </p>
          <button
            type="button"
            className="mt-3 inline-flex min-h-[48px] items-center justify-center rounded-[12px] bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7]"
            onClick={() => setPublishOpen(true)}
          >
            {lang === "es" ? "Revisión final antes de publicar" : "Final review before publish"}
          </button>
        </div>
      </div>

      <EmpleosPublishConfirmModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onConfirm={() => {
          /* publish API in a later phase */
        }}
        title={copy.publishModal.title}
        intro={copy.publishModal.intro}
        checks={copy.publishModal.checks}
        confirmCta={copy.publishModal.confirmCta}
        cancelCta={copy.publishModal.cancelCta}
        blockedHint={copy.publishModal.blockedHint}
      />
    </main>
  );
}
