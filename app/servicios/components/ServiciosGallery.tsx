import Image from "next/image";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { SV } from "./serviciosDesignTokens";

export function ServiciosGallery({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const items = profile.gallery;
  if (!items.length) return null;

  return (
    <section
      className="rounded-2xl border p-6 shadow-sm md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.gallery}</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {items.map((g) => (
          <div
            key={g.id}
            className="relative aspect-[5/4] overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.03]"
          >
            <Image src={g.url} alt={g.alt} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          </div>
        ))}
      </div>
    </section>
  );
}
