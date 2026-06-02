"use client";

import Image from "next/image";
import type { HomeFeaturedBusiness } from "./homeFeaturedBusinesses";
import { HOME_PAGE_COPY, type HomePageLang } from "./homePageCopy";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function featuredCardColClass(index: number, count: number): string {
  if (count === 5 && index >= 3) {
    return index === 3 ? "lg:col-start-2" : "lg:col-start-4";
  }
  if (count === 7 && index === 6) {
    return "lg:col-start-2";
  }
  return "";
}

type Props = {
  lang: HomePageLang;
  businesses: HomeFeaturedBusiness[];
  advertiseHref: string;
};

export function HomeDestacadosSection({ lang, businesses, advertiseHref }: Props) {
  const copy = HOME_PAGE_COPY[lang].destacados;
  const hasBusinesses = businesses.length > 0;
  const useSixCol = businesses.length === 5 || businesses.length === 7;

  return (
    <section
      className="border-t border-[#D6C7AD]/70 bg-[#FFFDF7]/60 py-14 sm:py-16"
      aria-labelledby="home-destacados-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{copy.eyebrow}</p>
        <h2
          id="home-destacados-title"
          className="mt-2 max-w-2xl font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
        >
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{copy.intro}</p>

        {hasBusinesses ? (
          <ul
            className={cx(
              "mt-8 grid gap-5",
              useSixCol
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {businesses.map((business, index) => (
              <li
                key={`${business.name}-${business.href}`}
                className={cx(useSixCol && "lg:col-span-2", featuredCardColClass(index, businesses.length))}
              >
                <FeaturedBusinessCard business={business} lang={lang} viewCta={copy.viewCta} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#D6C7AD] bg-[#FAF6EE] px-6 py-10 text-center shadow-[0_12px_32px_-20px_rgba(31,36,28,0.2)] sm:px-10">
            <p className="mx-auto max-w-lg text-sm font-medium leading-relaxed text-[#3D3428] sm:text-base">
              {copy.reserved}
            </p>
            <a
              href={advertiseHref}
              className="mt-6 inline-flex min-h-[2.75rem] items-center justify-center rounded-full border-2 border-[#7A1E2C]/85 bg-[#FFFDF7] px-7 py-2 text-sm font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF]"
            >
              {copy.advertiseCta}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedBusinessCard({
  business,
  lang,
  viewCta,
}: {
  business: HomeFeaturedBusiness;
  lang: HomePageLang;
  viewCta: string;
}) {
  const href = business.href.includes("?")
    ? `${business.href}&lang=${lang}`
    : `${business.href}?lang=${lang}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_10px_28px_-18px_rgba(31,36,28,0.22)] ring-1 ring-[#C9A84A]/15">
      <div className="relative aspect-[4/3] w-full bg-[#FAF6EE]">
        {business.imageSrc.trim() ? (
          <Image
            src={business.imageSrc}
            alt=""
            fill
            className="object-contain p-3"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold uppercase tracking-wide text-[#3D3428]/45">
            {business.name}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col border-t border-[#D6C7AD]/60 p-4">
        <h3 className="text-base font-bold text-[#1F241C]">{business.name}</h3>
        {business.category.trim() ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#556B3E]">{business.category}</p>
        ) : null}
        {business.location.trim() ? (
          <p className="mt-1 text-xs text-[#3D3428]/75">{business.location}</p>
        ) : null}
        {business.tagline.trim() ? (
          <p className="mt-2 flex-1 text-sm leading-snug text-[#3D3428]">{business.tagline}</p>
        ) : null}
        <a
          href={href}
          className="mt-4 inline-flex min-h-[2.5rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
        >
          {viewCta}
        </a>
      </div>
    </article>
  );
}
