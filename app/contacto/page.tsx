import type { Metadata } from "next";
import Link from "next/link";
import { GlobalContactForm } from "@/app/components/contact/GlobalContactForm";
import {
  LEONIX_GLOBAL_CONTACT_PATH,
  LEONIX_MEDIA_BRAND,
} from "@/app/data/leonixGlobalContact";
import { LEONIX_TIENDA_CONTACT_PATH } from "@/app/tienda/data/leonixContact";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { ContactoPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeContactoCopy } from "@/app/lib/siteSectionContent/contactoMerge";

type Lang = "es" | "en";

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
  const title = lang === "en" ? `Contact · ${LEONIX_MEDIA_BRAND}` : `Contacto · ${LEONIX_MEDIA_BRAND}`;
  const description =
    lang === "en"
      ? `General inquiries for ${LEONIX_MEDIA_BRAND}.`
      : `Consultas generales para ${LEONIX_MEDIA_BRAND}.`;
  return { title, description, openGraph: { title, description } };
}

export default async function ContactoPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const swap = lang === "en" ? "es" : "en";

  const { payload } = await getSiteSectionPayload("contacto");
  const copy = mergeContactoCopy(lang, payload as unknown as ContactoPayload);

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
          <h2 className="mb-3 text-xl font-semibold text-[color:var(--lx-text)]">{copy.tiendaTitle}</h2>
          <p className="mb-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]/90">{copy.tiendaBody}</p>
          <Link
            href={withLang(LEONIX_TIENDA_CONTACT_PATH, lang)}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-cta-dark)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-light)] transition hover:opacity-95"
          >
            {copy.tiendaCta}
          </Link>
        </div>

        <div className="mb-12 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-[0_18px_48px_rgba(42,36,22,0.10)]">
          <h2 className="mb-4 text-2xl font-semibold text-[color:var(--lx-text)]">{copy.business}</h2>

          <div className="space-y-3 text-[color:var(--lx-text-2)]/90">
            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">{copy.emailLabel}:</span>{" "}
              <a href={copy.mailto} className="underline hover:opacity-80">
                {copy.email}
              </a>
            </p>

            {copy.phoneLine ? (
              <p>
                <span className="font-semibold text-[color:var(--lx-text)]">
                  {lang === "en" ? "Phone" : "Teléfono"}:
                </span>{" "}
                {copy.phoneLine}
              </p>
            ) : null}

            {copy.addressLine ? (
              <p>
                <span className="font-semibold text-[color:var(--lx-text)]">
                  {lang === "en" ? "Address" : "Dirección"}:
                </span>{" "}
                {copy.addressLine}
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

        <GlobalContactForm lang={lang} />
      </div>
    </main>
  );
}
