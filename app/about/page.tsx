"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import oldLogo from "../../public/legacy-logo.png";
import newLogo from "../../public/logo.png";

export default function AboutPage() {
  const params = useSearchParams();
  const lang = (params.get("lang") || "es") as "es" | "en";

  const t = {
    es: {
      title: "Sobre Nosotros — El Águila en Vuelo",
      legacyTitle: "Nuestro Legado — El Vuelo del Águila (1998–2020)",
      rebirthTitle: "El Renacer — El Águila en Vuelo (2026)",
      visionTitle: "Un Nuevo Liderazgo — La Llamada de Chuy",
      letterTitle: "Mensaje Personal de Chuy",
      motto: "Orgullo Latino Sin Fronteras",
      legacyText: `
La historia de El Águila comenzó en 1998, inspirada por una visión llamada “El Vuelo del Águila.”
Su fundador, Rogelio Vargas González, nació en Zitácuaro, Michoacán.

En 1998 persiguió su sueño: crear una revista que informara, elevara y conectara a la comunidad latina.
El Vuelo del Águila se convirtió en símbolo de cultura, orgullo y unidad por más de una década.

Tras su fallecimiento, su legado fue sostenido con amor y fortaleza por su familia,
manteniendo vivo el espíritu del águila hasta su nuevo vuelo.
      `,
      rebirthText: `
Hoy, El Águila entra en una nueva etapa.
Honramos el pasado mientras abrazamos el futuro con una visión renovada,
utilizando plataformas digitales modernas para servir a nuestra comunidad.
      `,
      visionText: `
Mi nombre es Jesús Emmanuel Cáceres, conocido como Chuy.
Después de más de dos décadas en el mundo corporativo,
Dios alineó mi corazón con el sueño que comenzó en 1998.

El Águila en Vuelo existe para apoyar familias, jóvenes,
negocios locales y organizaciones comunitarias con propósito.
      `,
      letterText: `
Soy esposo, padre y servidor de mi comunidad.
Creo firmemente que cada temporada de la vida tiene propósito.

El Águila volvió a volar — y este vuelo es para toda nuestra comunidad.
A Dios sea la gloria.
      `,
    },
    en: {
      title: "About Us — El Águila en Vuelo",
      legacyTitle: "Our Legacy — El Vuelo del Águila (1998–2020)",
      rebirthTitle: "The Rebirth — El Águila en Vuelo (2026)",
      visionTitle: "A New Leadership — Chuy’s Calling",
      letterTitle: "A Personal Message from Chuy",
      motto: "Latino Pride Without Borders",
      legacyText: `
El Águila began in 1998 as a vision to uplift and connect the Latino community.

Founded by Rogelio Vargas González, El Vuelo del Águila became
a trusted source of culture, pride, and unity for many years.
      `,
      rebirthText: `
Today, El Águila enters a new era.
We honor our roots while embracing the future through modern digital platforms.
      `,
      visionText: `
My name is Jesús Emmanuel Cáceres, known as Chuy.
After years in the corporate world, God aligned my heart with this mission.

El Águila en Vuelo exists to serve families, youth,
local businesses, and community organizations.
      `,
      letterText: `
I am a man of faith, a husband, a father, and a servant.
This platform exists with purpose and gratitude.

El Águila flies again — and this flight is for our entire community.
To God be the glory.
      `,
    },
  };

  const L = t[lang];

  return (
    <div className="bg-black text-white min-h-screen pb-32">
      {/* HERO */}
      <div className="w-full text-center py-24 bg-gradient-to-b from-black via-[#2b210c] to-[#3a2c0f]">
        <Image
          src={newLogo}
          alt="El Águila"
          width={320}
          className="mx-auto mb-6 drop-shadow-[0_0_18px_rgba(255,215,0,0.55)]"
        />
        <h1 className="text-5xl font-bold text-yellow-400">{L.title}</h1>
      </div>

      {/* LEGACY */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-b border-yellow-700/30">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10">
          {L.legacyTitle}
        </h2>
        <Image
          src={oldLogo}
          alt="Legacy Logo"
          className="w-full max-w-2xl mx-auto mb-10"
        />
        <p className="whitespace-pre-line text-lg leading-relaxed text-gray-300">
          {L.legacyText}
        </p>
      </section>

      {/* REBIRTH */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10">
          {L.rebirthTitle}
        </h2>
        <p className="text-lg leading-relaxed text-gray-300 whitespace-pre-line">
          {L.rebirthText}
        </p>
      </section>

      {/* VISION */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-yellow-700/20">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10">
          {L.visionTitle}
        </h2>
        <p className="text-lg leading-relaxed text-gray-300 whitespace-pre-line">
          {L.visionText}
        </p>
      </section>

      {/* LETTER */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10">
          {L.letterTitle}
        </h2>
        <div className="bg-black/40 border border-yellow-600/40 p-8 rounded-xl">
          <p className="text-xl italic whitespace-pre-line text-gray-200">
            {L.letterText}
          </p>
        </div>
      </section>

      <h2 className="text-center text-3xl font-bold text-yellow-400">
        {L.motto}
      </h2>
    </div>
  );
}
