import type { Metadata } from "next";
import Link from "next/link";
import { GlobalContactForm } from "@/app/components/contact/GlobalContactForm";
import { LeonixEmailContactBlock } from "@/app/components/contact/LeonixEmailContactBlock";
import { LEONIX_GLOBAL_CONTACT_PATH } from "@/app/data/leonixGlobalContact";
import { LEONIX_MEDIA_DESCRIPTOR_EN, LEONIX_MEDIA_DESCRIPTOR_ES, LEONIX_MEDIA_SITE_NAME } from "@/app/lib/leonixBrand";
import {
  LEONIX_MAP_URL,
  LEONIX_PHONE_TEL,
  LEONIX_TIENDA_CONTACT_PATH,
} from "@/app/(site)/tienda/data/leonixContact";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { ContactoPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeContactoCopy } from "@/app/lib/siteSectionContent/contactoMerge";
import { parseInquiryType } from "@/app/lib/leonix/inquiryTypes";

type Lang = "es" | "en";

const PROMO_HELP_CARD = {
  es: {
    title: "¿Buscas productos promocionales o impresión?",
    body: "Para cotizaciones de tarjetas, volantes, banners, artículos promocionales o archivos de impresión, usa nuestro contacto de productos promocionales.",
    cta: "Cotizar productos promocionales",
  },
  en: {
    title: "Looking for promotional products or printing?",
    body: "For business cards, flyers, banners, promotional products, or print files, use our promotional products contact.",
    cta: "Quote promotional products",
  },
} as const;

function normalizeLang(v: string | undefined): Lang {
  return v === "en" ? "en" : "es";
}

function withLang(href: string, lang: Lang): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", lang);
  return `${path}?${params.toString()}`;
}

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const title = lang === "en" ? "Contact" : "Contacto";
  const description = lang === "en" ? LEONIX_MEDIA_DESCRIPTOR_EN : LEONIX_MEDIA_DESCRIPTOR_ES;
  return {
    title,
    description,
    openGraph: { title, description, siteName: LEONIX_MEDIA_SITE_NAME },
    twitter: { title, description },
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
  }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const prefillRaw = typeof sp.prefillMessage === "string" ? sp.prefillMessage : "";
  const prefillMessage = prefillRaw ? prefillRaw.slice(0, 12000) : undefined;
  const initialInquiryType = parseInquiryType(sp.inquiryType ?? sp.interest, "general");
  const sourceCta = typeof sp.sourceCta === "string" ? sp.sourceCta : typeof sp.source === "string" ? sp.source : "";
  const swap = lang === "en" ? "es" : "en";

  const { payload } = await getSiteSectionPayload("contacto");
  const copy = mergeContactoCopy(lang, payload as unknown as ContactoPayload);
  const promoHelp = PROMO_HELP_CARD[lang];

  return (
    <main className="min-h-screen w-full bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="mx-auto max-w-4xl px-6 pt-28 pb-20">
        <div className="mb-6 flex justify-end">
          <Link
            href={withLang(LEONIX_GLOBAL_CONTACT_PATH, swap)}
            className="text-sm font-medium text-[color:var(--lx-text-2)] hover:text-[color:var(--lx-text)] underline"
          >
            {copy.langSwitch}
          </Link>
        </div>

        {copy.noticeTop ? (
          <div className="mb-8 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-center text-sm text-[color:var(--lx-text)]">
            {copy.noticeTop}
          </div>
        ) : null}

        <h1 className="mb-4 text-center text-4xl font-bold text-[color:var(--lx-text)]">{copy.h1}</h1>

        {copy.subhead ? (
          <p className="mx-auto mb-4 max-w-2xl text-center text-lg text-[color:var(--lx-text-2)]/90">{copy.subhead}</p>
        ) : null}

        <p className="mx-auto mb-10 max-w-2xl text-center leading-relaxed text-[color:var(--lx-text-2)]/85">
          {copy.intro}
        </p>

        <div className="mb-8 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-[0_18px_48px_rgba(42,36,22,0.10)]">
          <h2 className="mb-3 text-xl font-semibold text-[color:var(--lx-text)]">{promoHelp.title}</h2>
          <p className="mb-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]/90">{promoHelp.body}</p>
          <Link
            href={withLang(`${LEONIX_TIENDA_CONTACT_PATH}?service=cotizacion-general`, lang)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[color:var(--lx-cta-primary-bg)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-primary-fg)] transition hover:opacity-90"
          >
            {promoHelp.cta}
          </Link>
        </div>

        <div className="mb-12 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-[0_18px_48px_rgba(42,36,22,0.10)]">
          <h2 className="mb-4 text-2xl font-semibold text-[color:var(--lx-text)]">{copy.business}</h2>

          <div className="space-y-3 text-[color:var(--lx-text-2)]/90">
            <div>
              <span className="font-semibold text-[color:var(--lx-text)]">{copy.emailLabel}:</span>
              <LeonixEmailContactBlock
                email={copy.email}
                mailtoHref={copy.mailto}
                lang={lang}
                shareTitle={copy.business}
                className="mt-1"
              />
            </div>

            {copy.phoneLine ? (
              <p>
                <span className="font-semibold text-[color:var(--lx-text)]">
                  {lang === "en" ? "Phone" : "Teléfono"}:
                </span>{" "}
                <a href={LEONIX_PHONE_TEL} className="underline hover:opacity-80">
                  {copy.phoneLine}
                </a>
              </p>
            ) : null}

            {copy.addressLine ? (
              <p>
                <span className="font-semibold text-[color:var(--lx-text)]">
                  {lang === "en" ? "Address" : "Dirección"}:
                </span>{" "}
                <a
                  href={copy.mapUrl ?? LEONIX_MAP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-words underline hover:opacity-80"
                >
                  {copy.addressLine}
                </a>
              </p>
            ) : null}

            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">{copy.hoursLabel}:</span> {copy.hours}
            </p>

            {copy.mapUrl ? (
              <p>
                <a href={copy.mapUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                  {lang === "en" ? "Open map" : "Abrir mapa"}
                </a>
              </p>
            ) : null}
          </div>
        </div>

        <GlobalContactForm
          lang={lang}
          initialMessage={prefillMessage}
          initialInquiryType={initialInquiryType}
          sourcePage="/contacto"
          sourceCta={sourceCta}
        />
      </div>
    </main>
  );
}
