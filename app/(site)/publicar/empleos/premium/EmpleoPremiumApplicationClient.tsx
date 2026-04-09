"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { EmpleosApplicationTopActions } from "@/app/publicar/empleos/shared/components/EmpleosApplicationTopActions";
import { EmpleosPremiumCtaFieldGroup } from "@/app/publicar/empleos/shared/components/EmpleosPremiumCtaFieldGroup";
import { EMPLEOS_PUBLISH_SHARED_COPY } from "@/app/publicar/empleos/shared/copy/empleosPublishSharedCopy";
import { useEmpleosDraftSession } from "@/app/publicar/empleos/shared/hooks/useEmpleosDraftSession";
import { EmpleosImageGalleryEditor } from "@/app/publicar/empleos/shared/media/EmpleosImageGalleryEditor";
import { EmpleosSingleImageField } from "@/app/publicar/empleos/shared/media/EmpleosSingleImageField";
import { EmpleosPublishConfirmModal } from "@/app/publicar/empleos/shared/publish/EmpleosPublishConfirmModal";
import { gateEmpleosPremiumPreview } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
import { EMPLEOS_SESSION_KEYS } from "@/app/publicar/empleos/shared/constants/empleosSessionKeys";
import { empleosHandoffPreviewUrl } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import { emptyEmpleosPremiumDraft, type EmpleosPremiumDraft } from "@/app/publicar/empleos/shared/types/empleosPremiumDraft";
import { EmpleosFieldLabel, EmpleosSectionCard } from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";
import { EmpleosStringLinesEditor } from "@/app/publicar/empleos/shared/ui/empleosStringLinesEditor";

const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";

export default function EmpleoPremiumApplicationClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const copy = EMPLEOS_PUBLISH_SHARED_COPY[lang];

  const { state, patch, reset, hydrated } = useEmpleosDraftSession<EmpleosPremiumDraft>(
    EMPLEOS_SESSION_KEYS.premium,
    emptyEmpleosPremiumDraft()
  );

  const [publishOpen, setPublishOpen] = useState(false);

  const gate = useMemo(() => gateEmpleosPremiumPreview(state), [state]);
  const previewDisabled = !gate.ok;
  const previewDisabledReason = gate.ok ? null : `${copy.gateFail} ${gate.issues.join(", ")}`;

  const goPreview = useCallback(() => {
    if (previewDisabled) return;
    markPublishFlowOpeningPreview();
    router.push(empleosHandoffPreviewUrl("premium", lang));
  }, [lang, previewDisabled, router]);

  const openPreviewTab = useCallback(() => {
    if (previewDisabled) return;
    markPublishFlowOpeningPreview();
    window.open(empleosHandoffPreviewUrl("premium", lang), "_blank", "noopener,noreferrer");
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

  const premiumCtaLabels =
    lang === "es"
      ? {
          apply: "Etiqueta del botón principal",
          website: "Sitio web",
          whatsapp: "WhatsApp",
          email: "Email",
          primary: "CTA principal *",
        }
      : {
          apply: "Primary button label",
          website: "Website",
          whatsapp: "WhatsApp",
          email: "Email",
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
          logo: "Logo de empresa",
          logoUrl: "URL del logo",
          addLogoUrl: "Usar URL",
          uploadLogo: "Subir logo",
          removeLogo: "Quitar logo",
          altLogo: "Alt",
          video: "Video (solo vista previa local, sin Mux)",
          pickVideo: "Elegir video",
          clearVideo: "Quitar video",
        }
      : {
          urlPh: "https://…",
          addUrl: "Add URL",
          upload: "Upload",
          main: "Main",
          remove: "Remove",
          up: "Up",
          down: "Down",
          logo: "Company logo",
          logoUrl: "Logo URL",
          addLogoUrl: "Use URL",
          uploadLogo: "Upload logo",
          removeLogo: "Remove logo",
          altLogo: "Alt",
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
          <h1 className="text-2xl font-bold sm:text-3xl">{lang === "es" ? "Trabajo premium" : "Premium job"}</h1>
          <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">
            {lang === "es"
              ? "Vacante detallada con galería y secciones estructuradas. Los campos con * son obligatorios para una vista previa completa."
              : "Detailed vacancy with gallery and structured sections. Fields marked * are required for a complete preview."}
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
              <EmpleosFieldLabel required>{lang === "es" ? "Empresa" : "Company"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.companyName} onChange={(e) => patch({ companyName: e.target.value })} />
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
              <EmpleosFieldLabel required>{lang === "es" ? "Salario principal" : "Primary compensation"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.salaryPrimary} onChange={(e) => patch({ salaryPrimary: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel optional>{lang === "es" ? "Salario secundario" : "Secondary compensation"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.salarySecondary} onChange={(e) => patch({ salarySecondary: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel required>{lang === "es" ? "Tipo de empleo" : "Job type"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.jobType} onChange={(e) => patch({ jobType: e.target.value })} />
            </label>
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={state.featured} onChange={(e) => patch({ featured: e.target.checked })} />
                {lang === "es" ? "Destacado" : "Featured"}
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={state.premium} onChange={(e) => patch({ premium: e.target.checked })} />
                {lang === "es" ? "Insignia PREMIUM en el anuncio" : "PREMIUM badge on listing"}
              </label>
            </div>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "2. Multimedia" : "2. Media"}>
            <p className="text-sm text-[color:var(--lx-text-2)]">
              {lang === "es" ? "Galería / hero * — al menos una imagen con URL o archivo." : "Gallery / hero * — at least one image."}
            </p>
            <EmpleosImageGalleryEditor
              images={state.gallery}
              onChange={(gallery) => patch({ gallery })}
              urlPlaceholder={mediaCopy.urlPh}
              addUrlLabel={mediaCopy.addUrl}
              uploadLabel={mediaCopy.upload}
              mainLabel={mediaCopy.main}
              removeLabel={mediaCopy.remove}
              upLabel={mediaCopy.up}
              downLabel={mediaCopy.down}
            />
            <div>
              <p className="text-sm font-semibold">{mediaCopy.logo}</p>
              <EmpleosSingleImageField
                url={state.logoUrl}
                alt={state.companyName || "Logo"}
                onChange={({ url }) => patch({ logoUrl: url })}
                urlPlaceholder={mediaCopy.logoUrl}
                addUrlLabel={mediaCopy.addLogoUrl}
                uploadLabel={mediaCopy.uploadLogo}
                removeLabel={mediaCopy.removeLogo}
                altLabel={mediaCopy.altLogo}
                showAlt={false}
              />
            </div>
            <div>
              <p className="text-sm font-semibold">{mediaCopy.video}</p>
              {state.videoObjectUrl ? (
                <video src={state.videoObjectUrl} controls className="mt-2 max-h-56 w-full rounded-lg border border-black/10 bg-black/5" />
              ) : null}
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

          <EmpleosSectionCard title={lang === "es" ? "3. CTA / Aplicación" : "3. Application CTA"}>
            <EmpleosPremiumCtaFieldGroup
              applyLabel={state.applyLabel}
              websiteUrl={state.websiteUrl}
              whatsapp={state.whatsapp}
              email={state.email}
              primaryCta={state.primaryCta}
              onChange={(p) => patch(p)}
              labels={premiumCtaLabels}
            />
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "4. Contenido del puesto" : "4. Job content"}>
            <label className="block text-sm">
              <EmpleosFieldLabel required>{lang === "es" ? "Descripción del puesto" : "Job description"}</EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[120px]`} value={state.introduction} onChange={(e) => patch({ introduction: e.target.value })} />
            </label>
            <div>
              <p className="text-sm font-semibold">
                {lang === "es" ? "Responsabilidades *" : "Responsibilities *"}
              </p>
              <EmpleosStringLinesEditor
                items={state.responsibilities}
                onChange={(responsibilities) => patch({ responsibilities })}
                addLabel={lang === "es" ? "+ Añadir línea" : "+ Add line"}
                removeLabel={lang === "es" ? "Quitar" : "Remove"}
                placeholder={lang === "es" ? "Responsabilidad" : "Responsibility"}
              />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {lang === "es" ? "Requisitos *" : "Requirements *"}
              </p>
              <EmpleosStringLinesEditor
                items={state.requirements}
                onChange={(requirements) => patch({ requirements })}
                addLabel={lang === "es" ? "+ Añadir línea" : "+ Add line"}
                removeLabel={lang === "es" ? "Quitar" : "Remove"}
                placeholder={lang === "es" ? "Requisito" : "Requirement"}
              />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {lang === "es" ? "Ofrecemos *" : "What we offer *"}
              </p>
              <EmpleosStringLinesEditor
                items={state.offers}
                onChange={(offers) => patch({ offers })}
                addLabel={lang === "es" ? "+ Añadir línea" : "+ Add line"}
                removeLabel={lang === "es" ? "Quitar" : "Remove"}
                placeholder={lang === "es" ? "Beneficio" : "Benefit"}
              />
            </div>
            <label className="block text-sm">
              <EmpleosFieldLabel optional>{lang === "es" ? "Sobre la empresa" : "About the company"}</EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[88px]`} value={state.companyOverview} onChange={(e) => patch({ companyOverview: e.target.value })} />
            </label>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "5. Credibilidad del empleador" : "5. Employer credibility"}>
            <label className="block text-sm">
              <EmpleosFieldLabel optional>{lang === "es" ? "Dirección" : "Address"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.employerAddress} onChange={(e) => patch({ employerAddress: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel optional>{lang === "es" ? "Calificación (0–5)" : "Rating (0–5)"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.employerRating} onChange={(e) => patch({ employerRating: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel optional>{lang === "es" ? "Número de reseñas" : "Review count"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.reviewCount} onChange={(e) => patch({ reviewCount: e.target.value })} />
            </label>
          </EmpleosSectionCard>
        </div>

        <div className="mt-10 rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 sm:p-5">
          <p className="text-sm text-[color:var(--lx-text-2)]">
            {lang === "es"
              ? "Confirmación final (sin pago todavía)."
              : "Final confirmation (no payment yet)."}
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
