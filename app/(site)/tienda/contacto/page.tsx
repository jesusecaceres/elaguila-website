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
  tiendaContactGoHome,
  tiendaContactPageSubtitle,
  tiendaContactPageTitle,
  tiendaContactPreferenceIntro,
  tiendaContactRankEmail,
  tiendaContactRankOffice,
  tiendaContactRankPhone,
} from "../data/tiendaContactPageCopy";
import type { Lang } from "../types/tienda";
import { TiendaContactForm } from "../components/TiendaContactForm";
import { normalizeLang, withLang } from "../utils/tiendaRouting";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const title =
    lang === "en" ? "Tienda help & contact · Leonix" : "Ayuda y contacto Tienda · Leonix";
  const description =
    lang === "en"
      ? "Office, phone, and Tienda email for print orders and quotes. Prefer visit or call."
      : "Oficina, teléfono y correo Tienda para pedidos y cotizaciones. Preferimos visita o llamada.";
  return { title, description, openGraph: { title, description } };
}

export default async function TiendaContactoPage(props: { searchParams?: Promise<{ lang?: string; service?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang: Lang = normalizeLang(sp.lang);
  const service = typeof sp.service === "string" && sp.service.trim() ? sp.service.trim().slice(0, 120) : undefined;

  const mailSubject =
    lang === "en" ? "Tienda — question / quote" : "Tienda — pregunta / cotización";

  return (
    <main className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="mx-auto max-w-3xl px-6 pt-28 pb-20">
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label={lang === "en" ? "Contact navigation" : "Navegación de contacto"}>
          <Link
            href={withLang("/productos-promocion", lang)}
            className="font-medium text-[color:var(--lx-lion)] hover:text-[color:var(--lx-text)]"
          >
            {tiendaContactBackToProducts(lang)}
          </Link>
          <Link
            href={withLang("/", lang)}
            className="font-medium text-[color:var(--lx-lion)] hover:text-[color:var(--lx-text)]"
          >
            {tiendaContactGoHome(lang)}
          </Link>
        </nav>

        <header className="mt-8 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[color:var(--lx-text)]">
            {tiendaContactPageTitle(lang)}
          </h1>
          <p className="text-base leading-relaxed text-[color:var(--lx-muted)]">
            {tiendaContactPageSubtitle(lang)}
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-6 sm:p-8 shadow-[0_12px_40px_rgba(42,36,22,0.08)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--lx-lion)]">
            {lang === "en" ? "How to reach us" : "Cómo contactarnos"}
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
                {lang === "en" ? "Open map" : "Abrir mapa"}
              </a>
            </li>
            <li className="flex flex-col gap-1 border-b border-[color:var(--lx-border)] pb-4">
              <span className="font-semibold text-[color:var(--lx-text)]">{tiendaContactRankPhone(lang)}</span>
              <a
                href={LEONIX_PHONE_TEL}
                className="text-lg font-medium text-[color:var(--lx-blue)] hover:text-[color:var(--lx-text)] w-fit"
              >
                {LEONIX_PHONE_DISPLAY}
              </a>
            </li>
            <li className="flex flex-col gap-1">
              <span className="font-semibold text-[color:var(--lx-text)]">{tiendaContactRankEmail(lang)}</span>
              <a
                href={`${LEONIX_MAILTO_TIENDA}?subject=${encodeURIComponent(mailSubject)}`}
                className="text-[color:var(--lx-blue)] hover:text-[color:var(--lx-text)] w-fit break-all"
              >
                {LEONIX_TIENDA_EMAIL}
              </a>
            </li>
          </ul>
        </section>

        <TiendaContactForm lang={lang} service={service} />

        <section className="mt-10 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-6">
          <p className="text-sm text-[color:var(--lx-muted)]">{tiendaContactGeneralSiteNote(lang)}</p>
          <Link
            href={withLang(LEONIX_GLOBAL_CONTACT_PATH, lang)}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-[color:var(--lx-border)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:border-[color:var(--lx-lion)]/35 transition"
          >
            {tiendaContactGeneralSiteCta(lang)}
          </Link>
        </section>
      </div>
    </main>
  );
}
