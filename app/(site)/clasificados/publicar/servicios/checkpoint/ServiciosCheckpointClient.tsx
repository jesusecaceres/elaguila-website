"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SupportedLang } from "@/app/lib/language";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { getServiciosCheckpointCards } from "@/app/clasificados/publicar/_lib/categoryPublishCheckpoints";
import {
  PaidPublishCheckpointCard,
  PaidPublishCheckpointModal,
  PublishEntryCheckpointLayout,
} from "@/app/clasificados/publicar/_components/PublishEntryCheckpoint";

const COPY = {
  es: {
    title: "Publicar en Servicios",
    subtitle: "Presenta tu negocio de servicios con una ficha profesional.",
    backToClasificados: "← Volver a Clasificados",
  },
  en: {
    title: "Publish in Services",
    subtitle: "Present your service business with a professional profile.",
    backToClasificados: "← Back to Classifieds",
  },
} as const;

export function ServiciosCheckpointClient({
  lang,
  routeLang,
}: {
  lang: "es" | "en";
  routeLang: SupportedLang;
}) {
  const t = COPY[lang];
  const searchParams = useSearchParams();
  const selectedPlan = searchParams?.get("plan") === "full" ? "full" : searchParams?.get("plan") === "quick" ? "quick" : null;
  const assistedCategory = searchParams?.get("staff") === "1" ? "servicios" : undefined;
  const applicationHref = withClasificadosPublishLang("/publicar/servicios", routeLang, {
    product: "servicios_profesionales",
  });
  const clasificadosHref = withClasificadosPublishLang("/clasificados", routeLang);
  const cards = useMemo(() => getServiciosCheckpointCards(lang, applicationHref), [lang, applicationHref]);
  const quickCard = cards[0];
  const fullCard = cards[1] ?? cards[0];
  const [quickMoreOpen, setQuickMoreOpen] = useState(false);
  const [fullMoreOpen, setFullMoreOpen] = useState(false);

  return (
    <PublishEntryCheckpointLayout
      lang={lang}
      title={t.title}
      body={t.subtitle}
      backHref={clasificadosHref}
      backLabel={t.backToClasificados}
      checkpointCategory="servicios"
      selectedPlan={selectedPlan}
    >
      {quickCard ? (
        <PaidPublishCheckpointCard
          key={quickCard.id}
          card={quickCard}
          lang={lang}
          onMoreClick={() => setQuickMoreOpen(true)}
          assistedCategory={assistedCategory}
        />
      ) : null}
      {fullCard && fullCard.id !== quickCard?.id ? (
        <PaidPublishCheckpointCard
          key={fullCard.id}
          card={fullCard}
          lang={lang}
          onMoreClick={() => setFullMoreOpen(true)}
          assistedCategory={assistedCategory}
        />
      ) : null}
      {quickCard ? (
        <PaidPublishCheckpointModal
          open={quickMoreOpen}
          onClose={() => setQuickMoreOpen(false)}
          card={quickCard}
          lang={lang}
        />
      ) : null}
      {fullCard && fullCard.id !== quickCard?.id ? (
        <PaidPublishCheckpointModal
          open={fullMoreOpen}
          onClose={() => setFullMoreOpen(false)}
          card={fullCard}
          lang={lang}
        />
      ) : null}
    </PublishEntryCheckpointLayout>
  );
}
