"use client";

import Image from "next/image";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { ServiciosBusinessHubFauxMap } from "./ServiciosBusinessHubFauxMap";

export function ServiciosBusinessHubMapPanel({
  mapImageUrl,
  mapEmbedSrc,
  addressDisplay,
  lang,
}: {
  mapImageUrl?: string;
  mapEmbedSrc?: string;
  addressDisplay?: string;
  lang: "es" | "en";
}) {
  const imageSrc = mapImageUrl?.trim();
  const embedSrc = mapEmbedSrc?.trim();
  const hasAddress = Boolean(addressDisplay?.trim());

  if (imageSrc) {
    return (
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#E8E0D4]">
        <Image
          src={imageSrc}
          alt={lang === "en" ? "Business location map" : "Mapa de ubicación"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 380px"
          unoptimized={serviciosImageUnoptimized(imageSrc)}
        />
      </div>
    );
  }

  if (embedSrc && /^https:\/\/www\.google\.com\/maps\?/i.test(embedSrc)) {
    return (
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#E8E0D4]">
        <iframe
          title={lang === "en" ? "Map preview" : "Vista previa del mapa"}
          src={embedSrc}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    );
  }

  if (!hasAddress) return null;

  return <ServiciosBusinessHubFauxMap />;
}
