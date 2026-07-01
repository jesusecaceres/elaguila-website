import Link from "next/link";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { visibilityContactHref } from "@/app/(site)/clasificados/components/categoryStandard/CategoryVisibilityCta";
import {
  RENTAS_LANDING_SECTION,
  RENTAS_LANDING_SECTION_PAD,
} from "../shared/rentasLeonixPublicUi";

/** Rentas-only visibility strip — same monetization route, landing-aligned styling. */
export function RentasLandingVisibilityStrip({ lang }: { lang: Lang }) {
  const isEs = lang === "es";
  const href = visibilityContactHref(lang, "rentas", "landing");
  const title = isEs ? "Haz que tu anuncio tenga más visibilidad" : "Give your listing more visibility";
  const body = isEs
    ? "Opciones de revista, digital y destacados se revisan con Leonix. Nada aparece como Destacado sin un paquete activo."
    : "Print, digital, and featured options are reviewed with Leonix. Nothing is marked Featured without an active package.";
  const label = isEs ? "Conocer opciones de visibilidad" : "Explore visibility options";

  return (
    <aside
      className={`${RENTAS_LANDING_SECTION} relative overflow-hidden`}
      aria-label={label}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(201,168,74,0.08)_0%,rgba(255,253,247,0.95)_55%,rgba(85,107,62,0.06)_100%)]"
        aria-hidden
      />
      <div className={`${RENTAS_LANDING_SECTION_PAD} relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]">
            {isEs ? "Visibilidad print + digital" : "Print + digital visibility"}
          </p>
          <p className="mt-1 font-serif text-sm font-bold leading-snug text-[#2A4536] sm:text-base">{title}</p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#5C5346]">{body}</p>
        </div>
        <Link
          href={href}
          className="inline-flex min-h-[2.5rem] shrink-0 items-center justify-center rounded-lg border border-[#7A1E2C]/35 bg-[#7A1E2C] px-4 text-center text-xs font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:min-w-[12rem]"
        >
          {label}
        </Link>
      </div>
    </aside>
  );
}
