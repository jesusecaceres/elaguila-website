"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FiBriefcase } from "react-icons/fi";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { LEONIX_CATEGORY_VISUALS } from "@/app/clasificados/config/categoryVisuals";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { EMPLEOS_PUBLISH_ROUTES } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";

const CARD_SITE =
  "flex flex-col rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm transition hover:border-[color:var(--lx-gold-border)]/50 hover:shadow-md sm:p-6";

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
  const lang: Lang = useMemo(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const otherLang: Lang = lang === "es" ? "en" : "es";
  const qsToggle = new URLSearchParams(sp?.toString() ?? "");
  qsToggle.set("lang", otherLang);
  const toggleHref =
    variant === "clasificadosPublicar"
      ? `/clasificados/publicar/empleos?${qsToggle.toString()}`
      : `/publicar/empleos?${qsToggle.toString()}`;

  const t =
    lang === "es"
      ? {
          title: "Publicar — Empleos",
          subtitle: "Elige el tipo de anuncio. Cada flujo abre el formulario y la vista previa del formato aprobado.",
          quick: { title: "Trabajo rápido", body: "Ideal para vacantes sencillas: pago, horario y contacto directo. Vista previa: empleo rápido." },
          premium: { title: "Trabajo premium", body: "Vacante completa con galería, requisitos y secciones de confianza. Vista previa: empleo premium." },
          feria: { title: "Feria de empleo", body: "Evento centrado en el flyer y datos del evento. Vista previa: feria." },
          cta: "Continuar",
          backCategories: "Volver a categorías",
          langToggle: "English",
          myListings: "Mis vacantes (demo local)",
        }
      : {
          title: "Post — Jobs",
          subtitle: "Choose a listing type. Each path opens the editor and preview for the approved shell.",
          quick: { title: "Quick job", body: "Simple roles with pay, schedule, and direct contact. Preview: quick job layout." },
          premium: { title: "Premium job", body: "Full posting with gallery, requirements, and trust blocks. Preview: premium layout." },
          feria: { title: "Job fair", body: "Flyer-first event details. Preview: job fair layout." },
          cta: "Continue",
          backCategories: "Back to categories",
          langToggle: "Español",
          myListings: "My job listings (local demo)",
        };

  const quickHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.quick, lang);
  const premiumHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.premium, lang);
  const feriaHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.feria, lang);

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

  const lanesClasificados = [
    { href: quickHref, title: t.quick.title, body: t.quick.body },
    { href: premiumHref, title: t.premium.title, body: t.premium.body },
    { href: feriaHref, title: t.feria.title, body: t.feria.body },
  ];

  const gridDefault = (
    <div className="grid gap-5 md:grid-cols-3">
      {lanesClasificados.map((lane) => (
        <Link key={lane.href} href={lane.href} className={CARD_SITE}>
          <span className="text-lg font-bold">{lane.title}</span>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{lane.body}</p>
          <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[color:var(--lx-cta-dark)] px-4 text-xs font-bold text-[#FFFCF7]">
            {t.cta}
          </span>
        </Link>
      ))}
    </div>
  );

  const gridClasificados = (
    <div className="grid gap-5 md:grid-cols-3">
      {lanesClasificados.map((lane) => (
        <Link key={lane.href} href={lane.href} className={CARD_CLASIFICADOS("min-h-[200px]")}>
          <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#3D2C12] ${visual.chipBg}`}>
            {visual.emoji}
          </span>
          <div className="mt-2 flex items-center gap-2">
            <FiBriefcase className="h-5 w-5 shrink-0 text-[#5D4A25]" aria-hidden />
            <span className="text-lg font-bold text-[#3D2C12]">{lane.title}</span>
          </div>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[#5D4A25]/90">{lane.body}</p>
          <span className="mt-4 text-xs font-medium text-[#5D4A25]/80">{t.cta}</span>
          <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-white/20" />
        </Link>
      ))}
    </div>
  );

  const grid = variant === "clasificadosPublicar" ? gridClasificados : gridDefault;

  if (variant === "clasificadosPublicar") {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#F6F0E2] text-[#3D2C12] pb-16 pt-28">
        <div className="mx-auto max-w-6xl min-w-0 px-4 sm:px-6">
          <section className="rounded-3xl border border-[#D8C79A]/70 bg-[#FFFDF7] p-6 shadow-[0_18px_48px_rgba(113,84,22,0.10)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#3D2C12] sm:text-4xl">{t.title}</h1>
                <p className="mt-2 max-w-2xl text-base text-[#5D4A25]/85 sm:text-lg">{t.subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start rounded-xl border border-[#D8C79A]/65 bg-[#FFF6E7] p-1.5 shadow-sm">
                <Link
                  href={toggleHref}
                  className="rounded-lg border border-[#D8C79A]/70 bg-[#FFFCF4] px-4 py-2 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF0DA]"
                >
                  {t.langToggle}
                </Link>
                <Link
                  href={`/clasificados/publicar?lang=${lang}`}
                  className="rounded-lg border border-[#B28A2F]/45 bg-[#B28A2F]/12 px-4 py-2 text-sm font-semibold text-[#6E4E18] hover:bg-[#B28A2F]/20"
                >
                  {t.backCategories}
                </Link>
                <Link
                  href={appendLangToPath("/dashboard/empleos/staged", lang)}
                  className="rounded-lg border border-[#2A6B4A]/35 bg-[#E8F5EE] px-4 py-2 text-sm font-semibold text-[#1E4D33] hover:bg-[#d4ecdf]"
                >
                  {t.myListings}
                </Link>
              </div>
            </div>
            <div className="mt-8">{grid}</div>
          </section>
        </div>
      </main>
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
              href={appendLangToPath("/dashboard/empleos/staged", lang)}
              className="text-sm font-semibold text-[color:var(--lx-text)] underline underline-offset-2"
            >
              {t.myListings}
            </Link>
          </div>
        </header>
        {grid}
      </div>
    </main>
  );
}
