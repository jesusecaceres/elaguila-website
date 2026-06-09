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
  LEONIX_OFFICE_ADDRESS,
} from "@/app/(site)/tienda/data/leonixContact";
import { LEONIX_GLOBAL_EMAIL, LEONIX_GLOBAL_MAILTO } from "@/app/data/leonixGlobalContact";
import { normalizeLang } from "@/app/lib/language";
import { getPublicLocaleCopy } from "@/app/lib/leonix/publicFormCopy";
import { parseInquiryType } from "@/app/lib/leonix/inquiryTypes";

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
  const copy = getPublicLocaleCopy(lang).contactPage;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    openGraph: { title: copy.metaTitle, description: copy.metaDescription, siteName: "Leonix Media" },
    twitter: { title: copy.metaTitle, description: copy.metaDescription },
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
    <main lang={lang} className="min-h-screen w-full overflow-x-hidden bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-20 sm:px-6">
        <ContactoLanguageBar />

        <h1 className="mb-4 text-center text-3xl font-bold text-[color:var(--lx-text)] sm:text-4xl">{pageCopy.h1}</h1>

        <p className="mx-auto mb-10 max-w-2xl text-center leading-relaxed text-[color:var(--lx-text-2)]/85">
          {pageCopy.intro}
        </p>

        <div className="mb-8 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-[0_18px_48px_rgba(42,36,22,0.10)]">
          <h2 className="mb-3 text-xl font-semibold text-[color:var(--lx-text)]">{pageCopy.promoHelpTitle}</h2>
          <p className="mb-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]/90">{pageCopy.promoHelpBody}</p>
          <Link
            href={promoHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[color:var(--lx-cta-primary-bg)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-primary-fg)] transition hover:opacity-90"
          >
            {pageCopy.promoHelpCta}
          </Link>
        </div>

        <div className="mb-12 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-[0_18px_48px_rgba(42,36,22,0.10)]">
          <h2 className="mb-4 text-2xl font-semibold text-[color:var(--lx-text)]">{pageCopy.business}</h2>

          <div className="space-y-3 text-[color:var(--lx-text-2)]/90">
            <div>
              <span className="font-semibold text-[color:var(--lx-text)]">{pageCopy.emailLabel}:</span>
              <LeonixEmailContactBlock
                email={LEONIX_GLOBAL_EMAIL}
                mailtoHref={LEONIX_GLOBAL_MAILTO}
                lang={lang}
                shareTitle={pageCopy.business}
                className="mt-1"
              />
            </div>

            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">{pageCopy.phoneLabel}:</span>{" "}
              <a href={LEONIX_PHONE_TEL} className="underline hover:opacity-80">
                {LEONIX_PHONE_DISPLAY}
              </a>
            </p>

            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">{pageCopy.addressLabel}:</span>{" "}
              <a
                href={LEONIX_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words underline hover:opacity-80"
              >
                {LEONIX_OFFICE_ADDRESS}
              </a>
            </p>

            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">{pageCopy.hoursLabel}:</span> {pageCopy.hours}
            </p>

            <p>
              <a href={LEONIX_MAP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                {pageCopy.openMap}
              </a>
            </p>
          </div>
        </div>

        <GlobalContactForm
          lang={lang}
          initialMessage={prefillMessage}
          initialInquiryType={initialInquiryType}
          sourcePage={sourcePage}
          sourceCta={sourceCta}
        />
      </div>
    </main>
  );
}
