import { previewPrivadoCopy, type PreviewPrivadoLang } from "./previewPrivadoCopy";
import {
  previewPrivadoCardClass,
  previewPrivadoEquipmentRowClass,
  previewPrivadoSectionEyebrowClass,
  previewPrivadoSectionTitleClass,
} from "./previewPrivadoTokens";

export function PreviewPrivadoFeaturesCard({
  features,
  customEquipment,
  lang,
}: {
  features: string[];
  customEquipment: string[];
  lang: PreviewPrivadoLang;
}) {
  if (features.length === 0 && customEquipment.length === 0) return null;
  const copy = previewPrivadoCopy(lang);

  return (
    <section className={`${previewPrivadoCardClass} p-5 sm:p-6`}>
      <p className={previewPrivadoSectionEyebrowClass}>{copy.featuresEyebrow}</p>
      <h2 className={`mt-1 ${previewPrivadoSectionTitleClass}`}>{copy.featuresTitle}</h2>
      {features.length > 0 ? (
        <>
          <p className="mt-2 text-sm text-[#5C5346]">{copy.featuresChecklist}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {features.map((item) => (
              <li key={item} className={previewPrivadoEquipmentRowClass}>
                <span className="mt-0.5 text-[#7A1E2C]" aria-hidden>
                  ✓
                </span>
                <span className="break-words text-sm font-semibold leading-snug text-[#1F241C]">{item}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {customEquipment.length > 0 ? (
        <div className={features.length > 0 ? "mt-6 border-t border-[#D6C7AD]/70 pt-5" : "mt-3"}>
          <p className="text-sm font-bold text-[#1F241C]">{copy.featuresCustom}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {customEquipment.map((item) => (
              <li key={item} className={previewPrivadoEquipmentRowClass}>
                <span className="mt-0.5 text-[#C9782F]" aria-hidden>
                  ✓
                </span>
                <span className="break-words text-sm font-semibold leading-snug text-[#1F241C]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
