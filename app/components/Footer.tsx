"use client";

import { useSearchParams } from "next/navigation";

export default function Footer() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");
  const lang = langParam === "en" ? "en" : "es";

  const t = {
    es: {
      follow: "Síguenos",
      contact: "Contacto",
      advertise: "Anuncia con Nosotros",
      adText:
        "El Águila es tu mejor plataforma para llegar a la comunidad Latina del Área de la Bahía.",
      moreInfo: "Más información →",
      email: "Email",
      phone: "Tel",
      copyright: "© 2026 El Águila — Orgullo Latino Sin Fronteras.",
      contactLink: "/contacto?lang=es",
    },
    en: {
      follow: "Follow Us",
      contact: "Contact",
      advertise: "Advertise With Us",
      adText:
        "El Águila is the top platform to reach the Latino community in the Bay Area.",
      moreInfo: "Learn more →",
      email: "Email",
      phone: "Phone",
      copyright: "© 2026 El Águila — Latino Pride Without Borders.",
      contactLink: "/contact?lang=en",
    },
  };

  const L = t[lang];

  return (
    <footer className="w-full bg-black/80 text-white py-12 mt-20 border-t border-yellow-500/30">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Social Media */}
        <div>
          <h3 className="text-xl font-bold text-yellow-400 mb-3">{L.follow}</h3>
          <ul className="space-y-2">
            <li>
              <a
                href="https://facebook.com/elaguilamagazine"
                target="_blank"
                className="hover:text-yellow-300"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/elaguila_magazine"
                target="_blank"
                className="hover:text-yellow-300"
              >
                Instagram
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-300">
                TikTok
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-yellow-300">
                YouTube
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xl font-bold text-yellow-400 mb-3">{L.contact}</h3>
          <p>
            {L.email}: support@elaguilamedia.com
          </p>
          <p>
            {L.phone}: 4081234567
          </p>
        </div>

        {/* Advertising */}
        <div>
          <h3 className="text-xl font-bold text-yellow-400 mb-3">{L.advertise}</h3>
          <p className="text-gray-300">{L.adText}</p>
          <a
            href={L.contactLink}
            className="text-yellow-300 underline mt-2 inline-block"
          >
            {L.moreInfo}
          </a>
        </div>
      </div>

      <p className="text-center text-gray-400 mt-10 text-sm">{L.copyright}</p>
    </footer>
  );
}
