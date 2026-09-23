"use client";

import { useMemo, useState } from "react";
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
  const applicationHref = withClasificadosPublishLang("/publicar/servicios", routeLang, {
    product: "servicios_profesionales",
  });
  const clasificadosHref = withClasificadosPublishLang("/clasificados", routeLang);
  const cards = useMemo(() => getServiciosCheckpointCards(lang, applicationHref), [lang, applicationHref]);
  const [modalId, setModalId] = useState<string | null>(null);
  const modalCard = cards.find((card) => card.id === modalId) ?? cards[0];

  return (
    <PublishEntryCheckpointLayout
      lang={lang}
      title={t.title}
      body={t.subtitle}
      backHref={clasificadosHref}
      backLabel={t.backToClasificados}
      checkpointCategory="servicios"
    >
      {cards.map((card) => (
        <PaidPublishCheckpointCard key={card.id} card={card} lang={lang} onMoreClick={() => setModalId(card.id)} />
      ))}
      <PaidPublishCheckpointModal
        open={Boolean(modalId)}
        onClose={() => setModalId(null)}
        card={modalCard}
        lang={lang}
      />
    </PublishEntryCheckpointLayout>
  );
}
