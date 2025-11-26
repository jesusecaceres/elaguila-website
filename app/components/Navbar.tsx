"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Navbar() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "es";

  const t = {
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
    },
  };

  // Hardcoded to avoid backtick issues
  const magazineLink =
    lang === "es"
      ? "/revista/2026/enero?lang=es"
      : "/magazine/2026/january?lang=en";

  return (
    <nav className="w-full py-4 px-6 bg-black/40 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        <Link
          href={`/home?lang=${lang}`}
          className="text-gold font-bold text-2xl drop-shadow-lg"
        >
          EL ÁGUILA
        </Link>

        <div className="flex gap-6 text-white font-semibold text-lg">

          <Link href={`/home?lang=${lang}`} className="hover:text-gold transition">
            {t[lang].home}
          </Link>

          <Link href={`/noticias?lang=${lang}`} className="hover:text-gold transition">
            {t[lang].news}
          </Link>

          <Link href={`/eventos?lang=${lang}`} className="hover:text-gold transition">
            {t[lang].events}
          </Link>

          <Link href={`/cupones?lang=${lang}`} className="hover:text-gold transition">
            {t[lang].coupons}
          </Link>

          <Link href={`/sorteos?lang=${lang}`} className="hover:text-gold transition">
            {t[lang].sweepstakes}
          </Link>

          <Link href={magazineLink} className="hover:text-gold transition">
            {t[lang].magazine}
          </Link>

          <Link href={`/tienda?lang=${lang}`} className="hover:text-gold transition">
            {t[lang].shop}
          </Link>

          <Link href={`/clasificados?lang=${lang}`} className="hover:text-gold transition">
            {t[lang].classifieds}
          </Link>

          <Link href={`/contacto?lang=${lang}`} className="hover:text-gold transition">
            {t[lang].contact}
          </Link>

          <Link href={`/about?lang=${lang}`} className="hover:text-gold transition">
            {t[lang].about}
          </Link>

        </div>
      </div>
    </nav>
  );
}
