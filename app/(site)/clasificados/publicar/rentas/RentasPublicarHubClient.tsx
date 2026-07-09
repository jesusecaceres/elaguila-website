"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import { RENTAS_PUBLICAR_NEGOCIO } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import {
  getRentasNegocioCheckpointCard,
  getRentasPrivadoCheckpointCard,
} from "../_lib/categoryPublishCheckpoints";
import { PublishEntryCheckpointLayout, PublishEntryCheckpointStack } from "../_components/PublishEntryCheckpoint";

const HUB_COPY = {
  es: {
    title: "Publicar en Rentas",
    body: "Elige cómo quieres publicar una renta en Leonix.",
  },
  en: {
    title: "Publish in Rentas",
    body: "Choose how you want to publish a rental on Leonix.",
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

  const cards = useMemo(
    () => [
      getRentasPrivadoCheckpointCard(lang, withLang("/clasificados/publicar/rentas/privado")),
      getRentasNegocioCheckpointCard(lang, withLang(RENTAS_PUBLICAR_NEGOCIO)),
    ],
    [lang, routeLang],
  );

  return (
    <PublishEntryCheckpointLayout
      lang={lang}
      title={hub.title}
      body={hub.body}
      checkpointCategory="rentas"
      launchBannerCards={cards}
    >
      <PublishEntryCheckpointStack cards={cards} lang={lang} />
    </PublishEntryCheckpointLayout>
  );
}
