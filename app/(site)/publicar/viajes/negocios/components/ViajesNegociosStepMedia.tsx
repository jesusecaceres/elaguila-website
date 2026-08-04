"use client";

import type { ViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesMediaManager } from "../../components/ViajesMediaManager";

const CARD =
  "rounded-[20px] border border-black/10 bg-[color:var(--lx-page)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.08)] sm:p-5";

type Props = {
  offer: ViajesOfferModelV2;
  onChange: (offer: ViajesOfferModelV2) => void;
  draftId: string;
  getBearerToken: () => Promise<string | null>;
  lang?: "es" | "en";
};

export function ViajesNegociosStepMedia({
  offer,
  onChange,
  draftId,
  getBearerToken,
  lang = "es",
}: Props) {
  return (
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
  );
}
