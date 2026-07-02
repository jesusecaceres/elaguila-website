import type { Metadata } from "next";
import Link from "next/link";
import { GlobalContactForm } from "@/app/components/contact/GlobalContactForm";
import { ContactoLanguageBar } from "@/app/components/contact/ContactoLanguageBar";
import {
  LEONIX_TIENDA_CONTACT_PATH,
} from "@/app/(site)/tienda/data/leonixContact";
import { normalizeLang } from "@/app/lib/language";
import { getPublicLocaleCopy } from "@/app/lib/leonix/publicFormCopy";
import { parseInquiryType } from "@/app/lib/leonix/inquiryTypes";
import {
  getContactPolishCopy,
  resolveContactHeroIntent,
  resolveInquiryHighlightIndex,
} from "@/app/lib/leonix/contactPagePolishCopy";
import { ContactIntakeHero } from "./ContactIntakeHero";

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
  searchParams?: Promise<{ lang?: string; inquiryType?: string; sourceCta?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const intent = resolveContactHeroIntent({
    inquiryType: sp.inquiryType,
    sourceCta: sp.sourceCta,
  });
  const polish = getContactPolishCopy(lang, intent);
  const { hero } = polish;
  return {
    title: hero.title,
    description: hero.subtitle,
    openGraph: { title: hero.title, description: hero.subtitle, siteName: "Leonix Media" },
    twitter: { title: hero.title, description: hero.subtitle },
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
  const intent = resolveContactHeroIntent({
    inquiryType: sp.inquiryType ?? sp.interest,
    sourceCta: sp.sourceCta ?? sp.source,
  });
  const polish = getContactPolishCopy(lang, intent);
  const pageCopy = getPublicLocaleCopy(lang).contactPage;
  const prefillRaw = typeof sp.prefillMessage === "string" ? sp.prefillMessage : "";
  const prefillMessage = prefillRaw ? prefillRaw.slice(0, 12000) : undefined;
  const parsedInquiryType = parseInquiryType(sp.inquiryType ?? sp.interest, "general");
  const initialInquiryType =
    intent === "advertising" && parsedInquiryType === "general" ? "advertising" : parsedInquiryType;
  const sourceCta = typeof sp.sourceCta === "string" ? sp.sourceCta : typeof sp.source === "string" ? sp.source : "";
  const sourcePage = typeof sp.sourcePage === "string" ? sp.sourcePage : "/contacto";
  const highlightInquiryIndex = resolveInquiryHighlightIndex({
    inquiryType: sp.inquiryType ?? sp.interest,
    sourceCta: sp.sourceCta ?? sp.source,
  });

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

      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-20 sm:px-6">
        <ContactoLanguageBar />

        <ContactIntakeHero lang={lang} copy={polish} highlightInquiryIndex={highlightInquiryIndex} />

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
        <div id="contact-form" className="mt-12 scroll-mt-28">
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
