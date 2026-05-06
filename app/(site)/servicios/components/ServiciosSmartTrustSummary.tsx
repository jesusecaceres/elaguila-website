import { FaShieldAlt } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosSmartTrustSummaryCopy } from "../copy/serviciosProfileCopy";
import { buildServiciosSmartTrustSummary } from "../lib/serviciosSmartTrustSummary";

export function ServiciosSmartTrustSummary({
  profile,
  lang,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
}) {
  const model = buildServiciosSmartTrustSummary(profile, lang);
  if (!model) return null;

  const copy = getServiciosSmartTrustSummaryCopy(lang);

  return (
    <section
      className="rounded-2xl border border-[#D4A574]/45 bg-gradient-to-br from-[#FFFCF7] via-[#FFF8EC] to-[#FAF0E4] p-4 shadow-[0_8px_24px_-14px_rgba(61,44,18,0.2)] sm:p-5"
      aria-labelledby="servicios-smart-trust-heading"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C9A84A]/35 bg-[#FFF3DC]/90 shadow-sm">
          <FaShieldAlt className="h-5 w-5 text-[#8A6B2E]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="servicios-smart-trust-heading"
            className="text-base font-bold tracking-tight text-[#2C2214] md:text-lg"
          >
            {copy.title}
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B5420]/85">
            {copy.subtitle}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#3D2C12]/95">{model.paragraph}</p>
          {model.chips.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={copy.subtitle}>
              {model.chips.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-[#C9A84A]/40 bg-[#FFFAF0]/95 px-2.5 py-1 text-[11px] font-semibold text-[#4A3A22]"
                >
                  {c}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
