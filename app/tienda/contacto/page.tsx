import type { Metadata } from "next";
import Link from "next/link";
import { LEONIX_GLOBAL_CONTACT_PATH } from "@/app/data/leonixGlobalContact";
import {
  LEONIX_MAILTO_TIENDA,
  LEONIX_OFFICE_ADDRESS,
  LEONIX_PHONE_DISPLAY,
  LEONIX_PHONE_TEL,
  LEONIX_TIENDA_EMAIL,
} from "../data/leonixContact";
import {
  tiendaContactBackToStore,
  tiendaContactGeneralSiteCta,
  tiendaContactGeneralSiteNote,
  tiendaContactPageSubtitle,
  tiendaContactPageTitle,
  tiendaContactPreferenceIntro,
  tiendaContactRankEmail,
  tiendaContactRankOffice,
  tiendaContactRankPhone,
} from "../data/tiendaContactPageCopy";
import type { Lang } from "../types/tienda";
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

export default async function TiendaContactoPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang: Lang = normalizeLang(sp.lang);

  const mailSubject =
    lang === "en" ? "Tienda — question / quote" : "Tienda — pregunta / cotización";

  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto max-w-3xl px-6 pt-28 pb-20">
        <p className="text-sm">
          <Link
            href={withLang("/tienda", lang)}
            className="font-medium text-[rgba(201,168,74,0.9)] hover:text-[rgba(255,247,226,0.95)]"
          >
            {tiendaContactBackToStore(lang)}
          </Link>
        </p>

        <header className="mt-8 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[rgba(255,247,226,0.96)]">
            {tiendaContactPageTitle(lang)}
          </h1>
          <p className="text-base leading-relaxed text-[rgba(255,255,255,0.72)]">
            {tiendaContactPageSubtitle(lang)}
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-[rgba(201,168,74,0.35)] bg-[linear-gradient(180deg,rgba(201,168,74,0.1),rgba(0,0,0,0.35))] p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgba(201,168,74,0.95)]">
            {lang === "en" ? "How to reach us" : "Cómo contactarnos"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[rgba(255,247,226,0.9)]">
            {tiendaContactPreferenceIntro(lang)}
          </p>
          <ul className="mt-6 space-y-4 text-sm text-[rgba(255,255,255,0.88)]">
            <li className="flex flex-col gap-1 border-b border-[rgba(255,255,255,0.08)] pb-4">
              <span className="font-semibold text-[rgba(201,168,74,0.95)]">{tiendaContactRankOffice(lang)}</span>
              <span className="text-[rgba(255,247,226,0.85)]">{LEONIX_OFFICE_ADDRESS}</span>
            </li>
            <li className="flex flex-col gap-1 border-b border-[rgba(255,255,255,0.08)] pb-4">
              <span className="font-semibold text-[rgba(201,168,74,0.95)]">{tiendaContactRankPhone(lang)}</span>
              <a
                href={LEONIX_PHONE_TEL}
                className="text-lg font-medium text-[rgba(147,196,255,0.95)] hover:text-white w-fit"
              >
                {LEONIX_PHONE_DISPLAY}
              </a>
            </li>
            <li className="flex flex-col gap-1">
              <span className="font-semibold text-[rgba(201,168,74,0.95)]">{tiendaContactRankEmail(lang)}</span>
              <a
                href={`${LEONIX_MAILTO_TIENDA}?subject=${encodeURIComponent(mailSubject)}`}
                className="text-[rgba(147,196,255,0.95)] hover:text-white w-fit break-all"
              >
                {LEONIX_TIENDA_EMAIL}
              </a>
            </li>
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-6">
          <p className="text-sm text-[rgba(255,255,255,0.65)]">{tiendaContactGeneralSiteNote(lang)}</p>
          <Link
            href={withLang(LEONIX_GLOBAL_CONTACT_PATH, lang)}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] px-5 py-2.5 text-sm font-semibold text-[rgba(255,247,226,0.9)] hover:bg-[rgba(255,255,255,0.06)] transition"
          >
            {tiendaContactGeneralSiteCta(lang)}
          </Link>
        </section>
      </div>
    </main>
  );
}
