"use client";

import type { ViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesPillCollectionEditor } from "../../components/ViajesPillCollectionEditor";
import { ViajesMediaManager } from "../../components/ViajesMediaManager";
import { ViajesModuleListEditor } from "../../components/modules/viajesModuleListEditor";
import type { ViajesModuleKind } from "../../components/modules/viajesModuleFactories";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[color:var(--lx-text)]";
const CARD =
  "rounded-[20px] border border-black/10 bg-[color:var(--lx-page)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.08)] sm:p-5";

const PRIVADO_MODULE_KINDS: ViajesModuleKind[] = [
  "accommodation",
  "transportation",
  "food",
  "activity",
  "addon",
];

type Props = {
  offer: ViajesOfferModelV2;
  onChange: (offer: ViajesOfferModelV2) => void;
  draftId: string;
  getBearerToken: () => Promise<string | null>;
  lang?: "es" | "en";
};

export function ViajesPrivadoStepExperience({
  offer,
  onChange,
  draftId,
  getBearerToken,
  lang = "es",
}: Props) {
  const es = lang !== "en";

  return (
    <div className="space-y-5">
      <section className={CARD}>
        <label className={LABEL} htmlFor="vx-prv-story">
          {es ? "Descripción" : "Description"}
        </label>
        <textarea
          id="vx-prv-story"
          className={`${INPUT} mt-1 min-h-[100px] resize-y`}
          rows={4}
          value={offer.story}
          onChange={(e) => onChange({ ...offer, story: e.target.value })}
        />
      </section>

      <section className={`${CARD} space-y-6`}>
        <ViajesPillCollectionEditor
          label={es ? "Incluye" : "Inclusions"}
          items={offer.inclusions}
          onChange={(inclusions) => onChange({ ...offer, inclusions })}
          placeholder={es ? "Ej. Transporte redondo" : "e.g. Round-trip transport"}
        />
        <ViajesPillCollectionEditor
          label={es ? "Destacados" : "Highlights"}
          items={offer.highlights}
          onChange={(highlights) => onChange({ ...offer, highlights })}
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
          kinds={PRIVADO_MODULE_KINDS}
        />
      </section>

      <section className={CARD}>
        <ViajesMediaManager
          images={offer.media.images}
          videos={offer.media.videos}
          onChangeImages={(images) => onChange({ ...offer, media: { ...offer.media, images } })}
          onChangeVideos={(videos) => onChange({ ...offer, media: { ...offer.media, videos } })}
          draftId={draftId}
          getBearerToken={getBearerToken}
          lang={lang}
        />
      </section>
    </div>
  );
}
