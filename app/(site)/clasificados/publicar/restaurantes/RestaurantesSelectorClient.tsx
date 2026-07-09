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

  return (
    <PublishEntryCheckpointLayout lang={lang} title={t.title} body={t.body}>
      <PublishEntryCheckpointStack cards={cards} lang={lang} />
    </PublishEntryCheckpointLayout>
  );
}
