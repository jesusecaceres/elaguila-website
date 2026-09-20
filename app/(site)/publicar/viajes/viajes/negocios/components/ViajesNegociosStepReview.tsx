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

const STEP_LABELS_ES = ["Escapada", "Inclusiones", "Fotos", "Negocio", "Revisión"];
const STEP_LABELS_EN = ["Getaway", "Inclusions", "Media", "Business", "Review"];

export function ViajesNegociosStepReview({ offer, onGoStep, lang = "es" }: Props) {
  const es = lang !== "en";
  const issues = validateViajesOfferForSubmit(offer);
  const ui = getViajesUi(lang);
  const detail = mapViajesOfferV2ToDetailModel(offer, { sparse: true, lang });
  const stepLabels = es ? STEP_LABELS_ES : STEP_LABELS_EN;

  return (
    <div className="space-y-5">
      <section className={`${CARD} space-y-3`}>
        <p className={LABEL}>{es ? "Checklist antes de enviar" : "Pre-submit checklist"}</p>
        {issues.length === 0 ? (
          <p className="text-sm text-emerald-800">
            {es
              ? "Listo: no hay problemas bloqueantes detectados."
              : "Ready: no blocking issues detected."}
          </p>
        ) : (
          <ul className="space-y-2">
            {issues.map((issue) => (
              <li
                key={`${issue.code}-${issue.field ?? ""}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/60 bg-amber-50/80 px-3 py-2"
              >
                <span className="text-sm text-[color:var(--lx-text)]">{issue.message}</span>
                {typeof issue.step === "number" ? (
                  <button type="button" className={BTN} onClick={() => onGoStep(issue.step!)}>
                    {es ? "Ir a" : "Go to"} {stepLabels[(issue.step ?? 1) - 1] ?? issue.step}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2 border-t border-black/10 pt-3">
          {stepLabels.slice(0, 4).map((label, i) => (
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
