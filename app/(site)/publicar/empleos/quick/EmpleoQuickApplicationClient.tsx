"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { EmpleosApplicationFinalStep } from "@/app/publicar/empleos/shared/components/EmpleosApplicationFinalStep";
import { EmpleosReadinessBanner } from "@/app/publicar/empleos/shared/components/EmpleosReadinessBanner";
import { EmpleosCtaFieldGroup } from "@/app/publicar/empleos/shared/components/EmpleosCtaFieldGroup";
import { EMPLEOS_PUBLISH_SHARED_COPY } from "@/app/publicar/empleos/shared/copy/empleosPublishSharedCopy";
import { useEmpleosDraftSession } from "@/app/publicar/empleos/shared/hooks/useEmpleosDraftSession";
import { EmpleosImageGalleryEditor } from "@/app/publicar/empleos/shared/media/EmpleosImageGalleryEditor";
import { EmpleosSingleImageField } from "@/app/publicar/empleos/shared/media/EmpleosSingleImageField";
import { EmpleosVideoDraftField } from "@/app/publicar/empleos/shared/media/EmpleosVideoDraftField";
import { buildEmpleosPublishEnvelopeFromQuick } from "@/app/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";
import { EmpleosPublishConfirmModal } from "@/app/publicar/empleos/shared/publish/EmpleosPublishConfirmModal";
import { clearEmpleosStagedPublish } from "@/app/publicar/empleos/shared/publish/empleosPublishStaging";
import { replaceRouteForEmpleosResumeEdit } from "@/app/publicar/empleos/shared/lib/empleosEditLaneRedirect";
import { hydrateQuickDraftFromEnvelope } from "@/app/publicar/empleos/shared/lib/empleosDraftFromEnvelope";
import { flushEmpleosDraftToSession } from "@/app/publicar/empleos/shared/lib/flushEmpleosDraftToSession";
import { gateEmpleosQuickPreview } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
import { EMPLEOS_STANDARD_CITY } from "@/app/publicar/empleos/shared/constants/empleosStandardRegion";
import { EMPLEOS_SESSION_KEYS } from "@/app/publicar/empleos/shared/constants/empleosSessionKeys";
import { empleosHandoffPreviewUrl } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import { emptyEmpleosQuickDraft, type EmpleosQuickDraft } from "@/app/publicar/empleos/shared/types/empleosQuickDraft";
import { EmpleosFieldLabel, EmpleosSectionCard } from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";
import { EmpleosStringLinesEditor } from "@/app/publicar/empleos/shared/ui/empleosStringLinesEditor";
import {
  sampleCategorySelectOptions,
  sampleExperienceOptions,
  sampleModalityOptions,
} from "@/app/clasificados/empleos/data/empleosLandingSampleData";
import type { JobModalitySlug } from "@/app/clasificados/empleos/data/empleosJobTypes";

const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";
const INPUT_CITY_LOCKED = `${INPUT} cursor-not-allowed bg-black/[0.04]`;

function joinScheduleRows(rows: EmpleosQuickDraft["scheduleRows"]): string {
  return rows
    .filter((r) => r.day.trim() || r.shift.trim())
    .map((r) => {
      const day = r.day.trim();
      const shift = r.shift.trim();
      if (day && shift) return `${day}: ${shift}`;
      return day || shift;
    })
    .join("\n");
}

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

  const labelsCta =
    lang === "es"
      ? {
          phone: "Teléfono de reclutamiento",
          whatsapp: "WhatsApp",
          email: "Correo de reclutamiento",
          website: "Sitio web (opcional)",
          primary: "Acción principal preferida *",
        }
      : {
          phone: "Recruiting phone",
          whatsapp: "WhatsApp",
          email: "Recruiting email",
          website: "Website (optional)",
          primary: "Preferred primary action *",
        };

  const ctaPrimaryHint =
    lang === "es"
      ? "La acción principal es la que destacamos primero; el resto de datos que completes seguirá visible para los candidatos."
      : "We highlight one primary action first; any other contact details you add stay visible to candidates.";

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
          videoSection: "Video de empresa o lugar (opcional)",
          videoHint: "Solo si quieres enlazar un video público. Archivo local o URL; en borrador no se sube a Mux.",
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
                <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Categoría (resultados)" : "Category (search)"}</EmpleosFieldLabel>
                <select
                  className={INPUT}
                  value={state.categorySlug}
                  onChange={(e) => patch({ categorySlug: e.target.value })}
                >
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
                <EmpleosFieldLabel lang={lang}>{lang === "es" ? "Nivel de experiencia" : "Experience level"}</EmpleosFieldLabel>
                <select
                  className={INPUT}
                  value={state.experienceLevel}
                  onChange={(e) => patch({ experienceLevel: e.target.value as EmpleosQuickDraft["experienceLevel"] })}
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
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Tipo de empleo" : "Job type"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.jobType} onChange={(e) => patch({ jobType: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Modalidad" : "Modality"}</EmpleosFieldLabel>
              <select
                className={INPUT}
                value={state.workModality}
                onChange={(e) => patch({ workModality: e.target.value as JobModalitySlug })}
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
            <div className="block text-sm sm:col-span-2">
              <EmpleosFieldLabel lang={lang} required>
                {lang === "es" ? "Horario / turnos" : "Schedule / shifts"}
              </EmpleosFieldLabel>
              <p className="mt-0.5 text-xs text-[color:var(--lx-muted)]">
                {lang === "es"
                  ? "Añade filas (día o bloque + horario). La imagen principal del carrusel será el hero del anuncio."
                  : "Add rows (day or block + hours). The primary gallery image becomes the listing hero."}
              </p>
              <div className="mt-2 space-y-2">
                {state.scheduleRows.map((row, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-2">
                    <input
                      className={INPUT}
                      value={row.day}
                      placeholder={lang === "es" ? "Día o bloque (ej. Lun–Vie)" : "Day or block (e.g. Mon–Fri)"}
                      onChange={(e) => {
                        const next = state.scheduleRows.map((r, j) => (j === idx ? { ...r, day: e.target.value } : r));
                        patch({ scheduleRows: next, schedule: joinScheduleRows(next) });
                      }}
                    />
                    <input
                      className={INPUT}
                      value={row.shift}
                      placeholder={lang === "es" ? "Turno / horas" : "Shift / hours"}
                      onChange={(e) => {
                        const next = state.scheduleRows.map((r, j) => (j === idx ? { ...r, shift: e.target.value } : r));
                        patch({ scheduleRows: next, schedule: joinScheduleRows(next) });
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-[#2563EB] underline"
                onClick={() => {
                  const next = [...state.scheduleRows, { day: "", shift: "" }];
                  patch({ scheduleRows: next, schedule: joinScheduleRows(next) });
                }}
              >
                {lang === "es" ? "+ Añadir turno" : "+ Add shift row"}
              </button>
            </div>
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

          <EmpleosSectionCard title={lang === "es" ? "2. Preguntas filtro (opcional, máx. 5)" : "2. Screener questions (optional, max 5)"}>
            <p className="text-xs text-[color:var(--lx-muted)]">
              {lang === "es"
                ? "Aparecen en el formulario de aplicación interna de Leonix."
                : "Shown on Leonix’s internal apply form."}
            </p>
            <EmpleosStringLinesEditor
              items={state.screenerQuestions.length ? state.screenerQuestions : [""]}
              onChange={(screenerQuestions) => patch({ screenerQuestions: screenerQuestions.slice(0, 5) })}
              addLabel={lang === "es" ? "+ Pregunta" : "+ Question"}
              removeLabel={lang === "es" ? "Quitar" : "Remove"}
              placeholder={lang === "es" ? "Ej. ¿Disponibilidad inmediata?" : "e.g. Immediate availability?"}
            />
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "3. Beneficios (opcional)" : "3. Benefits (optional)"}>
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

          <EmpleosSectionCard title={lang === "es" ? "4. Multimedia" : "4. Media"}>
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

          <EmpleosSectionCard title={lang === "es" ? "5. Contacto / CTA" : "5. Contact / CTA"}>
            <EmpleosCtaFieldGroup
              phone={state.phone}
              whatsapp={state.whatsapp}
              email={state.email}
              website={state.website}
              primaryCta={state.primaryCta}
              onChange={(p) => patch(p)}
              labels={labelsCta}
              primaryHint={ctaPrimaryHint}
            />
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "6. Ubicación (opcional)" : "6. Location (optional)"}>
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
          saveDraftCta={copy.finalStep.saveDraftCta ?? null}
          onSaveDraft={() => {
            void (async () => {
              const g = gateEmpleosQuickPreview(state, lang);
              if (!g.ok) return;
              const sb = createSupabaseBrowserClient();
              const { data } = await sb.auth.getSession();
              if (!data.session?.access_token) {
                window.alert(lang === "es" ? "Inicia sesión para guardar el borrador." : "Sign in to save a draft.");
                return;
              }
              const base = buildEmpleosPublishEnvelopeFromQuick(state, lang);
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
            const g = gateEmpleosQuickPreview(state, lang);
            if (!g.ok) return;
            const sb = createSupabaseBrowserClient();
            const { data } = await sb.auth.getSession();
            if (!data.session?.access_token) {
              window.alert(lang === "es" ? "Inicia sesión para publicar." : "Sign in to publish.");
              return;
            }
            const base = buildEmpleosPublishEnvelopeFromQuick(state, lang);
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
