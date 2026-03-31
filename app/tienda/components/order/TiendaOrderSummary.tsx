import type { Lang } from "../../types/tienda";
import type { TiendaOrderReviewSummary } from "../../types/orderHandoff";
import type { SelfServeOrderPricingSnapshot } from "@/app/lib/tienda/selfServePricing";
import { isSelfServeCatalogPricingProduct } from "@/app/lib/tienda/selfServePricing";
import { ohPick, orderHandoffCopy } from "../../data/orderHandoffCopy";

export function TiendaOrderSummary(props: {
  review: TiendaOrderReviewSummary;
  lang: Lang;
  pricingSnapshot?: SelfServeOrderPricingSnapshot | null;
  pricingLoading?: boolean;
  pricingFetchNote?: string | null;
}) {
  const { review, lang, pricingSnapshot = null, pricingLoading = false, pricingFetchNote = null } = props;
  const showPricingPanel =
    isSelfServeCatalogPricingProduct(review.productSlug) && review.pricingInput != null;
  return (
    <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,247,226,0.06)] p-5 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgba(201,168,74,0.95)]">
        {ohPick(orderHandoffCopy.summaryTitle, lang)}
      </h2>
      <p className="mt-3 text-lg font-semibold text-[rgba(255,247,226,0.95)]">
        {lang === "en" ? review.productTitle.en : review.productTitle.es}
      </p>
      <p className="mt-2 text-xs text-[rgba(255,255,255,0.45)]">
        {review.productSlug} · {review.categorySlug}
      </p>

      {showPricingPanel ? (
        <div className="mt-5 rounded-xl border border-[rgba(201,168,74,0.22)] bg-[rgba(0,0,0,0.18)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(201,168,74,0.95)]">
            {ohPick(orderHandoffCopy.pricingTitle, lang)}
          </p>
          {pricingLoading ? (
            <p className="mt-2 text-sm text-[rgba(255,255,255,0.62)]">{ohPick(orderHandoffCopy.pricingLoading, lang)}</p>
          ) : pricingSnapshot ? (
            <>
              <p className="mt-2 text-sm font-medium text-[rgba(255,247,226,0.92)]">
                {lang === "en" ? pricingSnapshot.headlineEn : pricingSnapshot.headlineEs}
              </p>
              {(lang === "en" ? pricingSnapshot.sublineEn : pricingSnapshot.sublineEs) ? (
                <p className="mt-1.5 text-xs leading-relaxed text-[rgba(255,255,255,0.68)]">
                  {lang === "en" ? pricingSnapshot.sublineEn : pricingSnapshot.sublineEs}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-xs text-[rgba(255,255,255,0.55)]">
              {lang === "en"
                ? "No pricing reference yet. Leonix will confirm with you after review."
                : "Sin referencia de precio aún. Leonix confirmará contigo tras revisar."}
            </p>
          )}
          {pricingFetchNote ? (
            <p className="mt-2 text-[11px] text-[rgba(220,180,120,0.85)]">{pricingFetchNote}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(255,247,226,0.58)]">
            {ohPick(orderHandoffCopy.sidednessTitle, lang)}
          </p>
          <p className="mt-1 text-[rgba(255,255,255,0.88)]">{lang === "en" ? review.sidednessSummary.en : review.sidednessSummary.es}</p>
        </div>
        {review.builderSavedAt ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(255,247,226,0.58)]">
              {ohPick(orderHandoffCopy.savedAtLabel, lang)}
            </p>
            <p className="mt-1 text-[rgba(255,255,255,0.72)] font-mono text-xs">{new Date(review.builderSavedAt).toLocaleString()}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(255,247,226,0.58)]">
          {ohPick(orderHandoffCopy.specsTitle, lang)}
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-[rgba(255,255,255,0.80)] list-disc list-inside">
          {review.specLines.map((line, i) => (
            <li key={i}>{lang === "en" ? line.en : line.es}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
