import Image from "next/image";
import type { ReactNode } from "react";
import {
  rentasLandingHeroImageSrc,
  rentasLandingHeroSectionClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";

/**
 * Full-bleed (within container) scenic hero — rental / lifestyle atmosphere.
 * Content sits above layered washes so copy and controls stay readable.
 */
export function RentasLandingHero({ children }: { children: ReactNode }) {
  return (
    <section className={rentasLandingHeroSectionClass} aria-labelledby="rentas-hero-heading">
      <div className="absolute inset-0">
        <Image
          src={rentasLandingHeroImageSrc}
          alt=""
          fill
          priority
          sizes="(max-width: 1536px) 100vw, 1460px"
          className="object-cover object-[center_36%] max-md:object-[center_32%]"
        />
        {/* Warm cream wash — keeps hero light, not muddy */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#F8F1E6]/92 via-[#F5EDE3]/82 to-[#F0E8DC]/94"
          aria-hidden
        />
        {/* Side depth (place-aware, not dark) */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#5B7C99]/[0.09] via-transparent to-[#C45C26]/[0.06]"
          aria-hidden
        />
        {/* Bottom blend into page paper */}
        <div
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F4EDE3] via-[#F4EDE3]/95 to-transparent sm:h-40"
          aria-hidden
        />
        {/* Top readability for breadcrumb / lang */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#FFFCF7]/55 to-transparent sm:h-28" aria-hidden />
        {/* Subtle neighborhood grid — premium structure without photo noise */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-multiply [background-image:linear-gradient(to_right,rgba(91,124,153,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(91,124,153,0.16)_1px,transparent_1px)] [background-size:44px_44px]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex w-full min-w-0 flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10 md:px-8 md:py-11 lg:gap-10 lg:px-10 lg:py-12">
        {children}
      </div>
    </section>
  );
}
