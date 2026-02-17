"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";

type Lang = "es" | "en";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function NavbarContent() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlLang = searchParams?.get("lang");
  const [lang, setLang] = useState<Lang>(urlLang === "en" ? "en" : "es");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide navbar on cinematic intro
  if (pathname === "/") return null;

  useEffect(() => {
    if (urlLang === "es" || urlLang === "en") setLang(urlLang);
  }, [urlLang]);

  // Close mobile drawer on route changes (safety)
  useEffect(() => {
    setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, urlLang]);

  // Prevent body scroll behind mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const t = useMemo(
    () => ({
      es: {
        home: "Inicio",
        magazine: "Revista",
        classifieds: "Clasificados",
        coupons: "Cupones",
        shop: "Tienda",
        news: "Noticias",
        contact: "Contacto",
        about: "Nosotros",
        churches: "Iglesias",
        advertise: "Anúnciate",
      },
      en: {
        home: "Home",
        magazine: "Magazine",
        classifieds: "Classifieds",
        coupons: "Coupons",
        shop: "Shop",
        news: "News",
        contact: "Contact",
        about: "About Us",
        churches: "Churches",
        advertise: "Advertise",
      },
    }),
    []
  );

  const L = t[lang];

  // Inicio/Home → always goes to /home?lang={}
  const buildLink = (href: string) => {
    if (href === "/") return `/home?lang=${lang}`;
    const cleanHref = href.split("?")[0];
    return `${cleanHref}?lang=${lang}`;
  };

  const isActive = (href: string) => {
    const cleanHref = href.split("?")[0];
    if (cleanHref === "/") return pathname === "/home";
    // Exact match or nested route match (e.g., /clasificados/*)
    return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
  };

  // Preserve current query params, only switch lang.
  const switchLang = (target: Lang) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("lang", target);
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  // NAV ORDER (LOCKED)
  const navLinks: Array<{ href: string; label: string; gold?: boolean }> = [
    { href: "/", label: L.home },
    { href: "/magazine", label: L.magazine },
    { href: "/clasificados", label: L.classifieds },
    { href: "/coupons", label: L.coupons },
    { href: "/tienda", label: L.shop },
    { href: "/noticias", label: L.news },
    { href: "/contacto", label: L.contact },
    { href: "/about", label: L.about },
    { href: "/iglesias", label: L.churches },
    { href: "/advertise", label: L.advertise, gold: true },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      <div
        className="
          backdrop-blur-md bg-black/40
          border-b border-white/10 py-2 px-4 sm:px-6
          flex justify-center items-center
        "
      >
        {/* DESKTOP MENU */}
        <div className="hidden md:flex gap-7 text-white text-sm font-medium tracking-tight">
          {navLinks.map((item, i) => {
            const active = isActive(item.href);
            return (
              <Link
                key={i}
                href={buildLink(item.href)}
                className={cx(
                  "transition",
                  item.gold
                    ? "text-yellow-300 font-bold"
                    : active
                    ? "text-yellow-200"
                    : "text-white hover:text-yellow-200"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* LANGUAGE TOGGLE */}
        <div className="hidden md:flex gap-3 absolute right-6 text-sm">
          <button
            onClick={() => switchLang("es")}
            className={lang === "es" ? "text-yellow-400 font-semibold" : "text-white/70"}
            aria-label="Cambiar idioma a Español"
          >
            ES
          </button>
          <span className="text-white/40">|</span>
          <button
            onClick={() => switchLang("en")}
            className={lang === "en" ? "text-yellow-400 font-semibold" : "text-white/70"}
            aria-label="Switch language to English"
          >
            EN
          </button>
        </div>

        {/* MOBILE HAMBURGER */}
        <button
          className="md:hidden text-white text-xl absolute right-6"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {/* MOBILE OVERLAY + DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[999]">
          {/* overlay */}
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />

          {/* drawer */}
          <div
            className="
              absolute top-0 right-0
              min-h-[70vh] w-72 max-w-[85vw]
              bg-black/90 backdrop-blur-xl
              rounded-l-2xl shadow-[0_0_20px_rgba(0,0,0,0.8)]
              p-6 pt-10 flex flex-col gap-6
              border-l border-white/10
            "
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="text-white text-3xl self-end"
              aria-label="Close menu"
            >
              ×
            </button>

            {navLinks.map((item, i) => (
              <Link
                key={i}
                href={buildLink(item.href)}
                onClick={() => setMobileOpen(false)}
                className={cx(
                  "text-base font-semibold",
                  item.gold ? "text-yellow-300" : "text-white",
                  isActive(item.href) && !item.gold && "text-yellow-200"
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* LANGUAGE TOGGLE MOBILE */}
            <div className="flex gap-6 pt-6 text-white text-base font-semibold">
              <button
                onClick={() => {
                  switchLang("es");
                  setMobileOpen(false);
                }}
                className={lang === "es" ? "text-yellow-400" : ""}
                aria-label="Cambiar idioma a Español"
              >
                ES
              </button>

              <button
                onClick={() => {
                  switchLang("en");
                  setMobileOpen(false);
                }}
                className={lang === "en" ? "text-yellow-400" : ""}
                aria-label="Switch language to English"
              >
                EN
              </button>
            </div>
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
