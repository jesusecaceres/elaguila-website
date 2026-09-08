import Image from "next/image";
import Link from "next/link";
import { IGLESIAS_EDITORIAL_HERO } from "@/app/lib/iglesias/images";
import type { IglesiasCopy } from "@/app/lib/iglesias/copy";

export function IglesiasHero({
  copy,
  lang,
  findHref,
  prayerHref,
  churchHref,
}: {
  copy: IglesiasCopy;
  lang: "es" | "en";
  findHref: string;
  prayerHref: string;
  churchHref: string;
}) {
  return (
    <section className="relative overflow-hidden" aria-labelledby="iglesias-hero-title">
      <div className="relative isolate min-h-[26rem] w-full sm:min-h-[30rem] lg:min-h-[34rem]">
        <Image
          src={IGLESIAS_EDITORIAL_HERO.src}
          alt={lang === "en" ? IGLESIAS_EDITORIAL_HERO.altEn : IGLESIAS_EDITORIAL_HERO.altEs}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_32%] sm:object-[center_38%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F241C] via-[#1F241C]/45 to-[#1F241C]/25" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1F241C]/70 via-[#1F241C]/25 to-transparent" aria-hidden />
        <div className="relative mx-auto flex min-h-[26rem] max-w-[88rem] flex-col justify-end px-4 pb-9 pt-20 sm:min-h-[30rem] sm:px-6 sm:pb-12 lg:min-h-[34rem] lg:px-8">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#E8D7B5]">{copy.heroEyebrow}</p>
          <h1
            id="iglesias-hero-title"
            className="mt-3 max-w-3xl font-serif text-[clamp(2rem,5.4vw+0.4rem,3.75rem)] font-bold leading-[1.08] text-[#FFFCF7]"
          >
            <span className="block">{copy.heroTitleLine1}</span>
            <span className="mt-1 block text-[#F3E4C2]">{copy.heroTitleLine2}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/92 sm:text-base">{copy.heroSupport}</p>
          <p className="mt-3 max-w-2xl font-serif text-sm italic leading-relaxed text-[#E8D7B5]/95 sm:text-[0.95rem]">
            {copy.heroScripture}
          </p>
          <div className="mt-7 flex max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={prayerHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#7A1E2C] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(122,30,44,0.65)] hover:bg-[#6B1A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1F241C]"
            >
              {copy.ctaPrayer}
            </a>
            <a
              href={findHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/45 bg-white/12 px-6 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]"
            >
              {copy.ctaFind}
            </a>
            <Link
              href={churchHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#C9A84A]/80 bg-transparent px-6 text-sm font-semibold text-[#F7F0E2] hover:bg-[#C9A84A]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]"
            >
              {copy.ctaChurch}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
