"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlLang = searchParams.get("lang");

  const [lang, setLang] = useState(urlLang || "es");

  useEffect(() => {
    if (!pathname) return;

    if (pathname.startsWith("/magazine")) {
      setLang("en");
      return;
    }

    if (pathname.startsWith("/revista")) {
      setLang("es");
      return;
    }

    if (urlLang === "en" || urlLang === "es") {
      setLang(urlLang);
    }
  }, [pathname, urlLang]);

  const buildLink = (href: string) => {
    const cleanHref = href.split("?")[0];
    return `${cleanHref}?lang=${lang}`;
  };

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

  return (
    <nav
      className="
        fixed top-0 left-0 w-full z-50
        backdrop-blur-md bg-black/40
        border-b border-white/10
        py-4 px-6 flex justify-between items-center
      "
    >
      <Link href={buildLink("/")}>
        <span className="text-2xl font-bold text-yellow-400 drop-shadow">
          El Águila
        </span>
      </Link>

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

      <div className="flex gap-3">
        <Link href={buildLink(pathname)}>
          <span
            className={lang === "es" ? "text-yellow-400" : "text-white/70"}
            onClick={() => setLang("es")}
          >
            ES
          </span>
        </Link>
        <span className="text-white/40">|</span>
        <Link href={buildLink(pathname)}>
          <span
            className={lang === "en" ? "text-yellow-400" : "text-white/70"}
            onClick={() => setLang("en")}
          >
            EN
          </span>
        </Link>
      </div>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarInner />
    </Suspense>
  );
}
