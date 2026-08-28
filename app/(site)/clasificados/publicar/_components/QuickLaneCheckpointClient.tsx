"use client";

/**
 * Globalization Package A Gate 2 — shared checkpoint client for the seven lanes that
 * previously had no checkpoint before their application (P3 Gate 6 "NOT YET BUILT"):
 * Busco, Clases, Comunidad, Mascotas y Perdidos, En Venta, Comida Local, and Viajes.
 *
 * One client, category-keyed — same shell (`PublishEntryCheckpointLayout` + Stack) and the
 * same card config source (`categoryPublishCheckpoints.ts`) the paid categories already use.
 * The Launch coupon banner only renders when a paid-style card exists (Viajes negocios), so
 * free-only lanes never show promo copy that does not apply to them.
 */

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import {
  getBuscoCheckpointCard,
  getClasesCheckpointCard,
  getComidaLocalCheckpointCard,
  getComunidadCheckpointCard,
  getEnVentaCheckpointCard,
  getMascotasCheckpointCard,
  getViajesCheckpointCards,
  type PublishCheckpointCardData,
} from "../_lib/categoryPublishCheckpoints";
import type { PublishCheckpointLang } from "../_lib/publishCheckpointCopy";
import { PublishEntryCheckpointLayout, PublishEntryCheckpointStack } from "./PublishEntryCheckpoint";

export type QuickLaneCheckpointCategory =
  | "busco"
  | "clases"
  | "comunidad"
  | "mascotas-y-perdidos"
  | "en-venta"
  | "comida-local"
  | "viajes";

const PAGE_COPY: Record<QuickLaneCheckpointCategory, { es: { title: string; body: string }; en: { title: string; body: string } }> = {
  busco: {
    es: { title: "Publicar en Busco / Se Busca", body: "Así funciona tu publicación gratuita antes de empezar." },
    en: { title: "Publish in Busco / Wanted", body: "How your free publication works before you start." },
  },
  clases: {
    es: { title: "Publicar en Clases", body: "Así funciona tu publicación gratuita antes de empezar." },
    en: { title: "Publish in Classes", body: "How your free publication works before you start." },
  },
  comunidad: {
    es: { title: "Publicar en Comunidad y Eventos", body: "Así funciona tu publicación gratuita antes de empezar." },
    en: { title: "Publish in Community & Events", body: "How your free publication works before you start." },
  },
  "mascotas-y-perdidos": {
    es: { title: "Publicar en Mascotas y Perdidos", body: "Así funciona tu publicación gratuita antes de empezar." },
    en: { title: "Publish in Pets & Lost", body: "How your free publication works before you start." },
  },
  "en-venta": {
    es: { title: "Publicar en En Venta / Varios", body: "Así funciona tu publicación gratuita antes de empezar." },
    en: { title: "Publish in For Sale / Misc", body: "How your free publication works before you start." },
  },
  "comida-local": {
    es: { title: "Publicar en Comida Local", body: "Así funciona tu publicación antes de empezar." },
    en: { title: "Publish in Local Food", body: "How your listing works before you start." },
  },
  viajes: {
    es: { title: "Publicar en Viajes", body: "Elige cómo quieres publicar tu viaje u oferta en Leonix." },
    en: { title: "Publish in Travel", body: "Choose how you want to publish your trip or offer on Leonix." },
  },
};

function buildCards(
  category: QuickLaneCheckpointCategory,
  lang: PublishCheckpointLang,
  withLang: (path: string) => string,
): PublishCheckpointCardData[] {
  switch (category) {
    case "busco":
      return [getBuscoCheckpointCard(lang, withLang("/publicar/busco/quick"))];
    case "clases":
      return [getClasesCheckpointCard(lang, withLang("/publicar/clases/quick"))];
    case "comunidad":
      return [getComunidadCheckpointCard(lang, withLang("/publicar/comunidad/quick"))];
    case "mascotas-y-perdidos":
      return [getMascotasCheckpointCard(lang, withLang("/publicar/mascotas-y-perdidos/quick"))];
    case "en-venta":
      // The active canonical En Venta lane (registry `en_venta` adapter applicationRoute).
      return [getEnVentaCheckpointCard(lang, withLang("/clasificados/publicar/en-venta/pro"))];
    case "comida-local":
      return [getComidaLocalCheckpointCard(lang, withLang("/publicar/comida-local"))];
    case "viajes":
      return getViajesCheckpointCards(
        lang,
        withLang("/publicar/viajes/negocios"),
        withLang("/publicar/viajes/privado"),
      );
  }
}

export function QuickLaneCheckpointClient({
  lang,
  category,
}: {
  lang: PublishCheckpointLang;
  category: QuickLaneCheckpointCategory;
}) {
  const searchParams = useSearchParams();
  const routeLang = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")).routeLang,
    [searchParams],
  );
  const withLang = (path: string) => withClasificadosPublishLang(path, routeLang);
  const copy = PAGE_COPY[category][lang === "es" ? "es" : "en"];
  const cards = useMemo(() => buildCards(category, lang, withLang), [category, lang, routeLang]);
  // Gate 2D — owner-QA debt: Comunidad/Clases card faces lean out (full copy stays in "Ver más").
  // Gate 3 — Mascotas gets the same treatment. Every other lane (Busco, En Venta, Comida Local,
  // Viajes) keeps its exact prior layout.
  const compact = category === "comunidad" || category === "clases" || category === "mascotas-y-perdidos";

  return (
    <PublishEntryCheckpointLayout
      lang={lang}
      title={copy.title}
      body={copy.body}
      checkpointCategory={category}
      launchBannerCards={cards}
    >
      <PublishEntryCheckpointStack cards={cards} lang={lang} compact={compact} />
    </PublishEntryCheckpointLayout>
  );
}
