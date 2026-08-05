"use client";

import Link from "next/link";
import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { DIGITAL_CONTACT_SHOWCASE_ITEMS } from "@/app/lib/digitalContact/digitalContactShowcase";
import type { DigitalContactLang } from "@/app/lib/digitalContact/digitalContactTypes";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";

type Props = {
  profileSlug: string;
  lang: DigitalContactLang;
  copy: DigitalContactCopy;
};

/** Leonix Showcase — premium capability sections (not a "portfolio"); items are data-driven and future-configurable. */
export function DigitalContactShowcase({ profileSlug, lang, copy }: Props) {
  return (
    <section aria-labelledby="dc-showcase-title" className="mx-auto w-full max-w-2xl px-5 pt-12 sm:px-6 sm:pt-14">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A7B28]">Leonix Media</p>
        <h2 id="dc-showcase-title" className="mt-1 font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
          {copy.showcaseTitle}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#3D3428]">{copy.showcaseSubtitle}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DIGITAL_CONTACT_SHOWCASE_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => trackDigitalContactEvent(profileSlug, "showcase_click", { item: item.id })}
            className="group flex flex-col rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-4 shadow-sm transition hover:border-[#C9A84A] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F4EA]"
          >
            <span className="text-sm font-bold text-[#7A1E2C] group-hover:underline">
              {lang === "en" ? item.titleEn : item.titleEs}
            </span>
            <span className="mt-1 text-xs leading-relaxed text-[#5F6258]">
              {lang === "en" ? item.descriptionEn : item.descriptionEs}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
