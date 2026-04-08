"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FiArrowRight, FiBriefcase, FiLayers } from "react-icons/fi";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

const CARD =
  "group flex h-full flex-col rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] transition hover:border-[color:var(--lx-gold-border)] hover:shadow-[0_12px_36px_-14px_rgba(42,36,22,0.14)] sm:p-6";

export function PublicarViajesBranchClient() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  useEffect(() => {
    document.title = lang === "en" ? "Publish · Leonix Viajes" : "Publicar · Leonix Viajes";
  }, [lang]);

  const hubHref = appendLangToPath("/clasificados/publicar", lang);
  const negociosHref = appendLangToPath("/publicar/viajes/negocios", lang);
  const viajesHref = appendLangToPath("/clasificados/viajes", lang);

  const copy =
    lang === "en"
      ? {
          kicker: "Leonix Classifieds",
          title: "Publish a Viajes listing",
          intro:
            "Choose how you want to appear. Business listings are built for agencies and operators; partner paths will open when ready.",
          back: "Back to publishing hub",
          negociosTitle: "Businesses & agencies",
          negociosBody: "Structured application aligned with the public Viajes card — title, destination, inclusions, media and contact.",
          negociosCta: "Open business application",
          soonTitle: "Partners & internal",
          soonBody: "Reserved for verified partners and future Leonix Viajes programs. Not open for self-serve yet.",
          soonCta: "Coming soon",
          foot: "Questions? Start from the Viajes destination and explore how listings look live.",
        }
      : {
          kicker: "Leonix Clasificados",
          title: "Publica una oferta de viajes",
          intro:
            "Elige cómo quieres aparecer. La vía de negocios está pensada para agencias y operadores; las rutas de socios se abrirán cuando estén listas.",
          back: "Volver al hub de publicar",
          negociosTitle: "Negocios y agencias",
          negociosBody:
            "Solicitud estructurada alineada con la ficha pública de Viajes: título, destino, inclusiones, multimedia y contacto.",
          negociosCta: "Abrir solicitud para negocios",
          soonTitle: "Socios e interno",
          soonBody: "Espacio reservado para socios verificados y futuros programas Leonix de viajes. Aún sin autoservicio.",
          soonCta: "Próximamente",
          foot: "¿Dudas? Entra a la página de Viajes y revisa cómo se ven las fichas en vivo.",
        };

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-16 pt-6 text-[color:var(--lx-text)] sm:pb-20 sm:pt-8"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage: "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.16), transparent 55%)",
      }}
    >
      <Navbar />
      <div className="mx-auto w-full min-w-0 max-w-3xl px-4 sm:px-6">
        <nav className="text-xs font-semibold text-[color:var(--lx-muted)]">
          <Link
            href={hubHref}
            className="text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 transition hover:text-[color:var(--lx-gold)]"
          >
            {copy.back}
          </Link>
        </nav>

        <header className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">{copy.kicker}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl md:text-4xl">{copy.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-base">{copy.intro}</p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <Link href={negociosHref} className={CARD}>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-gold)]">
              <FiBriefcase className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[color:var(--lx-text)]">{copy.negociosTitle}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{copy.negociosBody}</p>
            <span className="mt-6 inline-flex min-h-[48px] items-center gap-2 text-sm font-bold text-[#D97706] group-hover:underline">
              {copy.negociosCta}
              <FiArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>

          <div className={`${CARD} cursor-not-allowed opacity-60`} aria-disabled="true">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-muted)]">
              <FiLayers className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[color:var(--lx-text)]">{copy.soonTitle}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{copy.soonBody}</p>
            <span className="mt-6 inline-flex min-h-[48px] items-center gap-2 text-sm font-bold text-[color:var(--lx-muted)]">{copy.soonCta}</span>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-[color:var(--lx-muted)]">
          <Link href={viajesHref} className="font-semibold text-[color:var(--lx-text)] underline-offset-4 hover:underline">
            Ver Viajes en Clasificados
          </Link>
          {" · "}
          {copy.foot}
        </p>
      </div>
    </div>
  );
}
