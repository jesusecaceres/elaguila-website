"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import { getRestaurantesCheckpointCards } from "../_lib/categoryPublishCheckpoints";
import { PublishEntryCheckpointLayout, PublishEntryCheckpointStack } from "../_components/PublishEntryCheckpoint";

type CopyType = {
  title: string;
  body: string;
};

type Lang = "es" | "en";

export function RestaurantesSelectorClient({
  t,
  lang,
}: {
  t: CopyType;
  lang: Lang;
}) {
  const searchParams = useSearchParams();
  const routeLang = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")).routeLang,
    [searchParams],
  );

  const withLang = (path: string, extra?: Record<string, string>) =>
    withClasificadosPublishLang(path, routeLang, extra);

  const cards = useMemo(() => getRestaurantesCheckpointCards(lang, withLang), [lang, routeLang]);
  const selectedPlan = searchParams?.get("plan") === "full" ? "full" : searchParams?.get("plan") === "quick" ? "quick" : null;
  const assistedCategory = searchParams?.get("staff") === "1" ? "restaurantes" : undefined;

  return (
    <PublishEntryCheckpointLayout
      lang={lang}
      title={t.title}
      body={t.body}
      checkpointCategory="restaurantes"
      selectedPlan={selectedPlan}
      launchBannerCards={cards}
    >
      <PublishEntryCheckpointStack cards={cards} lang={lang} assistedCategory={assistedCategory} />
    </PublishEntryCheckpointLayout>
  );
}
