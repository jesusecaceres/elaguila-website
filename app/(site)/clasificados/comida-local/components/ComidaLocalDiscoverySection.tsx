"use client";

import { FiAnchor, FiDroplet, FiHome } from "react-icons/fi";
import {
  ImageDiscoveryCard,
  LEONIX_IMAGE_DISCOVERY_GRID,
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import type { ImageDiscoveryGridItem } from "@/app/(site)/clasificados/components/categoryStandardV2";

/**
 * Image-led discovery section for /clasificados/comida-local, above the
 * filters/results. Items link through the real `foodType` filter param — the
 * only Comida Local taxonomy dimension currently wired to results filtering
 * (see COMIDA_LOCAL_FOOD_TYPE_OPTIONS in comidaLocalConstants.ts). Business
 * format (food truck, puesto, pop-up, mercado) has no filter param today, so
 * it is intentionally not represented here as a clickable card.
 */
const COMIDA_LOCAL_DISCOVERY_ITEMS: ImageDiscoveryGridItem[] = [
  {
    id: "tacos",
    label: "Tacos",
    hint: "Antojitos mexicanos",
    href: "/clasificados/comida-local?foodType=tacos",
    imageSrc: "/child-categories/restaurantes/mexican.jpg",
    imageAlt: "Tacos",
  },
  {
    id: "postres",
    label: "Postres",
    hint: "Dulces y repostería",
    href: "/clasificados/comida-local?foodType=postres",
    imageSrc: "/child-categories/restaurantes/dessert.jpg",
    imageAlt: "Postres",
  },
  {
    id: "comida-eventos",
    label: "Comida para eventos",
    hint: "Catering local",
    href: "/clasificados/comida-local?foodType=comida-eventos",
    imageSrc: "/child-categories/restaurantes/catering.jpg",
    imageAlt: "Comida para eventos",
  },
  {
    id: "comida-casera",
    label: "Comida casera",
    hint: "Hecha en casa",
    href: "/clasificados/comida-local?foodType=comida-casera",
    imageAlt: "Comida casera",
    icon: FiHome,
  },
  {
    id: "mariscos",
    label: "Mariscos",
    hint: "Cocina del mar",
    href: "/clasificados/comida-local?foodType=mariscos",
    imageAlt: "Mariscos",
    icon: FiAnchor,
  },
  {
    id: "bebidas",
    label: "Bebidas",
    hint: "Aguas, jugos y más",
    href: "/clasificados/comida-local?foodType=bebidas",
    imageAlt: "Bebidas",
    icon: FiDroplet,
  },
];

export function ComidaLocalDiscoverySection() {
  return (
    <section className={LEONIX_LANDING_SECTION} aria-labelledby="comida-local-discovery-heading">
      <div className={LEONIX_LANDING_SECTION_PAD}>
        <h2
          id="comida-local-discovery-heading"
          className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl"
        >
          Explora por tipo de comida
        </h2>
        <p className="mt-1 text-xs text-[#5C5346]/90">
          Encuentra puestos, pop-ups y vendedores locales por lo que buscas.
        </p>
        <div className={LEONIX_IMAGE_DISCOVERY_GRID}>
          {COMIDA_LOCAL_DISCOVERY_ITEMS.map((item) => (
            <ImageDiscoveryCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
