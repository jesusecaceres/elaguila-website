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

function LaunchCtaLink({ lang, label, className }: { lang: Lang; label: string; className?: string }) {
  return (
    <Link
      href={launchHref(lang)}
      className={
        className ??
        "inline-flex min-h-[2.25rem] shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_4px_14px_-4px_rgba(122,30,44,0.5)] transition-colors hover:bg-[#5e1721] sm:min-h-[2.375rem] sm:px-4 sm:py-2 sm:text-sm"
      }
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
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#EDE6D6]/50 to-transparent"
        aria-hidden
      />

      <header className="relative border-b border-[#D6C7AD] bg-[#FAF6EE] shadow-[0_1px_0_0_rgba(201,168,74,0.35)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 py-1.5 sm:gap-3 sm:py-2 lg:gap-4">
            <Link href="#inicio" className="block shrink-0 bg-[#FAF6EE] leading-none">
              <Image
                src="/logo-clean.png"
                alt="Leonix Media"
                width={172}
                height={60}
                className="h-auto w-[124px] max-w-[135px] bg-transparent object-contain object-left sm:w-[132px] lg:w-[172px] lg:max-w-[190px]"
                priority
              />
            </Link>

            <nav
              className="hidden min-w-0 flex-1 items-center justify-center gap-x-5 gap-y-1 text-[0.9rem] font-medium text-[#3D3428] lg:flex xl:gap-x-6"
              aria-label={t.navAria}
            >
              {t.nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={
                    item.active
                      ? "whitespace-nowrap text-[#7A1E2C] underline decoration-[#7A1E2C] decoration-2 underline-offset-[0.35em]"
                      : "whitespace-nowrap hover:text-[#7A1E2C]"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
              <div
                className="flex rounded-full border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 text-xs font-semibold"
                role="group"
                aria-label={t.langAria}
              >
                {(["es", "en"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    className={`min-h-[2rem] min-w-[3.5rem] rounded-full px-2 py-1 transition-colors sm:min-h-[2.25rem] sm:min-w-[4rem] sm:px-2.5 sm:py-1.5 ${
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
            className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
            aria-label={t.navAria}
          >
            {t.nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
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
        className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16"
        aria-label={t.mainAria}
      >
        <p className="max-w-md text-sm leading-relaxed text-[#5F6258]">{t.placeholder}</p>
      </main>
    </div>
  );
}
