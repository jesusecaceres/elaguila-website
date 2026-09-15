import { previewPrivadoCopy, type PreviewPrivadoLang } from "./previewPrivadoCopy";
import {
  previewPrivadoCardClass,
  previewPrivadoSectionEyebrowClass,
  previewPrivadoSectionTitleClass,
} from "./previewPrivadoTokens";

export function PreviewPrivadoDescriptionCard({
  description,
  lang,
}: {
  description?: string;
  lang: PreviewPrivadoLang;
}) {
  const body = description?.trim();
  if (!body) return null;
  const copy = previewPrivadoCopy(lang);

  return (
    <section className={`${previewPrivadoCardClass} p-5 sm:p-6`}>
      <p className={previewPrivadoSectionEyebrowClass}>{copy.descriptionEyebrow}</p>
      <h2 className={`mt-1 ${previewPrivadoSectionTitleClass}`}>{copy.descriptionTitle}</h2>
      <p className="mt-4 max-w-[65ch] break-words whitespace-pre-wrap text-[15px] leading-[1.7] text-[#5C5346]">
        {body}
      </p>
    </section>
  );
}
