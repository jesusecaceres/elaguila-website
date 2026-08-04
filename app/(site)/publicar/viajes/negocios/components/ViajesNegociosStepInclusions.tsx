"use client";

import type { ViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesPillCollectionEditor } from "../../components/ViajesPillCollectionEditor";
import { ViajesModuleListEditor } from "../../components/modules/viajesModuleListEditor";
import { ViajesModuleItineraryEditor } from "../../components/modules/ViajesModuleItineraryEditor";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[color:var(--lx-text)]";
const CARD =
  "rounded-[20px] border border-black/10 bg-[color:var(--lx-page)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.08)] sm:p-5";

type Props = {
  offer: ViajesOfferModelV2;
  onChange: (offer: ViajesOfferModelV2) => void;
  lang?: "es" | "en";
};

export function ViajesNegociosStepInclusions({ offer, onChange, lang = "es" }: Props) {
  const es = lang !== "en";

  return (
    <div className="space-y-5">
      <section className={CARD}>
        <label className={LABEL} htmlFor="vx-biz-story">
          {es ? "Historia / descripción" : "Story / description"}
        </label>
        <textarea
          id="vx-biz-story"
          className={`${INPUT} mt-1 min-h-[120px] resize-y`}
          rows={5}
          value={offer.story}
          onChange={(e) => onChange({ ...offer, story: e.target.value })}
          placeholder={
            es
              ? "Cuenta qué hace especial este viaje…"
              : "Tell what makes this trip special…"
          }
        />
      </section>

      <section className={`${CARD} space-y-6`}>
        <ViajesPillCollectionEditor
          label={es ? "Destacados" : "Highlights"}
          items={offer.highlights}
          onChange={(highlights) => onChange({ ...offer, highlights })}
          placeholder={es ? "Ej. Todo incluido" : "e.g. All inclusive"}
        />
        <ViajesPillCollectionEditor
          label={es ? "Incluye" : "Inclusions"}
          items={offer.inclusions}
          onChange={(inclusions) => onChange({ ...offer, inclusions })}
          placeholder={es ? "Ej. Hotel 4★" : "e.g. 4★ hotel"}
        />
        <ViajesPillCollectionEditor
          label={es ? "No incluye" : "Exclusions"}
          items={offer.exclusions}
          onChange={(exclusions) => onChange({ ...offer, exclusions })}
        />
        <ViajesPillCollectionEditor
          label={es ? "Amenidades" : "Amenities"}
          items={offer.amenities}
          onChange={(amenities) => onChange({ ...offer, amenities })}
        />
        <ViajesPillCollectionEditor
          label={es ? "Políticas" : "Policies"}
          items={offer.policies}
          onChange={(policies) => onChange({ ...offer, policies })}
        />
        <ViajesPillCollectionEditor
          label={es ? "Accesibilidad" : "Accessibility"}
          items={offer.accessibility}
          onChange={(accessibility) => onChange({ ...offer, accessibility })}
        />
        <ViajesPillCollectionEditor
          label={es ? "Qué debes saber" : "Need to know"}
          items={offer.needToKnow}
          onChange={(needToKnow) => onChange({ ...offer, needToKnow })}
        />
      </section>

      <section className={CARD}>
        <ViajesModuleListEditor
          modules={offer.modules}
          onChange={(modules) => onChange({ ...offer, modules })}
          lang={lang}
        />
      </section>

      <section className={CARD}>
        <ViajesModuleItineraryEditor
          value={offer.itinerary}
          onChange={(itinerary) => onChange({ ...offer, itinerary })}
        />
      </section>
    </div>
  );
}
