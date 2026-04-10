"use client";

import Image from "next/image";
import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { EMPLEOS_EVENT_INFO_PATH } from "../../empleosLandingRoutes";
import { sampleJobFairEvent } from "../../data/empleosLandingSampleData";

type Props = {
  lang: Lang;
};

export function JobFairLandingBanner({ lang }: Props) {
  const ev = sampleJobFairEvent;
  const infoHref = appendLangToPath(EMPLEOS_EVENT_INFO_PATH, lang);

  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-[#2F3438] bg-[#2F3438] shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        <div className="relative min-h-[220px] sm:min-h-[240px] lg:min-h-[260px]">
          <Image src={ev.imageSrc} alt={ev.imageAlt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent lg:from-black/45" />
        </div>
        <div className="flex flex-col justify-center px-6 py-8 text-[#F5F2EC] lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B8C9D9]">
            {lang === "es" ? "Eventos" : "Events"}
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-tight">{ev.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#E6E2DC]/95">{ev.subtitle}</p>
          <ul className="mt-4 space-y-1.5 text-sm text-[#F5F2EC]/95">
            <li>
              <span className="font-semibold text-[#F0D78C]">{lang === "es" ? "Fecha: " : "Date: "}</span>
              {ev.dateLine}
            </li>
            <li>
              <span className="font-semibold text-[#F0D78C]">{lang === "es" ? "Horario: " : "Time: "}</span>
              {ev.timeLine}
            </li>
            <li>
              <span className="font-semibold text-[#F0D78C]">{lang === "es" ? "Lugar: " : "Venue: "}</span>
              {ev.venue}
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={infoHref}
              className="inline-flex min-h-11 min-w-[10rem] items-center justify-center rounded-xl bg-[#5B7C99] px-5 text-sm font-bold text-white shadow-lg transition hover:bg-[#4d6983] active:scale-[0.99]"
            >
              {lang === "es" ? "Más información" : "Learn more"}
            </Link>
            <Link href={infoHref} className="text-sm font-semibold text-[#B8C9D9] underline-offset-4 transition hover:text-white hover:underline">
              {lang === "es" ? "Ver todos los eventos →" : "See all events →"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
