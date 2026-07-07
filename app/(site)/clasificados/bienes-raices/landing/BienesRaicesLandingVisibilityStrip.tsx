import Link from "next/link";
import { FiStar } from "react-icons/fi";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { visibilityContactHref } from "@/app/(site)/clasificados/components/categoryStandard/CategoryVisibilityCta";
import {
  BR_LANDING_SECTION,
  BR_LANDING_SECTION_PAD,
} from "../shared/bienesRaicesLeonixPublicUi";

/** Bienes Raíces-only visibility strip — same monetization route, landing/results aligned styling. */
export function BienesRaicesLandingVisibilityStrip({ lang }: { lang: Lang }) {
  const isEs = lang === "es";
  const href = visibilityContactHref(lang, "bienes-raices", "landing");
  const title = isEs ? "Haz que tu anuncio tenga más visibilidad" : "Give your listing more visibility";
  const body = isEs
    ? "Opciones de revista, digital y destacados se revisan con Leonix. Nada aparece como Destacado sin un paquete activo."
    : "Print, digital, and featured options are reviewed with Leonix. Nothing is marked Featured without an active package.";
  const label = isEs ? "Conocer opciones de visibilidad" : "Explore visibility options";
  const eyebrow = isEs ? "VISIBILIDAD PARA TU PROPIEDAD" : "VISIBILITY FOR YOUR PROPERTY";

  return (
    <aside className={`${BR_LANDING_SECTION} relative overflow-hidden`} aria-label={label}>
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(201,168,74,0.1)_0%,rgba(255,253,247,0.96)_50%,rgba(85,107,62,0.06)_100%)]"
        aria-hidden
      />
      <div className={`${BR_LANDING_SECTION_PAD} relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C9A84A]/45 bg-[#FFF9F0] text-[#C9A84A] shadow-sm">
            <FiStar className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]">{eyebrow}</p>
            <p className="mt-1 font-serif text-base font-bold leading-snug text-[#2A4536] sm:text-lg">{title}</p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#5C5346] sm:text-sm">{body}</p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-[#7A1E2C]/35 bg-[#7A1E2C] px-5 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:min-w-[13rem]"
        >
          {label}
        </Link>
      </div>
    </aside>
  );
}
