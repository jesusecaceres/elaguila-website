"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import oldLogo from "../../public/legacy-logo.png"; // Your father-in-law's original logo
import newLogo from "../../public/logo.png";        // Your new 2026 logo

export default function AboutPage() {
  const params = useSearchParams();
  const lang = params.get("lang") || "es";

  // TypeScript fix: force lang to only "es" | "en"
  type Lang = "es" | "en";
  const langTyped = lang as Lang;

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
Su fundador, Rogelio Vargas González, nació en Zitácuaro, Michoacán, como el tercero de once hijos.
Líder desde niño, Rogelio emigró a San José en los años 80, donde junto a su esposa Leticia formó una familia con tres hijas.

En 1998, Rogelio persiguió su sueño: crear una revista que elevara y conectara a la comunidad latina.
Para él, el águila simbolizaba visión, fuerza, valentía y la capacidad de elevarse sobre cualquier tormenta.

Tras su fallecimiento en 2013, su esposa Leticia y su hija Erika levantaron nuevamente las alas del águila,
demostrando la fortaleza y resiliencia de la mujer latina.
Con amor y perseverancia mantuvieron vivo el sueño hasta llegar el tiempo de un nuevo vuelo.
`,

      rebirthText: `
Hoy, El Águila entra en una nueva etapa que honra su legado mientras abraza una visión renovada.
Esta nueva temporada busca servir a la comunidad con más fuerza, corazón y conexión.
El águila vuelve a volar — ahora en plataformas digitales modernas diseñadas para apoyar a familias, jóvenes,
negocios locales y organizaciones sin fines de lucro.
`,

      visionText: `
Mi nombre es Jesús Emmanuel Cáceres — mejor conocido como Chuy.
Después de 23 años en el mundo corporativo y de trabajar con la juventud en San José,
Dios puso en mi corazón un propósito mayor. Amo a mi comunidad y siempre he querido servir como puente,
recurso y guía.

Tras mucha oración y ayuno, entendí que mi llamado estaba alineado con el sueño que mi suegro comenzó en 1998.
Hoy, esa visión renace en El Águila en Vuelo — un proyecto dedicado a apoyar familias, resaltar organizaciones
que ayudan a nuestra gente, promover eventos accesibles y ofrecer esperanza.
`,

      letterText: `
Soy un hombre de fe — un esposo, un padre y un servidor de mi comunidad.
A mis 40 años entiendo que mi vida reflejó un “desierto” espiritual similar al del pueblo de Israel.
El desierto no es un castigo — es una preparación. Es donde Dios moldea tu carácter y te enseña a confiar por completo.

Hoy creo que Dios me ha permitido entrar en mi propia tierra prometida — un nuevo comienzo y una misión renovada.
Mi oración es que cada lector encuentre aquí un recordatorio de que Dios nunca llega tarde,
y que incluso en el desierto Él está obrando.

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
The story of El Águila began in 1998 with a vision called “El Vuelo del Águila — The Flight of the Eagle.”
Its founder, Rogelio Vargas González, was born in Zitácuaro, Michoacán, the third of eleven children.
A natural leader, Rogelio immigrated to San José in the 1980s, where he built a family with his wife Leticia.

In 1998, he followed his dream: to create a magazine that uplifted and connected the Latino community.
To him, the eagle represented vision, strength, courage, and the ability to rise above any storm.

After Rogelio passed away in 2013, his wife Leticia and daughter Erika lifted the eagle once again —
demonstrating the strength and resilience of Latina women.
With perseverance, they kept his dream alive until the time came for a new flight.
`,

      rebirthText: `
Today, El Águila enters a new chapter — honoring its roots while embracing a renewed mission.
This new season aims to serve the community with heart, strength, and connection through modern digital platforms
that support families, youth, small businesses, and nonprofits.
`,

      visionText: `
My name is Jesús Emmanuel Cáceres — but everyone calls me Chuy.
After 23 years in the corporate world and time spent serving youth in San José,
God placed a greater purpose in my heart. I love my community, and I’ve always wanted to serve as a bridge,
resource, and guide.

Through prayer and fasting, I realized my calling aligned with the vision my father-in-law began in 1998.
Today, that dream rises again in El Águila en Vuelo — dedicated to lifting our community, highlighting nonprofits,
promoting accessible events, and offering hope.
`,

      letterText: `
I am a man of faith — a husband, father, and servant to my community.
At 40 years old, I now understand that my life mirrored a spiritual “desert,” much like the people of Israel.
The desert is not punishment — it is preparation. It is where God shapes your character and teaches you to trust fully.

Today, I believe God has brought me into my own promised land — a new beginning and a renewed mission.
My prayer is that every reader finds a reminder that God is never late,
and even in the desert, He is working.

To God be the Glory.
`,
    },
  };

  const L = t[langTyped];

  return (
    <div className="text-white bg-black min-h-screen pb-32">

      {/* HERO */}
      <div className="w-full text-center py-24 bg-gradient-to-b from-black to-[#3a2c0f]">
        <Image src={newLogo} alt="El Águila" width={240} className="mx-auto mb-6" />
        <h1 className="text-5xl font-bold text-yellow-400">{L.title}</h1>
      </div>

      {/* LEGACY SECTION */}
      <div className="max-w-5xl mx-auto px-6 py-20 border-b border-yellow-700/30">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10">{L.legacyTitle}</h2>

        <div className="flex flex-col md:flex-row gap-10">
          <Image src={oldLogo} alt="Legacy Logo" width={260} className="rounded-lg shadow-lg" />
          <p className="whitespace-pre-line text-lg leading-relaxed text-gray-300">
            {L.legacyText}
          </p>
        </div>
      </div>

      {/* REBIRTH SECTION */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10">{L.rebirthTitle}</h2>

        <Image src={newLogo} alt="New Logo" width={200} className="mx-auto mb-10 opacity-90" />

        <p className="text-lg leading-relaxed whitespace-pre-line text-gray-300">
          {L.rebirthText}
        </p>
      </div>

      {/* VISION SECTION */}
      <div className="max-w-5xl mx-auto px-6 py-20 border-t border-yellow-700/20">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10">{L.visionTitle}</h2>

        <p className="text-lg leading-relaxed whitespace-pre-line text-gray-300">
          {L.visionText}
        </p>
      </div>

      {/* PERSONAL LETTER */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10">{L.letterTitle}</h2>

        <div className="bg-black/40 border border-yellow-600/40 p-8 rounded-xl shadow-xl">
          <p className="text-xl italic whitespace-pre-line text-gray-200 leading-relaxed">
            {L.letterText}
          </p>
        </div>
      </div>

      {/* MOTTO */}
      <h2 className="text-center text-3xl font-bold text-yellow-400 mt-10">{L.motto}</h2>
    </div>
  );
}
