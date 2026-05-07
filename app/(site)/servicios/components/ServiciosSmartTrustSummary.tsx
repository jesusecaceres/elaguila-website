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
      className="rounded-2xl border border-[#E8D7B8] bg-[#FCF9F2] p-4 shadow-sm sm:p-5"
      aria-labelledby="servicios-smart-trust-heading"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#FCF9F2] shadow-sm">
          <FaShieldAlt className="h-5 w-5 text-[#D4AF37]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="servicios-smart-trust-heading"
            className="text-base font-bold tracking-tight text-[#2F2A23] md:text-lg"
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
