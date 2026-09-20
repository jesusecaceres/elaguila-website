"use client";

import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";
import { formatRevenuePriceLabel, getRevenuePackagePriceCents } from "@/app/lib/listingPlans/revenuePricingMatrix";
import { quickBusinessCopy } from "@/app/lib/quickBusiness/quickBusinessCopy";
import type { QuickBusinessConfirmationSurface, QuickBusinessDefinition } from "@/app/lib/quickBusiness/quickBusinessTypes";
import { qt, quickCopy } from "@/app/lib/quickClassifieds/quickClassifiedCopy";
import type { QuickConfirmations, QuickIntakeStep, QuickIntakeValues, QuickLang, QuickMediaItem } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickFieldIsVisible, quickFieldOptions, quickValueIsEmpty } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { quickCard, quickPrimaryBtn } from "@/app/publicar/rapido/_components/QuickShell";

type Props = {
  lang: QuickLang;
  definition: QuickBusinessDefinition;
  steps: readonly QuickIntakeStep[];
  values: QuickIntakeValues;
  media: QuickMediaItem[];
  confirmations: QuickConfirmations;
  surface: QuickBusinessConfirmationSurface;
  submitting: boolean;
  issues: string[];
  onEditStep: (index: number) => void;
  onConfirmations: (next: QuickConfirmations) => void;
  onSubmit: () => void;
};

function displayValue(step: QuickIntakeStep, key: string, values: QuickIntakeValues, lang: QuickLang): string {
  const field = step.fields.find((f) => f.key === key);
  if (!field) return "";
  const raw = values[key];
  if (quickValueIsEmpty(raw)) return "";
  if (raw === true) return lang === "en" ? "Yes" : "Sí";
  if (field.kind === "select" || field.kind === "chips") {
    const options = quickFieldOptions(field, values);
    const list = Array.isArray(raw) ? raw : [String(raw)];
    return list.map((v) => qt(options.find((o) => o.value === v)?.label ?? { es: v, en: v }, lang)).join(", ");
  }
  return Array.isArray(raw) ? raw.join(", ") : String(raw);
}

/** Price is display-only and always read from the server-side pricing authority at render time (monthly). */
function priceLine(def: QuickBusinessDefinition, lang: QuickLang): string | null {
  const { priceCents } = getRevenuePackagePriceCents({ category: def.pricing.category, packageKey: def.pricing.packageKey });
  if (priceCents == null) return null;
  return `${formatRevenuePriceLabel(priceCents)}${quickBusinessCopy("perMonth", lang)}`;
}

export function QuickBusinessReviewStep({ lang, definition, steps, values, media, confirmations, surface, submitting, issues, onEditStep, onConfirmations, onSubmit }: Props) {
  const price = priceLine(definition, lang);
  const confirmationsOk = surface.kind === "none" || (confirmations.infoTruthful && confirmations.mediaAccurate && confirmations.rulesAccepted);
  return (
    <div className="space-y-4">
      <section className={quickCard}>
        <h2 className="text-lg font-extrabold">{quickCopy("reviewTitle", lang)}</h2>
        <p className="mt-1 text-sm text-[#5D4A25]/90">{quickCopy("reviewIntro", lang)}</p>
        <div className="mt-3 space-y-3">
          {steps.map((step, i) => (
            <div key={step.id} className="rounded-xl border border-[#E8DFD0] bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold">{qt(step.title, lang)}</h3>
                <button type="button" onClick={() => onEditStep(i)} className="min-h-[36px] text-xs font-semibold text-[#7A1E2C] underline">
                  {quickCopy("reviewEdit", lang)}
                </button>
              </div>
              <dl className="mt-2 space-y-1 text-sm">
                {step.fields
                  .filter((f) => quickFieldIsVisible(f, values))
                  .map((f) => {
                    const v = displayValue(step, f.key, values, lang);
                    if (!v) return null;
                    return (
                      <div key={f.key} className="flex gap-2">
                        <dt className="w-2/5 shrink-0 text-[#7A7164]">{qt(f.label, lang)}</dt>
                        <dd className="min-w-0 flex-1 break-words font-medium">{v}</dd>
                      </div>
                    );
                  })}
              </dl>
            </div>
          ))}
          <div className="rounded-xl border border-[#E8DFD0] bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">{quickCopy("reviewPhotos", lang)}</h3>
              <button type="button" onClick={() => onEditStep(steps.length)} className="min-h-[36px] text-xs font-semibold text-[#7A1E2C] underline">
                {quickCopy("reviewEdit", lang)}
              </button>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {media.map((m) => (
                <img key={m.id} src={m.dataUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {surface.kind === "servicios" ? (
        <div className={quickCard}>
          <ListingRulesConfirmationSection
            lang={lang}
            subject="servicios"
            confirmAccurate={confirmations.infoTruthful}
            confirmPhotos={confirmations.mediaAccurate}
            confirmRules={confirmations.rulesAccepted}
            onAccurate={(v) => onConfirmations({ ...confirmations, infoTruthful: v })}
            onPhotos={(v) => onConfirmations({ ...confirmations, mediaAccurate: v })}
            onRules={(v) => onConfirmations({ ...confirmations, rulesAccepted: v })}
          />
        </div>
      ) : null}

      <section className={quickCard}>
        <p className="text-sm font-semibold">{price ? `${quickBusinessCopy("reviewPaidNote", lang)} ${price}` : quickBusinessCopy("reviewPaidNote", lang)}</p>
        <p className="mt-1 text-xs text-[#7A7164]">{quickBusinessCopy("reviewHandoffNote", lang)}</p>
        {issues.length ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <p className="font-semibold">{quickCopy("fixIssues", lang)}</p>
            <ul className="mt-1 list-disc pl-5">
              {issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {!confirmationsOk ? <p className="mt-3 text-xs text-[#7A1E2C]">{quickCopy("reviewConfirmationsNeeded", lang)}</p> : null}
        <button type="button" className={`${quickPrimaryBtn} mt-4`} disabled={submitting || !confirmationsOk || media.length === 0} onClick={onSubmit}>
          {submitting ? quickCopy("reviewSubmitting", lang) : `👀 ${quickCopy("reviewSubmit", lang)}`}
        </button>
      </section>
    </div>
  );
}
