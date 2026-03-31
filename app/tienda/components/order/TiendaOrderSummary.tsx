import type { Lang } from "../../types/tienda";
import type { TiendaOrderReviewSummary } from "../../types/orderHandoff";
import { ohPick, orderHandoffCopy } from "../../data/orderHandoffCopy";

export function TiendaOrderSummary(props: { review: TiendaOrderReviewSummary; lang: Lang }) {
  const { review, lang } = props;
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
