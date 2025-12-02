"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlLang = searchParams.get("lang");

  const [lang, setLang] = useState(urlLang || "es");

  // -------------------------------------------
  // 🔥 AUTO-DETECT LANGUAGE FOR MAGAZINE/REVISTA
  // -------------------------------------------
  useEffect(() => {
    if (!pathname) return;

    if (pathname.startsWith("/magazine")) {
      setLang("en"); // FORCE ENGLISH
      return;
    }

    if (pathname.startsWith("/revista")) {
      setLang("es"); // FORCE SPANISH
      return;
    }

    // Everywhere else, use ?lang=
    if (urlLang === "en" || urlLang === "es") {
      setLang(urlLang);
    }

  }, [pathname, urlLang]);

  // ------------------------------
  // 🔤 TRANSLATIONS (UNCHANGED)
  // ------------------------------
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
      advertise: "Advertise with us",
    },
  };

  const L = t[lang as "es" | "en"];

  // -----------------------------------------
  // REBUILD CURRENT URL WITH UPDATED ?lang=
  // -----------------------------------------
  const buildLink = (href: string) => {
    if (href.includes("?")) return `${href}&lang=${lang}`;
    return `${href}?lang=${lang}`;
  };

  // -----------------------------------------
  // UI (UNCHANGED)
  // -----------------------------------------
  return (
    <nav
      className="
        fixed top-0 left-0 w-full z-50
        backdrop-blur-md bg-black/40
        border-b border-white/10
        py-4 px-6 flex justify-between items-center
      "
    >
      {/* LOGO */}
      <Link href={buildLink("/")}>
        <span className="text-2xl font-bold text-yellow-400 drop-shadow">
          El Águila
        </span>
      </Link>

      {/* NAV LINKS */}
      <div className="hidden md:flex gap-6 text-white text-sm font-medium">
        <Link href={buildLink("/")}>{L.home}</Link>
        <Link href={buildLink("/noticias")}>{L.news}</Link>
        <Link href={buildLink("/eventos")}>{L.events}</Link>
        <Link href={buildLink("/coupons")}>{L.coupons}</Link>
        <Link href={buildLink("/sorteos")}>{L.sweepstakes}</Link>
        <Link href={buildLink("/magazine")}>{L.magazine}</Link>
        <Link href={buildLink("/tienda")}>{L.shop}</Link>
        <Link href={buildLink("/clasificados")}>{L.classifieds}</Link>
        <Link href={buildLink("/contacto")}>{L.contact}</Link>
        <Link href={buildLink("/about")}>{L.about}</Link>
        <Link href={buildLink("/advertise")} className="text-yellow-300">
          {L.advertise}
        </Link>
      </div>

      {/* LANGUAGE TOGGLE */}
      <div className="flex gap-3">
        <Link href={buildLink(pathname + "?lang=es")}>
          <span className={lang === "es" ? "text-yellow-400" : "text-white/70"}>
            ES
          </span>
        </Link>
        <span className="text-white/40">|</span>
        <Link href={buildLink(pathname + "?lang=en")}>
          <span className={lang === "en" ? "text-yellow-400" : "text-white/70"}>
            EN
          </span>
        </Link>
      </div>
    </nav>
  );
}
