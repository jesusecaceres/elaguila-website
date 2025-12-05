"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlLang = searchParams.get("lang");
  const [lang, setLang] = useState<"es" | "en">(urlLang === "en" ? "en" : "es");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide navbar on cinematic intro (homepage /)
  if (pathname === "/") return null;

  useEffect(() => {
    if (urlLang === "en" || urlLang === "es") {
      setLang(urlLang);
    }
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
      toggleES: "ES",
      toggleEN: "EN",
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
      toggleES: "ES",
      toggleEN: "EN",
    },
  };

  const L = t[lang];

  const buildLink = (href: string) => {
    const cleanHref = href.split("?")[0];
    return `${cleanHref}?lang=${lang}`;
  };

  const switchLang = (target: "es" | "en") => {
    const cleanPath = pathname.split("?")[0];
    router.push(`${cleanPath}?lang=${target}`);
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
        fixed top-0 left-0 w-full z-50 backdrop-blur-md
        bg-black/40 border-b border-white/10 py-4 px-6
        flex justify-between items-center
      "
    >
      {/* LEFT – LOGO */}
      <Link href={buildLink("/")} className="flex items-center">
        <Image
          src="/logo.png"
          alt="El Águila Logo"
          width={130}
          height={50}
          className="object-contain drop-shadow"
        />
      </Link>

      {/* DESKTOP MENU */}
      <div className="hidden md:flex gap-6 text-white text-sm font-medium">
        {navLinks.map((item, i) => (
          <Link
            key={i}
            href={buildLink(item.href)}
            className={item.gold ? "text-yellow-300 font-semibold" : ""}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* LANGUAGE TOGGLE */}
      <div className="hidden md:flex gap-3">
        <button
          onClick={() => switchLang("es")}
          className={lang === "es" ? "text-yellow-400" : "text-white/70"}
        >
          ES
        </button>
        <span className="text-white/40">|</span>
        <button
          onClick={() => switchLang("en")}
          className={lang === "en" ? "text-yellow-400" : "text-white/70"}
        >
          EN
        </button>
      </div>

      {/* MOBILE HAMBURGER */}
      <button
        className="md:hidden text-white text-2xl"
        onClick={() => setMobileOpen(true)}
      >
        ☰
      </button>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div
          className="
            fixed top-0 right-0 h-full w-64 bg-black/80
            backdrop-blur-xl z-[999] p-6 flex flex-col gap-6
          "
        >
          {/* Close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="text-white text-3xl self-end"
          >
            ×
          </button>

          {/* Mobile Nav Links */}
          {navLinks.map((item, i) => (
            <Link
              key={i}
              href={buildLink(item.href)}
              onClick={() => setMobileOpen(false)}
              className={`
                text-lg ${item.gold ? "text-yellow-300" : "text-white"}
              `}
            >
              {item.label}
            </Link>
          ))}

          {/* Mobile Lang Toggle */}
          <div className="flex gap-4 pt-4 text-white text-lg">
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
