import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { SV } from "./serviciosDesignTokens";
import { LX_SECTION_CARD, LX_SECTION_HEADING } from "./serviciosLeonixBrand";

export function ServiciosAbout({
  profile,
  lang,
  premiumLeonixTone = false,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  premiumLeonixTone?: boolean;
}) {
  const L = getServiciosProfileLabels(lang);
  const text = profile.about?.text;
  if (!text) return null;

  return (
    <section
      className={premiumLeonixTone ? `${LX_SECTION_CARD} p-4 sm:p-6 md:p-8` : "rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"}
      style={
        premiumLeonixTone
          ? undefined
          : { backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }
      }
    >
      <h2
        className={
          premiumLeonixTone
            ? LX_SECTION_HEADING
            : "text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl"
        }
      >
        {L.about}
      </h2>
      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-[15px]">{text}</p>
    </section>
  );
}
