"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Lang = "es" | "en";

type NavItem = { label: string; href: string; active?: boolean };

const COPY: Record<
  Lang,
  {
    nav: NavItem[];
    launchCta: string;
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

export function ComingSoonV2Shell() {
  const [lang, setLang] = useState<Lang>("es");
  const t = COPY[lang];

  return (
    <div lang={lang} className="min-h-screen overflow-x-hidden bg-[#F5F0E6] text-[#1F241C]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#EDE6D6]/80 to-transparent"
        aria-hidden
      />

      <header className="relative border-b border-[#D6C7AD] bg-[#FAF6EE] shadow-[0_1px_0_0_rgba(201,168,74,0.35)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-3.5 sm:py-4">
            <Link href="#inicio" className="shrink-0">
              <Image
                src="/logo-clean.png"
                alt="Leonix Media"
                width={152}
                height={52}
                className="h-9 w-auto object-contain sm:h-10"
                priority
              />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="flex rounded-full border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 text-xs font-semibold sm:text-sm"
                role="group"
                aria-label={t.langAria}
              >
                {(["es", "en"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    className={`min-h-[2.5rem] min-w-[4.5rem] rounded-full px-3 py-2 transition-colors ${
                      lang === code
                        ? "bg-[#7A1E2C] text-white"
                        : "text-[#3D3428] hover:bg-[#EDE6D6]"
                    }`}
                  >
                    {COPY[code].langToggle[code]}
                  </button>
                ))}
              </div>

              <Link
                href={launchHref(lang)}
                className="hidden min-h-[2.5rem] shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(122,30,44,0.55)] transition-colors hover:bg-[#5e1721] sm:inline-flex"
              >
                {t.launchCta}
              </Link>
            </div>
          </div>

          <nav
            className="hidden items-center justify-end gap-6 pb-3.5 text-[0.9rem] font-medium text-[#3D3428] lg:flex"
            aria-label={t.navAria}
          >
            {t.nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={
                  item.active
                    ? "text-[#7A1E2C] underline decoration-[#7A1E2C] decoration-2 underline-offset-[0.4em]"
                    : "hover:text-[#7A1E2C]"
                }
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={launchHref(lang)}
              className="ml-1 min-h-[2.5rem] rounded-full border border-[#C9A84A]/70 bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#5e1721]"
            >
              {t.launchCta}
            </Link>
          </nav>

          <nav
            className="flex items-center gap-2 overflow-x-auto pb-3.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
            aria-label={t.navAria}
          >
            {t.nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${
                  item.active
                    ? "bg-[#7A1E2C]/10 text-[#7A1E2C] ring-1 ring-[#7A1E2C]/25"
                    : "bg-[#FFFDF7] text-[#3D3428] ring-1 ring-[#D6C7AD]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={launchHref(lang)}
              className="shrink-0 whitespace-nowrap rounded-full bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white"
            >
              {t.launchCta}
            </Link>
          </nav>
        </div>
      </header>

      <main
        id="inicio"
        className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
        aria-label={t.mainAria}
      >
        <p className="max-w-md text-sm leading-relaxed text-[#5F6258]">{t.placeholder}</p>
      </main>
    </div>
  );
}
