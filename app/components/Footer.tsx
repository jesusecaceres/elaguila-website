"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CookiePreferencesTrigger } from "./CookiePreferencesTrigger";
import { VisibleEmailWithCopy } from "@/app/components/contact/LeonixEmailContactBlock";
import {
  LEONIX_GLOBAL_EMAIL,
  LEONIX_GLOBAL_PHONE_DISPLAY,
  LEONIX_GLOBAL_PHONE_TEL,
} from "@/app/data/leonixGlobalContact";
import { LEONIX_MAP_URL } from "@/app/(site)/tienda/data/leonixContact";
import { LEONIX_GLOBAL_LLC } from "@/app/lib/leonixBrand";
import { FOOTER_DISPLAY_ADDRESS, getPublicFooterCopy } from "@/app/lib/leonix/publicFooterCopy";
import { getPublicNavItemLabel } from "@/app/lib/leonix/publicNavCopy";
import { normalizeLang, replaceLangInHref } from "@/app/lib/language";
import { getPublicChromeCopy } from "@/app/lib/leonix/publicChromeCopy";

const EXPLORE_LINKS = [
  { id: "noticias", href: "/noticias" },
  { id: "revista", href: "/magazine" },
  { id: "clasificados", href: "/clasificados" },
  { id: "negocios-locales", href: "/negocios-locales" },
  { id: "recursos-comunitarios", href: "/recursos-comunitarios" },
  { id: "viajes", href: "/clasificados/viajes" },
  { id: "iglesias", href: "/iglesias" },
  { id: "productos-promocionales", href: "/productos-promocion" },
] as const;

const COMMUNITY_LINKS = [
  { id: "comunidad-eventos", href: "/clasificados/comunidad" },
  { id: "clases", href: "/clasificados/clases" },
] as const;

const FOOTER_LINK_CLASS =
  "inline-block min-h-[44px] py-2 text-sm font-medium leading-snug text-[#3D3428] underline decoration-[#C9A84A]/40 underline-offset-4 transition hover:text-[#7A1E2C]";

const FOOTER_COMPANY_LINK_CLASS =
  "inline-block min-h-[44px] py-2 text-sm font-medium leading-snug text-[#7A1E2C] underline decoration-[#C9A84A]/60 underline-offset-4 hover:text-[#5e1721]";

function FooterInner() {
  const searchParams = useSearchParams();
  const routeLang = normalizeLang(searchParams?.get("lang"));
  const f = getPublicFooterCopy(routeLang);
  const chrome = getPublicChromeCopy(routeLang);

  const withLang = (path: string) => replaceLangInHref(path, routeLang);

  return (
    <footer className="mt-20 w-full border-t border-[#D6C7AD] bg-[#FAF6EE] py-12 text-[#1F241C]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Column 1 — Leonix Media */}
        <div>
          <h3 className="font-serif text-xl font-bold text-[#2A4536]">{f.companyTitle}</h3>
          <p className="mt-1 text-sm font-semibold text-[#556B3E]">{f.tagline}</p>
          <p className="mt-3 text-sm leading-relaxed text-[#3D3428]">{f.companySummary}</p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href={withLang("/about")} className={FOOTER_COMPANY_LINK_CLASS}>
                {f.aboutUs}
              </Link>
            </li>
            <li>
              <Link href={withLang("/contacto")} className={FOOTER_COMPANY_LINK_CLASS}>
                {f.contactUs}
              </Link>
            </li>
            <li>
              <Link href={withLang("/media-kit")} className={FOOTER_COMPANY_LINK_CLASS}>
                {f.mediaKit}
              </Link>
            </li>
            <li>
              <Link href={withLang("/contacto")} className={FOOTER_COMPANY_LINK_CLASS}>
                {f.advertise}
              </Link>
            </li>
          </ul>
          <h3 className="mt-8 font-serif text-lg font-bold text-[#2A4536]">{f.contactColumn}</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#3D3428]">
            <li>
              <span className="block text-xs font-bold uppercase tracking-wide text-[#556B3E]">{f.emailLabel}</span>
              <VisibleEmailWithCopy email={LEONIX_GLOBAL_EMAIL} lang={routeLang} className="mt-0.5" />
            </li>
            <li>
              <span className="block text-xs font-bold uppercase tracking-wide text-[#556B3E]">{f.phoneLabel}</span>
              <a
                href={LEONIX_GLOBAL_PHONE_TEL}
                className="mt-0.5 inline-flex min-h-[44px] items-center font-medium text-[#7A1E2C] underline decoration-[#C9A84A]/60 underline-offset-4 hover:text-[#5e1721]"
              >
                {LEONIX_GLOBAL_PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <span className="block text-xs font-bold uppercase tracking-wide text-[#556B3E]">{f.addressLabel}</span>
              <a
                href={LEONIX_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block leading-relaxed font-medium text-[#3D3428] underline decoration-[#C9A84A]/40 underline-offset-4 hover:text-[#7A1E2C]"
              >
                {FOOTER_DISPLAY_ADDRESS}
              </a>
            </li>
          </ul>
        </div>

        {/* Column 2 — Explore */}
        <div>
          <h3 className="font-serif text-lg font-bold text-[#2A4536]">{f.explore}</h3>
          <ul className="mt-4 space-y-2">
            {EXPLORE_LINKS.map((item) => (
              <li key={item.id}>
                <Link href={withLang(item.href)} className={FOOTER_LINK_CLASS}>
                  {getPublicNavItemLabel(item.id, routeLang)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 — Community utility */}
        <div>
          <h3 className="font-serif text-lg font-bold text-[#2A4536]">{f.community}</h3>
          <ul className="mt-4 space-y-2">
            {COMMUNITY_LINKS.map((item) => (
              <li key={item.id}>
                <Link href={withLang(item.href)} className={FOOTER_LINK_CLASS}>
                  {getPublicNavItemLabel(item.id, routeLang)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4 — Legal / Trust */}
        <div>
          <h3 className="font-serif text-lg font-bold text-[#2A4536]">{f.legalTrust}</h3>
          <nav className="mt-4 flex flex-col" aria-label={chrome.legalNavAria}>
            <Link href={withLang("/legal")} className={FOOTER_LINK_CLASS}>
              {chrome.legal}
            </Link>
            <Link href={withLang("/privacy")} className={FOOTER_LINK_CLASS}>
              {chrome.privacy}
            </Link>
            <Link href={withLang("/terms")} className={FOOTER_LINK_CLASS}>
              {chrome.terms}
            </Link>
            <Link href={withLang("/data-deletion")} className={FOOTER_LINK_CLASS}>
              {chrome.dataDeletion}
            </Link>
            <CookiePreferencesTrigger label={chrome.cookiePrefs} />
          </nav>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-[#D6C7AD]/60 px-6 pt-8 text-center">
        <p className="text-sm font-medium text-[#556B3E]">{f.bottomSlogan}</p>
        <p className="mt-2 text-sm text-[#3D3428]/80">
          © {new Date().getFullYear()} Leonix Media · {LEONIX_GLOBAL_LLC}
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
