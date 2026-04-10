"use client";

import { FaComments, FaMapMarkedAlt, FaSearch, FaShieldAlt } from "react-icons/fa";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

type Props = {
  lang: Lang;
};

const items = {
  es: [
    {
      title: "Oportunidades locales",
      body: "Empleos cerca de tu ciudad y comunidades donde vives y te mueves.",
      Icon: FaMapMarkedAlt,
    },
    {
      title: "Publicaciones verificadas",
      body: "Conéctate con empleadores confiables y ofertas revisadas con criterios claros.",
      Icon: FaShieldAlt,
    },
    {
      title: "Búsqueda rápida y clara",
      body: "Encuentra lo que buscas con filtros que se entienden a la primera.",
      Icon: FaSearch,
    },
    {
      title: "Conexión directa",
      body: "Aplica con claridad y habla directamente con el proceso que marca cada vacante.",
      Icon: FaComments,
    },
  ],
  en: [
    {
      title: "Local opportunities",
      body: "Jobs near your city and the communities where you live and commute.",
      Icon: FaMapMarkedAlt,
    },
    {
      title: "Trusted listings",
      body: "Connect with reliable employers and listings reviewed with clear standards.",
      Icon: FaShieldAlt,
    },
    {
      title: "Fast, clear search",
      body: "Find what you need with filters that make sense the first time.",
      Icon: FaSearch,
    },
    {
      title: "Direct connection",
      body: "Apply with clarity and follow each posting’s stated process.",
      Icon: FaComments,
    },
  ],
} as const;

export function TrustSignalsRow({ lang }: Props) {
  const list = items[lang];
  return (
    <section className="rounded-[1.35rem] border border-[#E8DFD0] bg-white/90 px-4 py-8 shadow-[0_12px_36px_rgba(42,40,38,0.06)] sm:px-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {list.map(({ title, body, Icon }) => (
          <div key={title} className="flex gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF3DC] to-[#E8C56A]/80 text-[#5C4A32] shadow-inner">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#2A2826]">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#4A4744]/95">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
