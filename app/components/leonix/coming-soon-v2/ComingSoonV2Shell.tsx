"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

/** Square emblem — no baked-in checkerboard (logo-clean.png has transparency grid in file). */
const HEADER_LOGO_SRC = "/logo.png";

type Lang = "es" | "en";

type NavItem = { label: string; href: string; active?: boolean };

const COPY: Record<
  Lang,
  {
    nav: NavItem[];
    launchCta: string;
    brandName: string;
    langToggle: { es: string; en: string };
    placeholder: string;
    mainAria: string;
    navAria: string;
    langAria: string;
  }
> = {
  es: {
    nav: [
      { label: "Inicio", href: "#inicio", active: true },
      { label: "Qué obtienes", href: "#que-obtienes" },
      { label: "Cómo funciona", href: "#como-funciona" },
      { label: "Acceso QR", href: "#qr" },
      { label: "Contacto", href: "#contacto" },
    ],
    launchCta: "Únete al lanzamiento",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    placeholder: "Base de lanzamiento lista. El hero se construirá en la siguiente capa.",
    mainAria: "Leonix Media — Vista previa capa 1",
    navAria: "Navegación principal",
    langAria: "Idioma",
  },
  en: {
    nav: [
      { label: "Home", href: "#inicio", active: true },
      { label: "What you get", href: "#que-obtienes" },
      { label: "How it works", href: "#como-funciona" },
      { label: "QR access", href: "#qr" },
      { label: "Contact", href: "#contacto" },
    ],
    launchCta: "Join the launch",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    placeholder: "Launch foundation ready. The hero will be built in the next layer.",
    mainAria: "Leonix Media — Layer 1 preview",
    navAria: "Main navigation",
    langAria: "Language",
  },
};

function launchHref(lang: Lang) {
  return `/contact?interest=launch&lang=${lang}`;
}

function LaunchCtaLink({ lang, label }: { lang: Lang; label: string }) {
  return (
    <Link
      href={launchHref(lang)}
      className="inline-flex min-h-[2rem] shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] px-3 py-1.5 text-[0.7rem] font-bold text-white shadow-[0_3px_10px_-3px_rgba(122,30,44,0.55)] transition-colors hover:bg-[#5e1721] sm:min-h-[2.125rem] sm:px-3.5 sm:text-xs lg:text-sm"
    >
      {label}
    </Link>
  );
}

export function ComingSoonV2Shell() {
  const [lang, setLang] = useState<Lang>("es");
  const t = COPY[lang];

  return (
    <div lang={lang} className="min-h-screen overflow-x-hidden bg-[#F5F0E6] text-[#1F241C]">
      <header className="border-b border-[#D6C7AD] bg-[#FAF6EE] shadow-[0_1px_0_0_rgba(201,168,74,0.35)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-0 py-1.5 sm:gap-x-4 sm:py-2 lg:py-2">
            <Link
              href="#inicio"
              className="flex shrink-0 items-center gap-1.5 sm:gap-2"
              aria-label={t.brandName}
            >
              <span className="inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#120f0c] ring-1 ring-[#C9A84A]/35 sm:h-9 sm:w-9 lg:h-10 lg:w-10">
                <Image
                  src={HEADER_LOGO_SRC}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover object-center"
                  priority
                  aria-hidden
                />
              </span>
              <span className="font-serif text-xs font-bold leading-tight text-[#2A4536] sm:text-sm lg:text-[0.9375rem]">
                {t.brandName}
              </span>
            </Link>

            <nav
              className="hidden min-w-0 items-center justify-center gap-x-4 text-[0.8125rem] font-medium text-[#3D3428] lg:flex xl:gap-x-5 xl:text-[0.875rem]"
              aria-label={t.navAria}
            >
              {t.nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={
                    item.active
                      ? "whitespace-nowrap text-[#7A1E2C] underline decoration-[#7A1E2C] decoration-2 underline-offset-[0.3em]"
                      : "whitespace-nowrap hover:text-[#7A1E2C]"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
              <div
                className="flex rounded-full border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 text-[0.6875rem] font-semibold sm:text-xs"
                role="group"
                aria-label={t.langAria}
              >
                {(["es", "en"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    className={`min-h-[1.875rem] min-w-[3.25rem] rounded-full px-2 py-1 transition-colors sm:min-h-[2rem] sm:min-w-[3.5rem] sm:px-2.5 ${
                      lang === code
                        ? "bg-[#7A1E2C] text-white"
                        : "text-[#3D3428] hover:bg-[#EDE6D6]"
                    }`}
                  >
                    {COPY[code].langToggle[code]}
                  </button>
                ))}
              </div>

              <LaunchCtaLink lang={lang} label={t.launchCta} />
            </div>
          </div>

          <nav
            className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
            aria-label={t.navAria}
          >
            {t.nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold sm:px-3 sm:py-1.5 sm:text-xs ${
                  item.active
                    ? "bg-[#7A1E2C]/10 text-[#7A1E2C] ring-1 ring-[#7A1E2C]/25"
                    : "bg-[#FFFDF7] text-[#3D3428] ring-1 ring-[#D6C7AD]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main
        id="inicio"
        className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14"
        aria-label={t.mainAria}
      >
        <p className="max-w-md text-sm leading-relaxed text-[#5F6258]">{t.placeholder}</p>
      </main>
    </div>
  );
}
