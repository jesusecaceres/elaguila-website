"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CookiePreferencesTrigger } from "./CookiePreferencesTrigger";
import {
  LEONIX_GLOBAL_EMAIL,
  LEONIX_GLOBAL_MAILTO,
  LEONIX_GLOBAL_PHONE_DISPLAY,
  LEONIX_GLOBAL_PHONE_TEL,
  LEONIX_MEDIA_BRAND,
} from "@/app/data/leonixGlobalContact";
import { LEONIX_GLOBAL_LLC, LEONIX_MEDIA_SLOGAN, LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

type Lang = "es" | "en";

const COPY = {
  es: {
    followUs: "Síguenos",
    contact: "Contacto",
    advertise: "Anúnciate",
    promoProducts: "Productos para Promoción",
    cookiePrefs: "Preferencias de cookies",
    learnMore: "Más información",
    email: "Correo",
    phone: "Teléfono",
    advertiseBody:
      "conecta negocios, clasificados y comunidad en un solo ecosistema bilingüe para el Área de la Bahía y el norte de California.",
    socialNote: "Próximamente en redes.",
    companyNote: "Una empresa bajo",
  },
  en: {
    followUs: "Follow us",
    contact: "Contact",
    advertise: "Advertise",
    promoProducts: "Promotional Products",
    cookiePrefs: "Cookie preferences",
    learnMore: "Learn more",
    email: "Email",
    phone: "Phone",
    advertiseBody:
      "connects businesses, classifieds, and community in one bilingual ecosystem for the Bay Area and Northern California.",
    socialNote: "Social channels coming soon.",
    companyNote: "A company under",
  },
} as const;

function FooterInner() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const t = COPY[lang];

  const langQuery = `?lang=${lang}`;

  return (
    <footer className="mt-20 w-full border-t border-[color:var(--lx-border)] bg-[color:var(--lx-section)] py-12 text-[color:var(--lx-text)]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 md:grid-cols-3">
        {/* Column 1: Contact */}
        <div>
          <h3 className="mb-3 text-xl font-bold text-[color:var(--lx-lion)]">{t.contact}</h3>
          <ul className="space-y-2.5">
            <li>
              <span className="text-sm text-[color:var(--lx-muted)]">{t.email}:</span>{" "}
              <a
                href={LEONIX_GLOBAL_MAILTO}
                className="break-all text-sm font-medium underline decoration-[color:var(--lx-lion)] underline-offset-4 transition hover:text-[color:var(--lx-lion)]"
              >
                {LEONIX_GLOBAL_EMAIL}
              </a>
            </li>
            <li>
              <span className="text-sm text-[color:var(--lx-muted)]">{t.phone}:</span>{" "}
              <a
                href={LEONIX_GLOBAL_PHONE_TEL}
                className="inline-flex min-h-[44px] items-center text-sm font-medium underline decoration-[color:var(--lx-lion)] underline-offset-4 transition hover:text-[color:var(--lx-lion)]"
              >
                {LEONIX_GLOBAL_PHONE_DISPLAY}
              </a>
            </li>
          </ul>
          <p className="mt-3 text-xs text-[color:var(--lx-muted)]">
            {t.companyNote} {LEONIX_GLOBAL_LLC}.
          </p>
        </div>

        {/* Column 2: Advertise + Links */}
        <div>
          <h3 className="mb-3 text-xl font-bold text-[color:var(--lx-lion)]">{t.advertise}</h3>
          <p className="text-sm text-[color:var(--lx-text-2)]">
            {LEONIX_MEDIA_BRAND} {t.advertiseBody}
          </p>
          <Link
            href={`/contacto${langQuery}`}
            className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold underline decoration-[color:var(--lx-lion)] underline-offset-4 transition hover:text-[color:var(--lx-lion)]"
          >
            {t.learnMore} →
          </Link>
        </div>

        {/* Column 3: Promotional products + Follow */}
        <div className="space-y-5">
          <div>
            <h3 className="mb-3 text-xl font-bold text-[color:var(--lx-lion)]">{t.promoProducts}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/productos-promocion${langQuery}`}
                  className="inline-flex min-h-[44px] items-center text-sm font-medium underline decoration-[color:var(--lx-lion)] underline-offset-4 transition hover:text-[color:var(--lx-lion)]"
                >
                  {t.promoProducts}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[color:var(--lx-muted)]">
              {t.followUs}
            </h3>
            <a
              href={LEONIX_SITE_ORIGIN}
              className="text-sm font-medium text-[color:var(--lx-text-2)] transition hover:text-[color:var(--lx-lion)]"
              rel="noopener noreferrer"
            >
              {LEONIX_SITE_ORIGIN.replace(/^https:\/\//, "")}
            </a>
            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{t.socialNote}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 px-4 text-center">
        <CookiePreferencesTrigger labelEs={COPY.es.cookiePrefs} labelEn={COPY.en.cookiePrefs} />
        <p className="max-w-xl text-sm text-[color:var(--lx-muted)]">{LEONIX_MEDIA_SLOGAN}</p>
        <p className="text-sm text-[color:var(--lx-muted)]">
          © {new Date().getFullYear()} {LEONIX_MEDIA_BRAND} · {LEONIX_GLOBAL_LLC}
        </p>
      </div>
    </footer>
  );
}

export default function Footer() {
  return (
    <Suspense fallback={null}>
      <FooterInner />
    </Suspense>
  );
}
