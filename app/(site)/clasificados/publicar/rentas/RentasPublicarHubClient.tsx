"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import { RENTAS_PUBLICAR_NEGOCIO } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { getRentasPrivadoCheckpointCard } from "../_lib/categoryPublishCheckpoints";
import { PublishEntryCheckpointLayout, PublishEntryCheckpointStack } from "../_components/PublishEntryCheckpoint";
import type { PublishCheckpointCardData } from "../_lib/categoryPublishCheckpoints";

const HUB_COPY = {
  es: {
    title: "Publicar en Rentas",
    body: "Elige cómo quieres publicar una renta en Leonix.",
    negocioEyebrow: "Negocio",
    negocioTitle: "Rentas negocio",
    negocioBody: "Perfil comercial para administradores o negocios con múltiples propiedades.",
    negocioCta: "Publicar como negocio",
    negocioMore: "Ver más",
    negocioModalTitle: "Rentas negocio",
    negocioModalIntro: "Flujo de perfil comercial. Revisa precios y alcance en la aplicación.",
  },
  en: {
    title: "Publish in Rentas",
    body: "Choose how you want to publish a rental on Leonix.",
    negocioEyebrow: "Business",
    negocioTitle: "Rentas business",
    negocioBody: "Business profile for property managers or businesses with multiple rentals.",
    negocioCta: "Publish as business",
    negocioMore: "See more",
    negocioModalTitle: "Rentas business",
    negocioModalIntro: "Business profile flow. Review pricing and scope in the application.",
  },
} as const;

type Lang = keyof typeof HUB_COPY;

export function RentasPublicarHubClient({ lang }: { lang: Lang }) {
  const searchParams = useSearchParams();
  const routeLang = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")).routeLang,
    [searchParams],
  );
  const hub = HUB_COPY[lang];
  const withLang = (path: string) => withClasificadosPublishLang(path, routeLang);

  const cards = useMemo(() => {
    const privado = getRentasPrivadoCheckpointCard(lang, withLang("/clasificados/publicar/rentas/privado"));
    const negocio: PublishCheckpointCardData = {
      id: "rentas_negocio",
      variant: "dealer",
      eyebrow: hub.negocioEyebrow,
      title: hub.negocioTitle,
      priceLabel: lang === "es" ? "Ver en aplicación" : "See in application",
      shortDescription: hub.negocioBody,
      ctaLabel: hub.negocioCta,
      ctaHref: withLang(RENTAS_PUBLICAR_NEGOCIO),
      moreLabel: hub.negocioMore,
      modalTitle: hub.negocioModalTitle,
      modalIntro: hub.negocioModalIntro,
      includedBullets:
        lang === "es"
          ? ["Perfil comercial", "Múltiples propiedades", "Precio definido en flujo de aplicación"]
          : ["Business profile", "Multiple properties", "Pricing defined in application flow"],
      couponEligible: false,
      highlighted: true,
    };
    return [privado, negocio];
  }, [lang, routeLang, hub]);

  return (
    <PublishEntryCheckpointLayout lang={lang} title={hub.title} body={hub.body}>
      <PublishEntryCheckpointStack cards={cards} lang={lang} />
    </PublishEntryCheckpointLayout>
  );
}
