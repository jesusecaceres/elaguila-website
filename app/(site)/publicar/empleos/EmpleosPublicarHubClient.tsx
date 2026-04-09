"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { EMPLEOS_PUBLISH_ROUTES } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";

const CARD =
  "flex flex-col rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm transition hover:border-[color:var(--lx-gold-border)]/50 hover:shadow-md sm:p-6";

export default function EmpleosPublicarHubClient() {
  const sp = useSearchParams();
  const lang: Lang = useMemo(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);

  const t =
    lang === "es"
      ? {
          title: "Publicar — Empleos",
          subtitle: "Elige el tipo de anuncio. Cada flujo abre el formulario y la vista previa del formato aprobado.",
          quick: { title: "Trabajo rápido", body: "Ideal para vacantes sencillas: pago, horario y contacto directo. Vista previa: empleo rápido." },
          premium: { title: "Trabajo premium", body: "Vacante completa con galería, requisitos y secciones de confianza. Vista previa: empleo premium." },
          feria: { title: "Feria de empleo", body: "Evento centrado en el flyer y datos del evento. Vista previa: feria." },
          cta: "Continuar",
        }
      : {
          title: "Post — Jobs",
          subtitle: "Choose a listing type. Each path opens the editor and preview for the approved shell.",
          quick: { title: "Quick job", body: "Simple roles with pay, schedule, and direct contact. Preview: quick job layout." },
          premium: { title: "Premium job", body: "Full posting with gallery, requirements, and trust blocks. Preview: premium layout." },
          feria: { title: "Job fair", body: "Flyer-first event details. Preview: job fair layout." },
          cta: "Continue",
        };

  const quickHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.quick, lang);
  const premiumHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.premium, lang);
  const feriaHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.feria, lang);

  return (
    <main className="min-h-screen bg-[color:var(--lx-page)] px-4 pb-20 pt-24 text-[color:var(--lx-text)]">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center sm:mb-12">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[color:var(--lx-text-2)] sm:text-base">{t.subtitle}</p>
        </header>

        <div className="grid gap-5 md:grid-cols-3">
          <Link href={quickHref} className={CARD}>
            <span className="text-lg font-bold">{t.quick.title}</span>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{t.quick.body}</p>
            <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[color:var(--lx-cta-dark)] px-4 text-xs font-bold text-[#FFFCF7]">
              {t.cta}
            </span>
          </Link>

          <Link href={premiumHref} className={CARD}>
            <span className="text-lg font-bold">{t.premium.title}</span>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{t.premium.body}</p>
            <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[color:var(--lx-cta-dark)] px-4 text-xs font-bold text-[#FFFCF7]">
              {t.cta}
            </span>
          </Link>

          <Link href={feriaHref} className={CARD}>
            <span className="text-lg font-bold">{t.feria.title}</span>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{t.feria.body}</p>
            <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[color:var(--lx-cta-dark)] px-4 text-xs font-bold text-[#FFFCF7]">
              {t.cta}
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
