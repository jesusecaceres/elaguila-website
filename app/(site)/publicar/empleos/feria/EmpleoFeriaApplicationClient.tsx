"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { JobFairModality } from "@/app/clasificados/empleos/data/empleoJobFairSampleData";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { EmpleosApplicationFinalStep } from "@/app/publicar/empleos/shared/components/EmpleosApplicationFinalStep";
import { EmpleosReadinessBanner } from "@/app/publicar/empleos/shared/components/EmpleosReadinessBanner";
import { EMPLEOS_PUBLISH_SHARED_COPY } from "@/app/publicar/empleos/shared/copy/empleosPublishSharedCopy";
import { useEmpleosDraftSession } from "@/app/publicar/empleos/shared/hooks/useEmpleosDraftSession";
import { EmpleosSingleImageField } from "@/app/publicar/empleos/shared/media/EmpleosSingleImageField";
import { buildEmpleosPublishEnvelopeFromFeria } from "@/app/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import { EmpleosPublishConfirmModal } from "@/app/publicar/empleos/shared/publish/EmpleosPublishConfirmModal";
import { clearEmpleosStagedPublish, writeEmpleosStagedPublish } from "@/app/publicar/empleos/shared/publish/empleosPublishStaging";
import { flushEmpleosDraftToSession } from "@/app/publicar/empleos/shared/lib/flushEmpleosDraftToSession";
import { gateEmpleosFeriaPreview } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
import { EMPLEOS_SESSION_KEYS } from "@/app/publicar/empleos/shared/constants/empleosSessionKeys";
import { empleosHandoffPreviewUrl } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import { emptyEmpleosFeriaDraft, type EmpleosFeriaDraft } from "@/app/publicar/empleos/shared/types/empleosFeriaDraft";
import { EmpleosFieldLabel, EmpleosSectionCard } from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";
import { EmpleosStringLinesEditor } from "@/app/publicar/empleos/shared/ui/empleosStringLinesEditor";

const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";

const MODALITIES: { value: JobFairModality; es: string; en: string }[] = [
  { value: "presencial", es: "Presencial", en: "In person" },
  { value: "virtual", es: "Virtual", en: "Virtual" },
  { value: "híbrida", es: "Híbrida", en: "Hybrid" },
];

export default function EmpleoFeriaApplicationClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const copy = EMPLEOS_PUBLISH_SHARED_COPY[lang];

  const { state, patch, reset, hydrated } = useEmpleosDraftSession<EmpleosFeriaDraft>(
    EMPLEOS_SESSION_KEYS.feria,
    emptyEmpleosFeriaDraft()
  );

  const [publishOpen, setPublishOpen] = useState(false);
  const [stagedNotice, setStagedNotice] = useState(false);

  const gate = useMemo(() => gateEmpleosFeriaPreview(state, lang), [state, lang]);
  const previewDisabled = !gate.ok;
  const previewIssues = gate.ok ? [] : gate.issues;

  const goPreview = useCallback(() => {
    if (previewDisabled) return;
    flushEmpleosDraftToSession(EMPLEOS_SESSION_KEYS.feria, state);
    markPublishFlowOpeningPreview();
    router.push(empleosHandoffPreviewUrl("feria", lang));
  }, [lang, previewDisabled, router, state]);

  const handleDeleteApplication = useCallback(() => {
    reset();
    setStagedNotice(false);
    clearEmpleosStagedPublish();
  }, [reset]);

  const flyerCopy =
    lang === "es"
      ? {
          urlPh: "https://…",
          addUrl: "Añadir URL",
          upload: "Subir flyer",
          remove: "Quitar",
          alt: "Descripción / alt del flyer",
        }
      : {
          urlPh: "https://…",
          addUrl: "Add URL",
          upload: "Upload flyer",
          remove: "Remove",
          alt: "Flyer alt text",
        };

  if (!hydrated) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] px-4 pb-24 pt-24 text-[color:var(--lx-text)] sm:px-5">
      <div className="mx-auto min-w-0 max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">{lang === "es" ? "Feria de empleo" : "Job fair"}</h1>
          <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{copy.applicationPage.feriaSubtitle}</p>
        </header>

        <EmpleosReadinessBanner visible={!gate.ok} intro={copy.gateFail} issues={previewIssues} />

        <div className="space-y-6">
          <EmpleosSectionCard title={lang === "es" ? "1. Información principal" : "1. Main details"}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Título" : "Title"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.title} onChange={(e) => patch({ title: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Fecha" : "Date"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.dateLine} onChange={(e) => patch({ dateLine: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Hora" : "Time"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.timeLine} onChange={(e) => patch({ timeLine: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Sede / venue" : "Venue"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.venue} onChange={(e) => patch({ venue: e.target.value })} />
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
              <EmpleosFieldLabel lang={lang} required>{lang === "es" ? "Organizador" : "Organizer"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.organizer} onChange={(e) => patch({ organizer: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Sitio del organizador" : "Organizer website"}</EmpleosFieldLabel>
              <input className={INPUT} type="url" value={state.organizerUrl} onChange={(e) => patch({ organizerUrl: e.target.value })} />
            </label>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "2. Flyer / imagen" : "2. Flyer image"}>
            <p className="text-sm text-[color:var(--lx-text-2)]">
              {lang === "es" ? "Imagen del flyer * (URL o archivo)." : "Flyer image * (URL or file)."}
            </p>
            <EmpleosSingleImageField
              url={state.flyerImageUrl}
              alt={state.flyerAlt}
              onChange={({ url, alt }) => patch({ flyerImageUrl: url, flyerAlt: alt })}
              urlPlaceholder={flyerCopy.urlPh}
              addUrlLabel={flyerCopy.addUrl}
              uploadLabel={flyerCopy.upload}
              removeLabel={flyerCopy.remove}
              altLabel={flyerCopy.alt}
              showAlt
            />
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "3. Detalles (filtros)" : "3. Details (filters)"}>
            <label className="block text-sm">
              <span className="font-semibold">{lang === "es" ? "Modalidad" : "Modality"}</span>
              <select
                className={INPUT}
                value={state.modality}
                onChange={(e) => patch({ modality: e.target.value as JobFairModality })}
              >
                {MODALITIES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {lang === "es" ? m.es : m.en}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={state.freeEntry} onChange={(e) => patch({ freeEntry: e.target.checked })} />
                {lang === "es" ? "Entrada gratuita" : "Free entry"}
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={state.bilingual} onChange={(e) => patch({ bilingual: e.target.checked })} />
                {lang === "es" ? "Bilingüe" : "Bilingual"}
              </label>
            </div>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Enfoque de industria" : "Industry focus"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.industryFocus} onChange={(e) => patch({ industryFocus: e.target.value })} />
            </label>
            <p className="text-xs text-[color:var(--lx-muted)]">{lang === "es" ? "Tipo de evento: feria de empleo (fijo en el anuncio)." : "Event type: job fair (fixed)."}</p>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "4. Contacto / CTA" : "4. Contact / CTA"}>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Texto introductorio (banda CTA)" : "CTA intro copy"}</EmpleosFieldLabel>
              <textarea className={`${INPUT} min-h-[80px]`} value={state.ctaIntro} onChange={(e) => patch({ ctaIntro: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Enlace de registro / más info" : "Registration / info link"}</EmpleosFieldLabel>
              <input className={INPUT} type="url" value={state.contactLink} onChange={(e) => patch({ contactLink: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Teléfono" : "Phone"}</EmpleosFieldLabel>
              <input className={INPUT} type="tel" value={state.contactPhone} onChange={(e) => patch({ contactPhone: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Email" : "Email"}</EmpleosFieldLabel>
              <input className={INPUT} type="email" value={state.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} />
            </label>
            <label className="block text-sm">
              <EmpleosFieldLabel lang={lang} optional>{lang === "es" ? "Etiqueta CTA (reservado)" : "CTA label (reserved)"}</EmpleosFieldLabel>
              <input className={INPUT} value={state.ctaLabel} onChange={(e) => patch({ ctaLabel: e.target.value })} />
            </label>
          </EmpleosSectionCard>

          <EmpleosSectionCard title={lang === "es" ? "5. Detalles estructurados (opcional)" : "5. Structured details (optional)"}>
            <div>
              <p className="text-sm font-semibold">{lang === "es" ? "Viñetas para tarjeta Detalles" : "Details card bullets"}</p>
              <EmpleosStringLinesEditor
                items={state.detailsBullets}
                onChange={(detailsBullets) => patch({ detailsBullets })}
                addLabel={lang === "es" ? "+ Añadir" : "+ Add"}
                removeLabel={lang === "es" ? "Quitar" : "Remove"}
                placeholder=""
              />
            </div>
            <div>
              <p className="text-sm font-semibold">{lang === "es" ? "Detalles secundarios (bloque inferior)" : "Secondary details"}</p>
              <EmpleosStringLinesEditor
                items={state.secondaryDetails}
                onChange={(secondaryDetails) => patch({ secondaryDetails })}
                addLabel={lang === "es" ? "+ Añadir" : "+ Add"}
                removeLabel={lang === "es" ? "Quitar" : "Remove"}
                placeholder=""
              />
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
          const g = gateEmpleosFeriaPreview(state, lang);
          if (!g.ok) return;
          const envelope = buildEmpleosPublishEnvelopeFromFeria(state, lang);
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
