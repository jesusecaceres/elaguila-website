import type { Metadata } from "next";
import Link from "next/link";
import { GlobalContactForm } from "@/app/components/contact/GlobalContactForm";
import { ContactoLanguageBar } from "@/app/components/contact/ContactoLanguageBar";
import { LeonixEmailContactBlock } from "@/app/components/contact/LeonixEmailContactBlock";
import {
  LEONIX_MAP_URL,
  LEONIX_PHONE_TEL,
  LEONIX_TIENDA_CONTACT_PATH,
  LEONIX_PHONE_DISPLAY,
} from "@/app/(site)/tienda/data/leonixContact";
import { LEONIX_GLOBAL_EMAIL, LEONIX_GLOBAL_MAILTO } from "@/app/data/leonixGlobalContact";
import { normalizeLang } from "@/app/lib/language";
import { getPublicLocaleCopy } from "@/app/lib/leonix/publicFormCopy";
import { parseInquiryType } from "@/app/lib/leonix/inquiryTypes";
import { CONTACT_DISPLAY_ADDRESS, getContactPolishCopy } from "@/app/lib/leonix/contactPagePolishCopy";

function withLang(href: string, lang: string, extra?: Record<string, string>): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", lang);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
  }
  return `${path}?${params.toString()}`;
}

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const polish = getContactPolishCopy(lang);
  return {
    title: polish.heroTitle,
    description: polish.heroSubtitle,
    openGraph: { title: polish.heroTitle, description: polish.heroSubtitle, siteName: "Leonix Media" },
    twitter: { title: polish.heroTitle, description: polish.heroSubtitle },
  };
}

export default async function ContactoPage(props: {
  searchParams?: Promise<{
    lang?: string;
    prefillMessage?: string;
    inquiryType?: string;
    interest?: string;
    sourceCta?: string;
    source?: string;
    sourcePage?: string;
  }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const pageCopy = getPublicLocaleCopy(lang).contactPage;
  const polish = getContactPolishCopy(lang);
  const prefillRaw = typeof sp.prefillMessage === "string" ? sp.prefillMessage : "";
  const prefillMessage = prefillRaw ? prefillRaw.slice(0, 12000) : undefined;
  const initialInquiryType = parseInquiryType(sp.inquiryType ?? sp.interest, "general");
  const sourceCta = typeof sp.sourceCta === "string" ? sp.sourceCta : typeof sp.source === "string" ? sp.source : "";
  const sourcePage = typeof sp.sourcePage === "string" ? sp.sourcePage : "/contacto";

  const promoHref = withLang(`${LEONIX_TIENDA_CONTACT_PATH}?service=cotizacion-general`, lang, {
    sourceCta: "promo_quote",
    sourcePage: sourcePage === "/contacto" ? "contacto" : sourcePage,
  });

  return (
    <main lang={lang} className="min-h-screen w-full overflow-x-hidden bg-[#FAF6EE] text-[#1F241C]">
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 110% 65% at 50% -5%, rgba(201, 168, 74, 0.1), transparent 52%),
            radial-gradient(ellipse 45% 35% at 100% 20%, rgba(255, 255, 255, 0.35), transparent 48%)
          `,
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 pt-24 pb-20 sm:px-6">
        <ContactoLanguageBar />

        <section className="mx-auto max-w-3xl text-center">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">LEONIX MEDIA</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#2A4536] sm:text-5xl">{polish.heroTitle}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#3D3428] sm:text-lg">{polish.heroSubtitle}</p>
        </section>

        {/* Contact cards */}
        <section className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3" aria-labelledby="contact-cards-title">
          <h2 id="contact-cards-title" className="sr-only">
            {polish.contactCardsTitle}
          </h2>
          <article className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.12)]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#556B3E]">{pageCopy.emailLabel}</p>
            <LeonixEmailContactBlock
              email={LEONIX_GLOBAL_EMAIL}
              mailtoHref={LEONIX_GLOBAL_MAILTO}
              lang={lang}
              shareTitle={polish.heroTitle}
              className="mt-2"
            />
          </article>
          <article className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.12)]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#556B3E]">{pageCopy.phoneLabel}</p>
            <a
              href={LEONIX_PHONE_TEL}
              className="mt-2 inline-flex min-h-[44px] items-center text-lg font-bold text-[#7A1E2C] underline decoration-[#C9A84A]/60 underline-offset-4 hover:text-[#5e1721]"
            >
              {LEONIX_PHONE_DISPLAY}
            </a>
          </article>
          <article className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.12)]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#556B3E]">{pageCopy.addressLabel}</p>
            <a
              href={LEONIX_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm leading-relaxed font-semibold text-[#3D3428] underline decoration-[#C9A84A]/40 underline-offset-4 hover:text-[#7A1E2C]"
            >
              {CONTACT_DISPLAY_ADDRESS}
            </a>
          </article>
        </section>

        {/* Inquiry types */}
        <section className="mt-12" aria-labelledby="inquiry-types-title">
          <h2 id="inquiry-types-title" className="font-serif text-2xl font-bold text-[#2A4536]">
            {polish.inquiryTitle}
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {polish.inquiryTypes.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-[#C9A84A]/30 bg-[#FFFDF7] px-4 py-3 text-sm font-medium text-[#3D3428]"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Quick actions */}
        <section className="mt-12" aria-labelledby="quick-actions-title">
          <h2 id="quick-actions-title" className="font-serif text-2xl font-bold text-[#2A4536]">
            {polish.quickActionsTitle}
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={withLang("/contacto", lang, { inquiryType: "advertising" })}
              className="inline-flex min-h-[2.75rem] items-center rounded-full bg-[#7A1E2C] px-6 py-2 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]"
            >
              {polish.quickAdvertise}
            </Link>
            <Link
              href={withLang("/media-kit", lang)}
              className="inline-flex min-h-[2.75rem] items-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-6 py-2 text-sm font-bold text-[#3D3428] hover:border-[#C9A84A]"
            >
              {polish.quickMediaKit}
            </Link>
            <Link
              href={withLang("/productos-promocion", lang)}
              className="inline-flex min-h-[2.75rem] items-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-6 py-2 text-sm font-bold text-[#3D3428] hover:border-[#C9A84A]"
            >
              {polish.quickPromo}
            </Link>
            <Link
              href={withLang("/clasificados/publicar", lang)}
              className="inline-flex min-h-[2.75rem] items-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-6 py-2 text-sm font-bold text-[#3D3428] hover:border-[#C9A84A]"
            >
              {polish.quickClassifieds}
            </Link>
          </div>
        </section>

        {/* Promo help */}
        <div className="mt-12 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.12)]">
          <h2 className="text-xl font-bold text-[#2A4536]">{pageCopy.promoHelpTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{pageCopy.promoHelpBody}</p>
          <Link
            href={promoHref}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#7A1E2C] px-5 py-2.5 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]"
          >
            {pageCopy.promoHelpCta}
          </Link>
        </div>

        {/* Trust block */}
        <section className="mt-10 rounded-2xl border border-[#556B3E]/25 bg-[#556B3E]/5 p-6 sm:p-8">
          <h2 className="font-serif text-xl font-bold text-[#2A4536]">{polish.trustTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#3D3428] sm:text-base">{polish.trustBody}</p>
        </section>

        {/* Existing lead form */}
        <div className="mt-12">
          <GlobalContactForm
            lang={lang}
            initialMessage={prefillMessage}
            initialInquiryType={initialInquiryType}
            sourcePage={sourcePage}
            sourceCta={sourceCta}
          />
        </div>
      </div>
    </main>
  );
}
