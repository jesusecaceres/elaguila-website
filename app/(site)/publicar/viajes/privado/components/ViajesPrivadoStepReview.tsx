"use client";

import type { ViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { mapViajesOfferV2ToDetailModel } from "@/app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToDetailModel";
import { validateViajesOfferForSubmit } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferV2Validation";
import { ViajesOfferDetailLayout } from "@/app/(site)/clasificados/viajes/components/ViajesOfferDetailLayout";
import { getViajesUi } from "@/app/(site)/clasificados/viajes/data/viajesUiCopy";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const CARD =
  "rounded-[20px] border border-black/10 bg-[color:var(--lx-page)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.08)] sm:p-5";
const BTN =
  "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-xs font-bold text-[color:var(--lx-text)] transition hover:bg-black/[0.03]";

type Props = {
  offer: ViajesOfferModelV2;
  onChange: (offer: ViajesOfferModelV2) => void;
  onGoStep: (n: number) => void;
  lang?: "es" | "en";
};

const STEP_LABELS_ES = ["Escapada", "Experiencia", "Contacto", "Revisión"];
const STEP_LABELS_EN = ["Getaway", "Experience", "Contact", "Review"];

export function ViajesPrivadoStepReview({ offer, onGoStep, lang = "es" }: Props) {
  const es = lang !== "en";
  const issues = validateViajesOfferForSubmit(offer);
  const ui = getViajesUi(lang);
  const trustNote = es
    ? "Publicación de particular: la ubicación exacta no se muestra públicamente. Contacto vía Inquiry Hub."
    : "Private seller listing: exact location is not shown publicly. Contact via Inquiry Hub.";
  const detail = mapViajesOfferV2ToDetailModel(offer, { sparse: true, lang, trustNote });
  const stepLabels = es ? STEP_LABELS_ES : STEP_LABELS_EN;

  return (
    <div className="space-y-5">
      <section className={`${CARD} space-y-3`}>
        <p className="rounded-xl border border-[#D97706]/35 bg-[#D97706]/10 px-3 py-2 text-sm leading-relaxed text-[color:var(--lx-text)]">
          {trustNote}
        </p>
        <p className={LABEL}>{es ? "Checklist antes de enviar" : "Pre-submit checklist"}</p>
        {issues.length === 0 ? (
          <p className="text-sm text-emerald-800">
            {es
              ? "Listo: no hay problemas bloqueantes detectados."
              : "Ready: no blocking issues detected."}
          </p>
        ) : (
          <ul className="space-y-2">
            {issues.map((issue) => {
              // Map business validation steps loosely onto privado steps (1 getaway, 2 experience/media, 3 contact)
              let go = issue.step;
              if (issue.step === 3) go = 2;
              if (issue.step === 4 || issue.step === 5) go = 3;
              return (
                <li
                  key={`${issue.code}-${issue.field ?? ""}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/60 bg-amber-50/80 px-3 py-2"
                >
                  <span className="text-sm text-[color:var(--lx-text)]">{issue.message}</span>
                  {typeof go === "number" ? (
                    <button type="button" className={BTN} onClick={() => onGoStep(go!)}>
                      {es ? "Ir a" : "Go to"} {stepLabels[(go ?? 1) - 1] ?? go}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-wrap gap-2 border-t border-black/10 pt-3">
          {stepLabels.slice(0, 3).map((label, i) => (
            <button key={label} type="button" className={BTN} onClick={() => onGoStep(i + 1)}>
              {es ? "Editar" : "Edit"}: {label}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-black/10">
        <div className="border-b border-black/10 bg-white/70 px-4 py-3">
          <p className={LABEL}>{es ? "Vista previa" : "Preview"}</p>
        </div>
        <ViajesOfferDetailLayout
          offer={detail}
          lang={lang}
          backHref="#"
          backLabel={es ? "Vista previa" : "Preview"}
          preview
          previewTone="minimal"
          sparseSections
          ui={ui}
          exploreViajesHref="/clasificados/viajes"
        />
      </section>
    </div>
  );
}
