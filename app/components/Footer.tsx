"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FaInstagram, FaFacebook, FaYoutube, FaTiktok } from "react-icons/fa";

export default function Footer() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  const t = {
    es: {
      home: "Inicio",
      magazine: "Revista",
      coupons: "Cupones",
      sweepstakes: "Sorteos",
      winners: "Ganadores",
      rules: "Reglas",
      contact: "Contacto",
      made: "Hecho en San José, California",
      rights: "Todos los derechos reservados."
    },
    en: {
      home: "Home",
      magazine: "Magazine",
      coupons: "Coupons",
      sweepstakes: "Sweepstakes",
      winners: "Winners",
      rules: "Rules",
      contact: "Contact",
      made: "Made in San José, California",
      rights: "All rights reserved."
    }
  }[lang];

  const switchLang = lang === "en" ? "es" : "en";
  const switchLabel = lang === "en" ? "ESP" : "ENG";

  return (
    <footer className="w-full mt-20 bg-black/70 backdrop-blur-xl border-t border-white/10 text-white pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* LEFT */}
        <div>
          <h2 className="text-2xl font-extrabold">El Águila en Vuelo</h2>
          <p className="text-yellow-400 font-semibold">Orgullo Latino Sin Fronteras</p>
          <p className="mt-2 opacity-70">{t.made}</p>
        </div>

        {/* CENTER LINKS */}
        <div className="flex flex-col space-y-2 text-lg">
          <Link href={`/home?lang=${lang}`} className="hover:text-yellow-400">{t.home}</Link>
          <Link href={`/revista?lang=${lang}`} className="hover:text-yellow-400">{t.magazine}</Link>
          <Link href={`/cupones?lang=${lang}`} className="hover:text-yellow-400">{t.coupons}</Link>
          <Link href={`/sorteos?lang=${lang}`} className="hover:text-yellow-400">{t.sweepstakes}</Link>
          <Link href={`/sorteos/ganadores?lang=${lang}`} className="hover:text-yellow-400">{t.winners}</Link>
          <Link href={`/legal/sweepstakes-rules?lang=${lang}`} className="hover:text-yellow-400">{t.rules}</Link>
          <a href="mailto:support@elaguilamedia.com" className="hover:text-yellow-400">{t.contact}</a>
        </div>

        {/* RIGHT SOCIAL ICONS */}
        <div className="flex flex-col space-y-3">
          <div className="flex space-x-5 text-3xl">
            <a href="https://instagram.com/elaguila_magazine" target="_blank" className="hover:text-yellow-400">
              <FaInstagram />
            </a>
            <a href="https://facebook.com/elaguilamagazine" target="_blank" className="hover:text-yellow-400">
              <FaFacebook />
            </a>
            <span className="opacity-30 cursor-not-allowed">
              <FaYoutube />
            </span>
            <span className="opacity-30 cursor-not-allowed">
              <FaTiktok />
            </span>
          </div>

          {/* Language Toggle */}
          <Link
            href={`?lang=${switchLang}`}
            className="mt-4 underline opacity-80 hover:text-yellow-400"
          >
            {switchLabel}
          </Link>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="w-full text-center mt-10 pt-4 border-t border-white/10 opacity-70 text-sm">
        © 2025 El Águila en Vuelo — {t.rights}
      </div>
    </footer>
  );
}
