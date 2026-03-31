import type { Lang } from "../../types/tienda";
import type { TiendaOrderReviewSummary } from "../../types/orderHandoff";
import { ohPick, orderHandoffCopy } from "../../data/orderHandoffCopy";

export function TiendaAssetSummary(props: { review: TiendaOrderReviewSummary; lang: Lang }) {
  const { review, lang } = props;
  if (!review.assets.length) return null;

  return (
    <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgba(201,168,74,0.95)]">
        {ohPick(orderHandoffCopy.assetsTitle, lang)}
      </h2>
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        {review.assets.map((a) => (
          <article
            key={a.id}
            className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.25)] overflow-hidden"
          >
            <div className="aspect-[16/10] bg-[rgba(255,247,226,0.04)] flex items-center justify-center relative">
              {a.thumbnailUrl ? (
                <img src={a.thumbnailUrl} alt="" className="max-h-full max-w-full object-contain" />
              ) : a.kind === "pdf" ? (
                <div className="text-center px-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[rgba(201,168,74,0.85)]">PDF</span>
                  <p className="mt-1 text-[11px] text-[rgba(255,255,255,0.55)]">
                    {lang === "en" ? "Summary card — open file in configurator to review." : "Tarjeta resumen — revisa el PDF en el configurador."}
                  </p>
                </div>
              ) : a.kind === "design-side" ? (
                <p className="text-xs text-[rgba(255,255,255,0.45)] px-4 text-center">
                  {lang === "en" ? "Thumbnail when logo is present in saved draft." : "Miniatura cuando el borrador incluye logo."}
                </p>
              ) : null}
            </div>
            <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
              <h3 className="text-sm font-medium text-[rgba(255,247,226,0.90)]">
                {lang === "en" ? a.label.en : a.label.es}
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-[rgba(255,255,255,0.65)]">
                {a.metaLines.map((line, i) => (
                  <li key={i}>{lang === "en" ? line.en : line.es}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
