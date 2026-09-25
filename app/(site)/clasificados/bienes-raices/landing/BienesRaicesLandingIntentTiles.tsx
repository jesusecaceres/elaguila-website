"use client";

import { BIENES_INTENT_TILES } from "./bienesRaicesLandingGateway";
import { BIENES_RAICES_CHILD_CATEGORY_IMAGE } from "./bienesRaicesChildCategoryImages";
import {
  BR_LANDING_TILES_ACCENT,
  BR_LANDING_TILES_INTEGRATED,
} from "@/app/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi";
import { buildBrResultsUrl } from "@/app/clasificados/bienes-raices/shared/constants/brResultsRoutes";
import { ImageDiscoveryCard, LEONIX_IMAGE_DISCOVERY_GRID } from "@/app/(site)/clasificados/components/categoryStandardV2";

type Props = {
  lang: "es" | "en";
  routeLang: string;
  headingEs: string;
  headingEn: string;
  /** Inside integrated gateway panel — transparent, no color-shift band. */
  embedded?: boolean;
};

export function BienesRaicesLandingIntentTiles({ lang, routeLang, headingEs, headingEn, embedded = false }: Props) {
  const tiles = BIENES_INTENT_TILES.filter((t) => t.wired);

  const sectionClass = embedded
    ? BR_LANDING_TILES_INTEGRATED
    : "mt-6 rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 px-4 py-5 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)] sm:mt-7 sm:px-6 sm:py-6";

  return (
    <section className={sectionClass} aria-labelledby="br-intent-tiles-heading">
      {embedded ? <div className={BR_LANDING_TILES_ACCENT} aria-hidden /> : null}
      <h2 id="br-intent-tiles-heading" className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
        {lang === "es" ? headingEs : headingEn}
      </h2>
      <p className="mt-1 text-xs text-[#5C5346]/90">
        {lang === "es" ? "Elige una opción para empezar." : "Pick an option to get started."}
      </p>
      <div className={LEONIX_IMAGE_DISCOVERY_GRID}>
        {tiles.map((tile) => {
          const href = buildBrResultsUrl({ ...tile.params, lang: routeLang });
          const label = lang === "es" ? tile.labelEs : tile.labelEn;
          const hint = lang === "es" ? tile.hintEs : tile.hintEn;
          return (
            <ImageDiscoveryCard
              key={tile.id}
              item={{
                id: tile.id,
                label,
                hint,
                href,
                imageSrc: BIENES_RAICES_CHILD_CATEGORY_IMAGE[tile.id as keyof typeof BIENES_RAICES_CHILD_CATEGORY_IMAGE],
                imageAlt: label,
                icon: tile.Icon,
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
