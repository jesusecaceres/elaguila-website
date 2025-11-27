"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Navbar() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");
  const lang = langParam === "en" ? "en" : "es";

  const labels = {
    es: {
      home: "Inicio",
      news: "Noticias",
      events: "Eventos",
      coupons: "Cupones",
      sweepstakes: "Sorteos",
      magazine: "Revista",
      shop: "Tienda",
      classifieds: "Clasificados",
      contact: "Contacto",
      about: "Nosotros",
      advertise: "Anuncia con nosotros",
    },
    en: {
      home: "Home",
      news: "News",
      events: "Events",
      coupons: "Coupons",
      sweepstakes: "Sweepstakes",
      magazine: "Magazine",
      shop: "Shop",
      classifieds: "Classifieds",
      contact: "Contact",
      about: "About Us",
      advertise: "Advertise",
    },
  } as const;

  type Lang = keyof typeof labels;
  const L = labels[lang as Lang];

  const withLang = (path: string) => `${path}?lang=${lang}`;
  const magazineLink =
    lang === "es"
      ? "/revista/2026/enero?lang=es"
      : "/magazine/2026/january?lang=en";

  return (
    <nav className="w-full py-4 px-6 bg-black/60 backdrop-blur-md fixed top-0 left-0 right-0 z-50 border-b border-yellow-500/40">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* LEFT — LOGO */}
        <Link href={withLang("/home")} className="text-yellow-300 font-extrabold text-2xl drop-shadow-lg tracking-wide">
          EL ÁGUILA
        </Link>

        {/* RIGHT — LINKS */}
        <div className="flex flex-wrap gap-5 text-white font-semibold text-sm md:text-base">
          <Link href={withLang("/home")} className="hover:text-yellow-300 transition">
            {L.home}
          </Link>
          <Link href={withLang("/noticias")} className="hover:text-yellow-300 transition">
            {L.news}
          </Link>
          <Link href={withLang("/eventos")} className="hover:text-yellow-300 transition">
            {L.events}
          </Link>
          <Link href={withLang("/cupones")} className="hover:text-yellow-300 transition">
            {L.coupons}
          </Link>
          <Link href={withLang("/sorteos")} className="hover:text-yellow-300 transition">
            {L.sweepstakes}
          </Link>
          <Link href={magazineLink} className="hover:text-yellow-300 transition">
            {L.magazine}
          </Link>
          <Link href={withLang("/tienda")} className="hover:text-yellow-300 transition">
            {L.shop}
          </Link>
          <Link href={withLang("/clasificados")} className="hover:text-yellow-300 transition">
            {L.classifieds}
          </Link>
          <Link href={withLang("/contacto")} className="hover:text-yellow-300 transition">
            {L.contact}
          </Link>
          <Link href={withLang("/about")} className="hover:text-yellow-300 transition">
            {L.about}
          </Link>
          <Link href={withLang("/advertise")} className="hover:text-yellow-300 transition">
            {L.advertise}
          </Link>
        </div>
      </div>
    </nav>
  );
}
