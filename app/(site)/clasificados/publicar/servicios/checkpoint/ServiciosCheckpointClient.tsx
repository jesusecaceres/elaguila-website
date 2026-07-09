"use client";

import { useMemo, useState } from "react";
import type { SupportedLang } from "@/app/lib/language";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { getServiciosCheckpointCard } from "@/app/clasificados/publicar/_lib/categoryPublishCheckpoints";
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
  const [modalOpen, setModalOpen] = useState(false);
  const applicationHref = withClasificadosPublishLang("/publicar/servicios", routeLang, {
    product: "servicios_profesionales",
  });
  const clasificadosHref = withClasificadosPublishLang("/clasificados", routeLang);
  const card = useMemo(() => getServiciosCheckpointCard(lang, applicationHref), [lang, applicationHref]);

  return (
    <PublishEntryCheckpointLayout
      lang={lang}
      title={t.title}
      body={t.subtitle}
      backHref={clasificadosHref}
      backLabel={t.backToClasificados}
      checkpointCategory="servicios"
    >
      <PaidPublishCheckpointCard card={card} lang={lang} onMoreClick={() => setModalOpen(true)} />
      <PaidPublishCheckpointModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        card={card}
        lang={lang}
      />
    </PublishEntryCheckpointLayout>
  );
}
