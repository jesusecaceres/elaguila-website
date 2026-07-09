"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FiBriefcase, FiCalendar, FiCheckCircle } from "react-icons/fi";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { LEONIX_CATEGORY_VISUALS } from "@/app/clasificados/config/categoryVisuals";
import { appendLangToPath, resolveRouteLang } from "@/app/clasificados/lib/hubUrl";
import { navCopyLang } from "@/app/lib/language";
import { EMPLEOS_PUBLISH_ROUTES } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import {
  getEmpleosFreeCheckpointCard,
  getEmpleosPaidCheckpointCard,
} from "@/app/clasificados/publicar/_lib/categoryPublishCheckpoints";
import { PublishEntryCheckpointLayout, PublishEntryCheckpointStack } from "@/app/clasificados/publicar/_components/PublishEntryCheckpoint";
import { LeonixLaunchCouponCard } from "@/app/components/leonix/LeonixLaunchCouponCard";

const CARD_SITE =
  "group flex h-full flex-col rounded-[20px] border bg-[#FFFCF7] p-5 shadow-[0_16px_42px_rgba(42,40,38,0.08)] ring-1 transition hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(42,40,38,0.12)] sm:p-6";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type EmpleosPublicarHubVariant = "default" | "clasificadosPublicar";

type Props = {
  /**
   * `clasificadosPublicar` — entry from `/clasificados/publicar/empleos` (chooser → category-owned hub).
   * `default` — standalone `/publicar/empleos` hub (same lanes).
   */
  variant?: EmpleosPublicarHubVariant;
};

export default function EmpleosPublicarHubClient({ variant = "default" }: Props) {
  const sp = useSearchParams();
  const routeLang = useMemo(() => resolveRouteLang(sp?.get("lang")), [sp]);
  const lang: Lang = useMemo(() => navCopyLang(routeLang), [routeLang]);

  const t =
    lang === "es"
      ? {
          title: "Publicar empleo",
          subtitle: "Elige cómo quieres anunciar una oportunidad laboral en Leonix.",
          job: {
            title: "Publicar empleo",
            price: "$24.99 por 30 días",
            body: "Anuncia un puesto local con fotos, videos y contacto directo.",
            cta: "Publicar empleo",
          },
          fair: {
            title: "Publicar feria de empleo",
            price: "Gratis",
            body: "Comparte una feria, reclutamiento comunitario o evento de contratación.",
            cta: "Publicar feria gratis",
          },
          trust: ["Vista previa antes de publicar", "Fotos y hasta 4 videos para empleo", "Contacto directo"],
          backCategories: "Volver a categorías",
          myListings: "Mis empleos",
        }
      : {
          title: "Post a job",
          subtitle: "Choose how you want to share a hiring opportunity on Leonix.",
          job: {
            title: "Post a job",
            price: "$24.99 for 30 days",
            body: "Advertise one local position with photos, videos, and direct contact.",
            cta: "Post a job",
          },
          fair: {
            title: "Post a job fair",
            price: "Free",
            body: "Share a hiring fair, community recruiting event, or hiring event.",
            cta: "Post free job fair",
          },
          trust: ["Preview before publishing", "Photos and up to 4 videos for job ads", "Direct contact"],
          backCategories: "Back to categories",
          myListings: "My jobs",
        };

  const quickHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.quick, routeLang);
  const feriaHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.feria, routeLang);

  const empleosCheckpointCards = useMemo(
    () => [
      getEmpleosPaidCheckpointCard(lang, quickHref),
      getEmpleosFreeCheckpointCard(lang, feriaHref),
    ],
    [lang, quickHref, feriaHref],
  );

  const visual = LEONIX_CATEGORY_VISUALS.empleos;
  const CARD_CLASIFICADOS = (extra: string) =>
    cx(
      "group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br px-4 py-4 transition-all duration-150",
      "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/35",
      visual.tint,
      visual.border,
      visual.glow,
      extra
    );

  const gridDefault = (
    <div className="grid gap-5 md:grid-cols-2">
      <Link href={quickHref} className={`${CARD_SITE} border-[#C9A85A]/50 ring-[#C9A85A]/15`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex w-fit rounded-full border border-[#C9A85A]/45 bg-[#FFF6E2] px-3 py-1 text-xs font-extrabold text-[#6B5320]">{t.job.price}</span>
          <LeonixLaunchCouponCard lang={lang} variant="badge" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4A1F24] text-[#FFFCF7] shadow-sm">
            <FiBriefcase className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="text-xl font-extrabold text-[#2A2826]">{t.job.title}</h2>
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{t.job.body}</p>
        <span className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#4A1F24] px-4 text-sm font-bold text-[#FFFCF7] transition group-hover:bg-[#36161A]">
          {t.job.cta}
        </span>
      </Link>
      <Link href={feriaHref} className={`${CARD_SITE} border-[#2E7D4A]/30 ring-[#2E7D4A]/10`}>
        <span className="inline-flex w-fit rounded-full border border-[#2E7D4A]/30 bg-[#E8F5EE] px-3 py-1 text-xs font-extrabold text-[#1E4D33]">{t.fair.price}</span>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1F6B45] text-[#FFFCF7] shadow-sm">
            <FiCalendar className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="text-xl font-extrabold text-[#2A2826]">{t.fair.title}</h2>
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{t.fair.body}</p>
        <span className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#1F6B45] px-4 text-sm font-bold text-[#FFFCF7] transition group-hover:bg-[#185538]">
          {t.fair.cta}
        </span>
      </Link>
    </div>
  );

  const gridClasificados = (
    <div className="grid gap-5 lg:grid-cols-2">
      <Link href={quickHref} className={CARD_CLASIFICADOS("min-h-[260px] border-[#C9A85A]/55")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold text-[#3D2C12] ${visual.chipBg}`}>
            {t.job.price}
          </span>
          <LeonixLaunchCouponCard lang={lang} variant="badge" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4A1F24] text-[#FFFCF7]">
            <FiBriefcase className="h-5 w-5 shrink-0" aria-hidden />
          </span>
          <span className="text-xl font-bold text-[#3D2C12]">{t.job.title}</span>
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[#5D4A25]/90">{t.job.body}</p>
        <span className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#4A1F24] px-5 text-sm font-bold text-[#FFFCF7] sm:w-fit">
          {t.job.cta}
        </span>
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-white/20" />
      </Link>
      <Link href={feriaHref} className={CARD_CLASIFICADOS("min-h-[260px] border-[#2E7D4A]/35 bg-gradient-to-br from-[#F5FFF8] via-[#FFFCF7] to-[#FFF6E7]")}>
        <span className="inline-flex w-fit items-center rounded-full border border-[#2E7D4A]/30 bg-[#E8F5EE] px-2.5 py-1 text-[11px] font-extrabold text-[#1E4D33]">
          {t.fair.price}
        </span>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1F6B45] text-[#FFFCF7]">
            <FiCalendar className="h-5 w-5 shrink-0" aria-hidden />
          </span>
          <span className="text-xl font-bold text-[#3D2C12]">{t.fair.title}</span>
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[#5D4A25]/90">{t.fair.body}</p>
        <span className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1F6B45] px-5 text-sm font-bold text-[#FFFCF7] sm:w-fit">
          {t.fair.cta}
        </span>
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-white/20" />
      </Link>
    </div>
  );

  const grid = variant === "clasificadosPublicar" ? gridClasificados : gridDefault;

  if (variant === "clasificadosPublicar") {
    return (
      <PublishEntryCheckpointLayout
        lang={lang}
        title={t.title}
        body={t.subtitle}
        backHref={appendLangToPath("/clasificados/publicar", routeLang)}
        backLabel={t.backCategories}
      >
        <PublishEntryCheckpointStack cards={empleosCheckpointCards} lang={lang} />
        <ul className="mt-6 grid gap-2 text-sm font-semibold text-[#4D3A19] sm:grid-cols-3">
          {t.trust.map((line) => (
            <li key={line} className="flex items-center gap-2">
              <FiCheckCircle className="h-4 w-4 shrink-0 text-[#2E7D4A]" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </PublishEntryCheckpointLayout>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] px-4 pb-20 pt-24 text-[color:var(--lx-text)]">
      <div className="mx-auto min-w-0 max-w-4xl">
        <header className="mb-10 text-center sm:mb-12">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[color:var(--lx-text-2)] sm:text-base">{t.subtitle}</p>
          <div className="mt-4">
            <Link
              href={appendLangToPath("/dashboard/empleos", lang)}
              className="text-sm font-semibold text-[color:var(--lx-text)] underline underline-offset-2"
            >
              {t.myListings}
            </Link>
          </div>
        </header>
        {grid}
        <ul className="mx-auto mt-6 grid max-w-3xl gap-2 text-sm font-semibold text-[color:var(--lx-text-2)] sm:grid-cols-3">
          {t.trust.map((line) => (
            <li key={line} className="flex items-center justify-center gap-2 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2 text-center">
              <FiCheckCircle className="h-4 w-4 shrink-0 text-[#2E7D4A]" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
