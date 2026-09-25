"use client";

import { FiAnchor, FiDroplet, FiHome } from "react-icons/fi";
import {
  ImageDiscoveryCard,
  LEONIX_IMAGE_DISCOVERY_GRID,
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import type { ImageDiscoveryGridItem } from "@/app/(site)/clasificados/components/categoryStandardV2";
import {
  buildComidaLocalResultsHref,
  emptyComidaLocalResultsFilters,
} from "@/app/lib/clasificados/comida-local/comidaLocalResultsUrl";

/**
 * Image-led discovery section for /clasificados/comida-local, above the
 * filters/results. Items link through the real `foodType` filter param — the
 * only Comida Local taxonomy dimension currently wired to results filtering
 * (see COMIDA_LOCAL_FOOD_TYPE_OPTIONS in comidaLocalConstants.ts). Business
 * format (food truck, puesto, pop-up, mercado) has no filter param today, so
 * it is intentionally not represented here as a clickable card.
 *
 * Bilingual: `lang` is the page's active locale (from `?lang=`). Copy is
 * provided in ES + EN and every href is built by the shared
 * `buildComidaLocalResultsHref`, which carries `lang` — the same contract the
 * results filter form uses, so a card click never drops the viewer's language.
 */
type ComidaLocalDiscoveryItemDef = {
  foodType: string;
  labelEs: string;
  labelEn: string;
  hintEs: string;
  hintEn: string;
  imageSrc?: string;
  icon?: ImageDiscoveryGridItem["icon"];
};

const COMIDA_LOCAL_DISCOVERY_ITEMS: readonly ComidaLocalDiscoveryItemDef[] = [
  {
    foodType: "tacos",
    labelEs: "Tacos",
    labelEn: "Tacos",
    hintEs: "Antojitos mexicanos",
    hintEn: "Mexican street food",
    imageSrc: "/child-categories/restaurantes/mexican.jpg",
  },
  {
    foodType: "postres",
    labelEs: "Postres",
    labelEn: "Desserts",
    hintEs: "Dulces y repostería",
    hintEn: "Sweets and baked goods",
    imageSrc: "/child-categories/restaurantes/dessert.jpg",
  },
  {
    foodType: "comida-eventos",
    labelEs: "Comida para eventos",
    labelEn: "Event catering",
    hintEs: "Catering local",
    hintEn: "Local catering",
    imageSrc: "/child-categories/restaurantes/catering.jpg",
  },
  {
    foodType: "comida-casera",
    labelEs: "Comida casera",
    labelEn: "Home cooking",
    hintEs: "Hecha en casa",
    hintEn: "Homemade meals",
    icon: FiHome,
  },
  {
    foodType: "mariscos",
    labelEs: "Mariscos",
    labelEn: "Seafood",
    hintEs: "Cocina del mar",
    hintEn: "From the sea",
    icon: FiAnchor,
  },
  {
    foodType: "bebidas",
    labelEs: "Bebidas",
    labelEn: "Drinks",
    hintEs: "Aguas, jugos y más",
    hintEn: "Aguas frescas, juices and more",
    icon: FiDroplet,
  },
];

const COPY = {
  es: {
    heading: "Explora por tipo de comida",
    subtitle: "Encuentra puestos, pop-ups y vendedores locales por lo que buscas.",
  },
  en: {
    heading: "Explore by food type",
    subtitle: "Find local stands, pop-ups and vendors by what you're craving.",
  },
} as const;

export function ComidaLocalDiscoverySection({ lang }: { lang: "es" | "en" }) {
  const copy = COPY[lang];
  const items: ImageDiscoveryGridItem[] = COMIDA_LOCAL_DISCOVERY_ITEMS.map((def) => {
    const label = lang === "en" ? def.labelEn : def.labelEs;
    return {
      id: def.foodType,
      label,
      hint: lang === "en" ? def.hintEn : def.hintEs,
      href: buildComidaLocalResultsHref(
        { ...emptyComidaLocalResultsFilters(), foodType: def.foodType },
        lang,
      ),
      imageSrc: def.imageSrc,
      imageAlt: label,
      icon: def.icon,
    };
  });

  return (
    <section className={LEONIX_LANDING_SECTION} aria-labelledby="comida-local-discovery-heading">
      <div className={LEONIX_LANDING_SECTION_PAD}>
        <h2
          id="comida-local-discovery-heading"
          className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl"
        >
          {copy.heading}
        </h2>
        <p className="mt-1 text-xs text-[#5C5346]/90">{copy.subtitle}</p>
        <div className={LEONIX_IMAGE_DISCOVERY_GRID}>
          {items.map((item) => (
            <ImageDiscoveryCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
