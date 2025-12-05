"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlLang = searchParams.get("lang");
  const [lang, setLang] = useState<"es" | "en">(urlLang === "en" ? "en" : "es");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide navbar on cinematic intro
  if (pathname === "/") return null;

  useEffect(() => {
    if (urlLang === "es" || urlLang === "en") setLang(urlLang);
  }, [urlLang]);

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
      advertise: "Anúnciate",
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
  };

  const L = t[lang];

  // Fix Inicio/Home → always goes to /home?lang={}
  const buildLink = (href: string) => {
    if (href === "/") return `/home?lang=${lang}`;
    const cleanHref = href.split("?")[0];
    return `${cleanHref}?lang=${lang}`;
  };

  const switchLang = (target: "es" | "en") => {
    const clean = pathname.split("?")[0];
    router.push(`${clean}?lang=${target}`);
  };

  const navLinks = [
    { href: "/", label: L.home },
    { href: "/noticias", label: L.news },
    { href: "/eventos", label: L.events },
    { href: "/coupons", label: L.coupons },
    { href: "/sorteos", label: L.sweepstakes },
    { href: "/magazine", label: L.magazine },
    { href: "/tienda", label: L.shop },
    { href: "/clasificados", label: L.classifieds },
    { href: "/contacto", label: L.contact },
    { href: "/about", label: L.about },
    { href: "/advertise", label: L.advertise, gold: true },
  ];

  return (
    <nav
      className="
        fixed top-0 left-0 w-full z-50
        backdrop-blur-md bg-black/40
        border-b-0 py-2 px-6
        flex justify-center items-center
      "
    >
      {/* DESKTOP MENU */}
      <div className="hidden md:flex gap-8 text-white text-sm font-medium">
        {navLinks.map((item, i) => (
          <Link
            key={i}
            href={buildLink(item.href)}
            className={
              item.gold
                ? "text-yellow-300 font-bold"
                : "hover:text-yellow-200 transition"
            }
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* LANGUAGE TOGGLE */}
      <div className="hidden md:flex gap-3 absolute right-6 text-sm">
        <button
          onClick={() => switchLang("es")}
          className={lang === "es" ? "text-yellow-400 font-semibold" : "text-white/70"}
        >
          ES
        </button>
        <span className="text-white/40">|</span>
        <button
          onClick={() => switchLang("en")}
          className={lang === "en" ? "text-yellow-400 font-semibold" : "text-white/70"}
        >
          EN
        </button>
      </div>

      {/* MOBILE HAMBURGER */}
      <button
        className="md:hidden text-white text-2xl absolute right-6"
        onClick={() => setMobileOpen(true)}
      >
        ☰
      </button>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div
          className="
            fixed top-0 right-0 
            min-h-[70vh] w-64
            bg-black/90 backdrop-blur-xl
            rounded-l-2xl shadow-[0_0_20px_rgba(0,0,0,0.8)]
            z-[999] p-6 pt-10 flex flex-col gap-6
          "
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="text-white text-3xl self-end"
          >
            ×
          </button>

          {navLinks.map((item, i) => (
            <Link
              key={i}
              href={buildLink(item.href)}
              onClick={() => setMobileOpen(false)}
              className={`
                text-lg font-semibold 
                ${item.gold ? "text-yellow-300" : "text-white"}
              `}
            >
              {item.label}
            </Link>
          ))}

          {/* LANGUAGE TOGGLE MOBILE */}
          <div className="flex gap-6 pt-6 text-white text-lg font-semibold">
            <button
              onClick={() => {
                switchLang("es");
                setMobileOpen(false);
              }}
              className={lang === "es" ? "text-yellow-400" : ""}
            >
              ES
            </button>

            <button
              onClick={() => {
                switchLang("en");
                setMobileOpen(false);
              }}
              className={lang === "en" ? "text-yellow-400" : ""}
            >
              EN
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  );
}
