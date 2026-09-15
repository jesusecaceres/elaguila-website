import type { PreviewPrivadoSpecRow } from "./previewPrivadoFields";
import { previewPrivadoCopy, type PreviewPrivadoLang } from "./previewPrivadoCopy";
import {
  previewPrivadoCardClass,
  previewPrivadoSectionEyebrowClass,
  previewPrivadoSectionTitleClass,
} from "./previewPrivadoTokens";

export function PreviewPrivadoSpecsCard({
  rows,
  lang,
}: {
  rows: PreviewPrivadoSpecRow[];
  lang: PreviewPrivadoLang;
}) {
  if (rows.length === 0) return null;
  const copy = previewPrivadoCopy(lang);

  return (
    <section className={`${previewPrivadoCardClass} p-5 sm:p-6`}>
      <p className={previewPrivadoSectionEyebrowClass}>{copy.specsEyebrow}</p>
      <h2 className={`mt-1 ${previewPrivadoSectionTitleClass}`}>{copy.specsTitle}</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.key} className="flex min-w-0 items-baseline justify-between gap-4 border-b border-[#D6C7AD]/50 py-2">
            <dt className="shrink-0 text-sm text-[#5C5346]">{row.label}</dt>
            <dd className="min-w-0 break-words text-right text-sm font-semibold text-[#1F241C]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
