"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { EmpleosApplicationFinalStep } from "@/app/publicar/empleos/shared/components/EmpleosApplicationFinalStep";
import { EmpleosReadinessBanner } from "@/app/publicar/empleos/shared/components/EmpleosReadinessBanner";
import { EmpleosPremiumCtaFieldGroup } from "@/app/publicar/empleos/shared/components/EmpleosPremiumCtaFieldGroup";
import { EMPLEOS_PUBLISH_SHARED_COPY } from "@/app/publicar/empleos/shared/copy/empleosPublishSharedCopy";
import { useEmpleosDraftSession } from "@/app/publicar/empleos/shared/hooks/useEmpleosDraftSession";
import { EmpleosImageGalleryEditor } from "@/app/publicar/empleos/shared/media/EmpleosImageGalleryEditor";
import { EmpleosSingleImageField } from "@/app/publicar/empleos/shared/media/EmpleosSingleImageField";
import { EmpleosVideoDraftField } from "@/app/publicar/empleos/shared/media/EmpleosVideoDraftField";
import { buildEmpleosPublishEnvelopeFromPremium } from "@/app/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";
import { EmpleosPublishConfirmModal } from "@/app/publicar/empleos/shared/publish/EmpleosPublishConfirmModal";
import { clearEmpleosStagedPublish } from "@/app/publicar/empleos/shared/publish/empleosPublishStaging";
import { replaceRouteForEmpleosResumeEdit } from "@/app/publicar/empleos/shared/lib/empleosEditLaneRedirect";
import { hydratePremiumDraftFromEnvelope } from "@/app/publicar/empleos/shared/lib/empleosDraftFromEnvelope";
import { flushEmpleosDraftToSession } from "@/app/publicar/empleos/shared/lib/flushEmpleosDraftToSession";
import { gateEmpleosPremiumPreview } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
import { EMPLEOS_STANDARD_CITY } from "@/app/publicar/empleos/shared/constants/empleosStandardRegion";
import { EMPLEOS_SESSION_KEYS } from "@/app/publicar/empleos/shared/constants/empleosSessionKeys";
import { empleosHandoffPreviewUrl } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import { emptyEmpleosPremiumDraft, type EmpleosPremiumDraft } from "@/app/publicar/empleos/shared/types/empleosPremiumDraft";
import { EmpleosFieldLabel, EmpleosSectionCard } from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";
import { EmpleosStringLinesEditor } from "@/app/publicar/empleos/shared/ui/empleosStringLinesEditor";
import {
  sampleCategorySelectOptions,
  sampleExperienceOptions,
  sampleModalityOptions,
} from "@/app/clasificados/empleos/data/empleosLandingSampleData";

const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";
const INPUT_CITY_LOCKED = `${INPUT} cursor-not-allowed bg-black/[0.04]`;

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
      if (!json.ok || !json.envelope) return;
      if (replaceRouteForEmpleosResumeEdit(router, { editId, lang, expected: "premium", actual: json.lane })) {
        loadedEditRef.current = null;
        return;
      }
      const next = hydratePremiumDraftFromEnvelope(json.envelope);
      if (next) {
        patch(() => next);
        setServerListingId(editId);
      }
    })();
  }, [hydrated, sp, patch, router, lang]);

  const gate = useMemo(() => gateEmpleosPremiumPreview(state, lang), [state, lang]);
  const previewDisabled = !gate.ok;
  const previewIssues = gate.ok ? [] : gate.issues;

  const goPreview = useCallback(() => {
    if (previewDisabled) return;
    flushEmpleosDraftToSession(EMPLEOS_SESSION_KEYS.premium, state);
    markPublishFlowOpeningPreview();
    router.push(empleosHandoffPreviewUrl("premium", lang));
  }, [lang, previewDisabled, router, state]);

  const handleDeleteApplication = useCallback(() => {
    reset();
    setStagedNotice(false);
    clearEmpleosStagedPublish();
  }, [reset]);

  const revokeIfBlob = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  const premiumCtaLabels =
    lang === "es"
      ? {
          apply: "Texto del botón principal",
          website: "Página para postular (URL)",
          phone: "Teléfono de reclutamiento",
          whatsapp: "WhatsApp",
          email: "Correo de reclutamiento",
          primary: "Acción principal preferida *",
          primaryHint:
            "Elige la acción que verán primero los candidatos. Si añades otros datos, seguirán visibles como opciones secundarias.",
        }
      : {
          apply: "Primary button text",
          website: "Apply page (URL)",
          phone: "Recruiting phone",
          whatsapp: "WhatsApp",
          email: "Recruiting email",
          primary: "Preferred primary action *",
          primaryHint:
            "Pick what candidates see first. If you add other contact methods, they remain visible as secondary options.",
        };

  const applyPlaceholder = lang === "es" ? "Ej. Postularse ahora" : "e.g. Apply now";

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
          altImage: "Texto alternativo (imagen)",
          videoSection: "Video de empresa o lugar de trabajo (opcional)",
          videoHint: "Solo si quieres compartir un video público. Archivo local o URL; en borrador no se sube a Mux.",
          videoUrlField: "URL del video",
          videoUrlPh: "https://…",
          videoApplyUrl: "Usar URL",
          videoPickFile: "Elegir archivo de video",
          videoClear: "Quitar video",
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
          altImage: "Image alt text",
          videoSection: "Video (optional)",
          videoHint: "Local file or URL. No Mux upload in draft.",
          videoUrlField: "Video URL",
          videoUrlPh: "https://…",
          videoApplyUrl: "Apply URL",
          videoPickFile: "Choose video file",
          videoClear: "Remove video",
        };

  if (!hydrated) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] px-4 pb-24 pt-24 text-[color:var(--lx-text)] sm:px-5">
      <div className="mx-auto min-w-0 max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">{lang === "es" ? "Trabajo premium" : "Premium job"}</h1>
          <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{copy.applicationPage.premiumSubtitle}</p>
        </header>

        <EmpleosReadinessBanner visible={!gate.ok} intro={copy.gateFail} issues={previewIssues} />

        <div className="space-y-6">
          <EmpleosSectionCard title={lang === "es" ? "1. Información principal" : "1. Main details"}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Título del puesto" : "Job title"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.title} onChange={(e) => patch({ title: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Empresa" : "Company"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.companyName} onChange={(e) => patch({ companyName: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Ciudad" : "City"}</EmpleosFieldLabel>
                <input
                  readOnly
                  className={INPUT_CITY_LOCKED}
                  value={EMPLEOS_STANDARD_CITY}
                  aria-readonly="true"
                  title={lang === "es" ? "Región estandarizada" : "Standardized region"}
                />
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Estado" : "State"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.state} onChange={(e) => patch({ state: e.target.value })} />
              </label>
            </div>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Salario principal" : "Primary compensation"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.salaryPrimary} onChange={(e) => patch({ salaryPrimary: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Salario secundario" : "Secondary compensation"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.salarySecondary} onChange={(e) => patch({ salarySecondary: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Tipo de empleo" : "Job type"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.jobType} onChange={(e) => patch({ jobType: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Categoría" : "Category"}</EmpleosFieldLabel>
                <select className={INPUT} value={state.categorySlug} onChange={(e) => patch({ categorySlug: e.target.value })}>
                  {sampleCategorySelectOptions
                    .filter((o) => o.value)
                    .map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang}>{lang === "es" ? "Experiencia" : "Experience"}</EmpleosFieldLabel>
                <select
                  className={INPUT}
                  value={state.experienceLevel}
                  onChange={(e) => patch({ experienceLevel: e.target.value as EmpleosPremiumDraft["experienceLevel"] })}
                >
                  {sampleExperienceOptions
                    .filter((o) => o.value)
                    .map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Modalidad de trabajo" : "Work modality"}</EmpleosFieldLabel>
                <select
                  className={INPUT}
                  value={state.workModality}
                  onChange={(e) => patch({ workModality: e.target.value as EmpleosPremiumDraft["workModality"] })}
                >
                  {sampleModalityOptions
                    .filter((o) => o.value)
                    .map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-sm">
                <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Horario / turno" : "Schedule / shift"}</EmpleosFieldLabel>
                <input className={INPUT} value={state.scheduleLabel} onChange={(e) => patch({ scheduleLabel: e.target.value })} />
              </label>
            </div>
            {state.categorySlug === "otro" ? (
              <label className="mt-3 block text-sm">
                <EmpleosFieldLabel lang={lang} required>
                  {lang === "es" ? "Describe la categoría" : "Describe the category"}
                </EmpleosFieldLabel>
                <input
                  className={INPUT}
                  value={state.categoryCustom}
                  onChange={(e) => patch({ categoryCustom: e.target.value })}
                  placeholder={lang === "es" ? "Ej. Manufactura ligera" : "e.g. Light manufacturing"}
                />
              </label>
            ) : null}
            <div>
              <p className="text-sm font-semibold text-[color:var(--lx-text)]">
                {lang === "es" ? "Preguntas filtro (máx. 5)" : "Screener questions (max 5)"}
              </p>
              <EmpleosStringLinesEditor
                items={state.screenerQuestions.length ? state.screenerQuestions : [""]}
                onChange={(screenerQuestions) => patch({ screenerQuestions: screenerQuestions.slice(0, 5) })}
                addLabel={lang === "es" ? "+ Pregunta" : "+ Question"}
                removeLabel={lang === "es" ? "Quitar" : "Remove"}
                placeholder=""
              />
            </div>
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
              altPlaceholder={mediaCopy.altImage}
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

          <EmpleosSectionCard title={lang === "es" ? "3. Contacto y postulación" : "3. Contact & apply"}>
            <EmpleosPremiumCtaFieldGroup
              applyLabel={state.applyLabel}
              websiteUrl={state.websiteUrl}
              phone={state.phone}
              whatsapp={state.whatsapp}
              email={state.email}
              primaryCta={state.primaryCta}
              onChange={(p) => patch(p)}
              labels={premiumCtaLabels}
              applyPlaceholder={applyPlaceholder}
            />
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "4. Contenido del puesto" : "4. Job content"}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Descripción del puesto" : "Job description"}</EmpleosFieldLabel>
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
              <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Sobre la empresa" : "About the company"}</EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[88px]`} value={state.companyOverview} onChange={(e) => patch({ companyOverview: e.target.value })} />
            </label>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "5. Ubicación del empleador" : "5. Employer location"}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>
                {lang === "es" ? "Dirección o ciudad de la empresa" : "Company address or city"}
              </EmpleosFieldLabel>
              <input className={INPUT} value={state.employerAddress} onChange={(e) => patch({ employerAddress: e.target.value })} />
            </label>
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
          saveDraftCta={copy.finalStep.saveDraftCta ?? null}
          onSaveDraft={() => {
            void (async () => {
              const g = gateEmpleosPremiumPreview(state, lang);
              if (!g.ok) return;
              const sb = createSupabaseBrowserClient();
              const { data } = await sb.auth.getSession();
              if (!data.session?.access_token) {
                window.alert(lang === "es" ? "Inicia sesión para guardar el borrador." : "Sign in to save a draft.");
                return;
              }
              const base = buildEmpleosPublishEnvelopeFromPremium(state, lang);
              const envelope = serverListingId ? { ...base, listingId: serverListingId } : base;
              const res = await fetch("/api/clasificados/empleos/listings", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${data.session.access_token}`,
                },
                body: JSON.stringify({ envelope, mode: "draft" }),
              });
              const json = (await res.json()) as { ok?: boolean; error?: string; id?: string };
              if (!json.ok) {
                window.alert(json.error ?? (lang === "es" ? "No se pudo guardar" : "Could not save"));
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
            const g = gateEmpleosPremiumPreview(state, lang);
            if (!g.ok) return;
            const sb = createSupabaseBrowserClient();
            const { data } = await sb.auth.getSession();
            if (!data.session?.access_token) {
              window.alert(lang === "es" ? "Inicia sesión para publicar." : "Sign in to publish.");
              return;
            }
            const base = buildEmpleosPublishEnvelopeFromPremium(state, lang);
            const envelope = serverListingId ? { ...base, listingId: serverListingId } : base;
            const res = await fetch("/api/clasificados/empleos/listings", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${data.session.access_token}`,
              },
              body: JSON.stringify({ envelope, mode: "publish" }),
            });
            const json = (await res.json()) as { ok?: boolean; error?: string; id?: string; slug?: string };
            if (!json.ok || !json.slug) {
              window.alert(json.error ?? (lang === "es" ? "No se pudo publicar" : "Could not publish"));
              return;
            }
            if (json.id) setServerListingId(json.id);
            clearEmpleosStagedPublish();
            setPublishOpen(false);
            setStagedNotice(true);
            router.push(appendLangToPath(`/clasificados/empleos/${json.slug}`, lang));
            router.refresh();
          })();
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
