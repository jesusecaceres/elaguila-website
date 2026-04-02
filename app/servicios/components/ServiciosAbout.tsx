import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { SV } from "./serviciosDesignTokens";

export function ServiciosAbout({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const text = profile.about?.text;
  const specialtiesLine = profile.about?.specialtiesLine;
  if (!text && !specialtiesLine) return null;

  return (
    <section
      className="rounded-2xl border p-6 shadow-sm md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.about}</h2>
      {text ? (
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[color:var(--lx-text-2)]">{text}</p>
      ) : null}
      {specialtiesLine ? (
        <p className="mt-4 text-sm font-medium leading-relaxed text-[color:var(--lx-muted)]">{specialtiesLine}</p>
      ) : null}
    </section>
  );
}
