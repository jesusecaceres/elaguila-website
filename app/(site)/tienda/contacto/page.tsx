import type { Metadata } from "next";
import Link from "next/link";
import { LEONIX_GLOBAL_CONTACT_PATH } from "@/app/data/leonixGlobalContact";
import {
  LEONIX_MAILTO_TIENDA,
  LEONIX_MAP_URL,
  LEONIX_OFFICE_ADDRESS,
  LEONIX_PHONE_DISPLAY,
  LEONIX_PHONE_TEL,
  LEONIX_TIENDA_EMAIL,
} from "../data/leonixContact";
import {
  tiendaContactBackToProducts,
  tiendaContactGeneralSiteCta,
  tiendaContactGeneralSiteNote,
  tiendaContactPageSubtitle,
  tiendaContactPageTitle,
  tiendaContactPreferenceIntro,
  tiendaContactRankEmail,
  tiendaContactRankOffice,
  tiendaContactRankPhone,
} from "../data/tiendaContactPageCopy";
import { LeonixEmailContactBlock } from "@/app/components/contact/LeonixEmailContactBlock";
import { TiendaContactForm } from "../components/TiendaContactForm";
import { TiendaContactLanguageBar } from "../components/TiendaContactLanguageBar";
import { normalizeLang, replaceLangInHref } from "@/app/lib/language";
import { getPublicLocaleCopy } from "@/app/lib/leonix/publicFormCopy";

function withLang(href: string, lang: ReturnType<typeof normalizeLang>, extra?: Record<string, string>): string {
  const base = replaceLangInHref(href, lang);
  if (!extra) return base;
  const url = new URL(base, "https://leonixmedia.com");
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  return `${url.pathname}${url.search}`;
}

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const copy = getPublicLocaleCopy(lang).tiendaPage;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    openGraph: { title: copy.metaTitle, description: copy.metaDescription },
  };
}

export default async function TiendaContactoPage(props: {
  searchParams?: Promise<{
    lang?: string;
    service?: string;
    sourceCta?: string;
    sourcePage?: string;
  }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const pageCopy = getPublicLocaleCopy(lang).tiendaPage;
  const formCopy = getPublicLocaleCopy(lang).tiendaForm;
  const service = typeof sp.service === "string" && sp.service.trim() ? sp.service.trim().slice(0, 120) : undefined;
  const sourceCta = typeof sp.sourceCta === "string" ? sp.sourceCta : "promo_quote";
  const sourcePage = typeof sp.sourcePage === "string" ? sp.sourcePage : "tienda_contacto";

  const mailSubject = formCopy.title;

  return (
    <main lang={lang} className="min-h-screen overflow-x-hidden bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:px-6">
        <TiendaContactLanguageBar />

        <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label={pageCopy.navLabel}>
          <Link
            href={withLang("/productos-promocion", lang)}
            className="font-medium text-[color:var(--lx-lion)] hover:text-[color:var(--lx-text)]"
          >
            {tiendaContactBackToProducts(lang)}
          </Link>
        </nav>

        <header className="mt-8 space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">
            {tiendaContactPageTitle(lang)}
          </h1>
          <p className="text-base leading-relaxed text-[color:var(--lx-muted)]">
            {tiendaContactPageSubtitle(lang)}
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-6 sm:p-8 shadow-[0_12px_40px_rgba(42,36,22,0.08)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--lx-lion)]">
            {pageCopy.howToReach}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-muted)]">
            {tiendaContactPreferenceIntro(lang)}
          </p>
          <ul className="mt-6 space-y-4 text-sm text-[color:var(--lx-text)]/85">
            <li className="flex flex-col gap-1 border-b border-[color:var(--lx-border)] pb-4">
              <span className="font-semibold text-[color:var(--lx-text)]">{tiendaContactRankOffice(lang)}</span>
              <a
                href={LEONIX_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words text-[color:var(--lx-muted)] underline-offset-2 hover:text-[color:var(--lx-text)] hover:underline"
              >
                {LEONIX_OFFICE_ADDRESS}
              </a>
              <a
                href={LEONIX_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 w-fit text-sm font-semibold text-[color:var(--lx-blue)] hover:text-[color:var(--lx-text)]"
              >
                {pageCopy.openMap}
              </a>
            </li>
            <li className="flex flex-col gap-1 border-b border-[color:var(--lx-border)] pb-4">
              <span className="font-semibold text-[color:var(--lx-text)]">{tiendaContactRankPhone(lang)}</span>
              <a
                href={LEONIX_PHONE_TEL}
                className="w-fit text-lg font-medium text-[color:var(--lx-blue)] hover:text-[color:var(--lx-text)]"
              >
                {LEONIX_PHONE_DISPLAY}
              </a>
            </li>
            <li className="flex flex-col gap-1">
              <span className="font-semibold text-[color:var(--lx-text)]">{tiendaContactRankEmail(lang)}</span>
              <LeonixEmailContactBlock
                email={LEONIX_TIENDA_EMAIL}
                mailtoHref={`${LEONIX_MAILTO_TIENDA}?subject=${encodeURIComponent(mailSubject)}`}
                lang={lang}
                shareTitle={formCopy.title}
                shareText={mailSubject}
              />
            </li>
          </ul>
        </section>

        <TiendaContactForm lang={lang} service={service} sourcePage={sourcePage} sourceCta={sourceCta} />

        <section className="mt-10 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-6">
          <p className="text-sm text-[color:var(--lx-muted)]">{tiendaContactGeneralSiteNote(lang)}</p>
          <Link
            href={withLang(LEONIX_GLOBAL_CONTACT_PATH, lang)}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-[color:var(--lx-border)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-lion)]/35"
          >
            {tiendaContactGeneralSiteCta(lang)}
          </Link>
        </section>
      </div>
    </main>
  );
}
