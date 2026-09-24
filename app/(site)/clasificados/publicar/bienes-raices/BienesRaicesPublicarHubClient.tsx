"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BR_PUBLICAR_NEGOCIO_SELECTOR } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import type { BrAgentePricingLang } from "./shared/brAgenteApplicationPricingCopy";
import { getBienesRaicesCheckpointCards } from "../_lib/categoryPublishCheckpoints";
import { PublishEntryCheckpointLayout, PublishEntryCheckpointStack } from "../_components/PublishEntryCheckpoint";

const HUB_COPY = {
  es: {
    title: "Publicar en Bienes Raíces",
    body: "Dos caminos claros: particular (privado) o perfil profesional (negocio). Ambos pagan por publicación en este lanzamiento.",
  },
  en: {
    title: "Publish in Real Estate",
    body: "Two clear paths: individual (private) or professional profile (business). Both are paid per listing in this launch.",
  },
} as const;

type Props = {
  lang: BrAgentePricingLang;
};

export function BienesRaicesPublicarHubClient({ lang }: Props) {
  const searchParams = useSearchParams();
  const routeLang = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")).routeLang,
    [searchParams],
  );
  const hub = HUB_COPY[lang];
  const withLang = (path: string) => withClasificadosPublishLang(path, routeLang);

  const selectedPlan = searchParams?.get("plan") === "full" ? "full" : searchParams?.get("plan") === "quick" ? "quick" : null;
  const assistedCategory = searchParams?.get("staff") === "1" ? "bienes-raices" : undefined;
  const cards = useMemo(() => {
    const all = getBienesRaicesCheckpointCards(
      lang,
      withLang("/clasificados/publicar/bienes-raices/privado"),
      withLang(BR_PUBLICAR_NEGOCIO_SELECTOR),
    );
    return assistedCategory ? all.filter((card) => card.id !== "br_privado") : all;
  }, [lang, routeLang, assistedCategory]);

  return (
    <PublishEntryCheckpointLayout
      lang={lang}
      title={hub.title}
      body={hub.body}
      checkpointCategory="bienes-raices"
      selectedPlan={selectedPlan}
      launchBannerCards={cards}
    >
      <PublishEntryCheckpointStack cards={cards} lang={lang} assistedCategory={assistedCategory} />
    </PublishEntryCheckpointLayout>
  );
}
