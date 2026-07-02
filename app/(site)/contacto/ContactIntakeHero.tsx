"use client";

import Link from "next/link";
import { VisibleEmailWithCopy } from "@/app/components/contact/LeonixEmailContactBlock";
import { LEONIX_MAP_URL, LEONIX_PHONE_TEL, LEONIX_PHONE_DISPLAY } from "@/app/(site)/tienda/data/leonixContact";
import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";
import type { SupportedLang } from "@/app/lib/language";
import { replaceLangInHref } from "@/app/lib/language";
import {
  CONTACT_DISPLAY_ADDRESS_LINE1,
  CONTACT_DISPLAY_ADDRESS_LINE2,
  type ContactPolishCopy,
} from "@/app/lib/leonix/contactPagePolishCopy";

type Props = {
  lang: SupportedLang;
  copy: ContactPolishCopy;
  highlightInquiryIndex: number | null;
};

function withLang(path: string, lang: SupportedLang): string {
  return replaceLangInHref(path, lang);
}

export function ContactIntakeHero({ lang, copy, highlightInquiryIndex }: Props) {
  const { hero } = copy;

  return (
    <>
      <section
        className="rounded-2xl border border-[#C9A84A]/45 bg-[#FFFDF7] p-6 shadow-[0_16px_40px_-20px_rgba(31,36,28,0.18)] sm:p-8 lg:p-10"
        aria-labelledby="contact-intake-hero-title"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{hero.eyebrow}</p>
            <h1
              id="contact-intake-hero-title"
              className="mt-3 font-serif text-3xl font-bold leading-tight tracking-tight text-[#2A4536] sm:text-4xl lg:text-[2.65rem]"
            >
              {hero.title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#3D3428] sm:text-lg">{hero.subtitle}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#contact-form"
                className="inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-3 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
              >
                {hero.primaryCta}
              </a>
              <Link
                href={withLang("/media-kit", lang)}
                className="inline-flex min-h-[3rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FAF6EE] px-6 py-3 text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FFFDF7]"
              >
                {hero.secondaryMediaKit}
              </Link>
              <Link
                href={withLang("/productos-promocion", lang)}
                className="inline-flex min-h-[3rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FAF6EE] px-6 py-3 text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FFFDF7]"
              >
                {hero.secondaryPromo}
              </Link>
              <Link
                href={withLang("/clasificados/publicar", lang)}
                className="inline-flex min-h-[3rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FAF6EE] px-6 py-3 text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FFFDF7]"
              >
                {hero.secondaryClassified}
              </Link>
            </div>
          </div>

          <aside
            className="rounded-2xl border border-[#C9A84A]/35 bg-[#2A4536] p-6 text-[#FAF6EE] shadow-[0_12px_32px_-16px_rgba(31,36,28,0.35)] sm:p-7"
            aria-labelledby="contact-panel-title"
          >
            <h2 id="contact-panel-title" className="font-serif text-xl font-bold text-[#FFFDF7]">
              {copy.contactPanelTitle}
            </h2>
            <p className="mt-2 text-xs font-medium text-[#C9A84A]/90">{copy.contactPanelTrust}</p>

            <dl className="mt-6 space-y-5">
              <div>
                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#C9A84A]/80">
                  {copy.emailLabel}
                </dt>
                <dd className="mt-1.5">
                  <VisibleEmailWithCopy
                    email={LEONIX_GLOBAL_EMAIL}
                    lang={lang}
                    className="text-sm font-medium text-[#FFFDF7]"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#C9A84A]/80">
                  {copy.phoneLabel}
                </dt>
                <dd className="mt-1.5">
                  <a
                    href={LEONIX_PHONE_TEL}
                    className="inline-flex min-h-[44px] items-center text-base font-bold text-[#FFFDF7] underline decoration-[#C9A84A]/60 underline-offset-4 hover:text-[#FAF6EE]"
                  >
                    {LEONIX_PHONE_DISPLAY}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#C9A84A]/80">
                  {copy.officeLabel}
                </dt>
                <dd className="mt-1.5">
                  <a
                    href={LEONIX_MAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm leading-relaxed font-medium text-[#FAF6EE]/95 underline decoration-[#C9A84A]/40 underline-offset-4 hover:text-[#FFFDF7]"
                  >
                    {CONTACT_DISPLAY_ADDRESS_LINE1}
                    <br />
                    {CONTACT_DISPLAY_ADDRESS_LINE2}
                  </a>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="inquiry-types-title">
        <h2 id="inquiry-types-title" className="font-serif text-2xl font-bold text-[#2A4536]">
          {copy.inquiryTitle}
        </h2>
        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {copy.inquiryTypes.map((item, index) => {
            const highlighted = highlightInquiryIndex === index;
            return (
              <li
                key={item}
                className={`rounded-xl border px-4 py-3.5 text-sm font-medium transition ${
                  highlighted
                    ? "border-[#7A1E2C]/50 bg-[#7A1E2C]/8 text-[#7A1E2C] shadow-[0_4px_16px_-8px_rgba(122,30,44,0.25)] ring-1 ring-[#C9A84A]/40"
                    : "border-[#C9A84A]/30 bg-[#FFFDF7] text-[#3D3428]"
                }`}
                aria-current={highlighted ? "true" : undefined}
              >
                {item}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
