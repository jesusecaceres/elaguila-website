"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import oldLogo from "../../public/legacy-logo.png";   // Founder logo banner
import newLogo from "../../public/logo.png";          // New El Águila logo

export default function AboutPage() {
  const params = useSearchParams();
  const lang = params.get("lang") || "es";

  // TypeScript fix
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
Su fundador, Rogelio Vargas González, nació el 16 de noviembre de 1960 en Zitácuaro, Michoacán — el tercero de once hijos.
Desde niño mostró liderazgo, esfuerzo y una habilidad natural para unir a quienes lo rodeaban.

En los años 80 emigró a San José, California, donde junto a su esposa Leticia formó una familia con tres hijas.
Rogelio trabajó en múltiples empleos, siempre creando amistades gracias a su carisma y humildad.

En 1998 persiguió su sueño: crear una revista que informara, elevara y conectara a la comunidad latina.
Así nació El Vuelo del Águila, una publicación que durante dieciséis años se convirtió en símbolo de cultura, orgullo y unidad.

Para Rogelio, el águila lo era todo:
visión, valentía, sabiduría y la capacidad de elevarse por encima de cualquier tormenta.

Tras su fallecimiento en 2013, su legado no cayó — fue sostenido por las manos de su esposa Leticia y su hija Erika,
quienes representaron la fortaleza, disciplina y amor que Rogelio les enseñó.
Con un espíritu incansable, levantaron nuevamente las alas del águila, manteniendo viva la misión durante los años más difíciles.

Durante ese tiempo, Celeste y Wendy también ofrecieron su apoyo con el corazón, acompañando a su madre y a su hermana
en el esfuerzo de mantener vivo el sueño que su padre inició.

Por años, mantuvieron encendida la luz del sueño original, esperando el momento adecuado para un nuevo vuelo.
`,

      rebirthText: `
Hoy, El Águila entra en una nueva etapa que honra su historia mientras abraza el futuro con una visión renovada.
Este renacimiento tiene un propósito claro:
Elevar otra vez al águila y servir a nuestra comunidad con más fuerza, más corazón y más conexión que nunca.

Nuestra misión sigue firme:
dar voz, informar, celebrar y unir a nuestra gente, ahora a través de plataformas digitales modernas diseñadas
para apoyar a familias, jóvenes, negocios locales y organizaciones sin fines de lucro.
`,

      visionText: `
Mi nombre es Jesús Emmanuel Cáceres — pero todos me conocen como Chuy.
Tras 23 años en el sector corporativo y un tiempo trabajando con la juventud en la Ciudad de San José,
siempre sentí dentro de mí que Dios tenía un propósito más grande para mi vida.

Mi pasión siempre ha sido ayudar — ser un recurso, una guía, un puente para otros.
Amo a mi comunidad. Amo San José. Amo su diversidad, su historia y su corazón.

Y en oración, ayuno y conversaciones con mi familia, Dios alineó mi corazón con el sueño que mi suegro comenzó en 1998.
Tras la pandemia, la revista enfrentó desafíos y llegó a una pausa,
pero el sueño nunca murió — simplemente esperaba un nuevo vuelo.

Hoy, esa visión renace en El Águila en Vuelo, un proyecto dedicado a:
apoyar familias que enfrentan dificultades,
resaltar organizaciones que sirven a nuestra comunidad,
promover eventos accesibles,
y crear un espacio donde cualquier persona pueda encontrar recursos y esperanza.
`,

      letterText: `
"Soy un hombre de fe: esposo, padre, hijo y servidor de mi comunidad.
Hoy, a mis 40 años, entiendo mi historia con claridad.
Así como el pueblo de Israel caminó cuarenta años en el desierto,
yo también viví temporadas de lucha, silencio, crecimiento y transformación.

El desierto no es un castigo — es preparación.
Es ahí donde Dios enseña a confiar plenamente, donde moldea tu carácter y fortalece tu espíritu.

Yo tuve mis desiertos: días buenos, días difíciles, momentos de claridad y momentos de dolor.
Pero en cada uno, Dios estaba obrando.

Y ahora, después de cuarenta años, creo firmemente que Dios me ha permitido entrar en mi propia tierra prometida —
una misión renovada, un propósito claro y una oportunidad de servir a mi comunidad más profundamente.

Mi oración es que cada persona que visite este sitio recuerde que nunca es tarde,
que Dios no se olvida de nadie,
y que incluso en el desierto Él está preparando algo mayor.

El Águila volvió a volar — y este vuelo es para toda nuestra comunidad.

A Dios sea la gloria.”*
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
The story of El Águila began in 1998, inspired by a vision called “El Vuelo del Águila — The Flight of the Eagle.”
Its founder, Rogelio Vargas González, was born on November 16, 1960 in Zitácuaro, Michoacán — the third of eleven children.
A natural leader, Rogelio immigrated to San José in the 1980s, where he built a family with his wife Leticia and their daughters.

In 1998 he pursued his dream: to create a magazine that would uplift, inform, and unite the Latino community.
This became El Vuelo del Águila, a publication that stood as a symbol of culture, pride, and unity for sixteen years.

To Rogelio, the eagle represented everything he admired:
vision, courage, wisdom, and the ability to rise above any storm.

After his passing in 2013, his legacy did not fall — it was carried forward by his wife Leticia and his daughter Erika,
who embodied the strength, discipline, and heart he instilled in them.
With unwavering dedication, they lifted the eagle’s wings again, keeping the mission alive through difficult years.

During that time, Celeste and Wendy also offered their heartfelt support,
standing alongside their mother and sister as they worked to keep their father’s dream alive.

For years, they protected the dream until the time came for a new flight.
`,

      rebirthText: `
Today, El Águila enters a new era — honoring its roots while embracing a renewed purpose.
The mission is clear:
to lift the eagle once again and serve our community with greater heart, strength, and connection.

Our calling remains unchanged:
to uplift, inform, celebrate, and unite our people through modern digital platforms
supporting families, youth, local businesses, and nonprofits.
`,

      visionText: `
My name is Jesús Emmanuel Cáceres — but everyone knows me as Chuy.
After 23 years in the corporate world and time serving youth in the City of San José,
I always felt God calling me toward a deeper purpose.

Helping others has always been my passion — being a resource, a bridge, a guide.
I love my community. I love San José. I love its diversity and its heart.

Through prayer, fasting, and conversations with my family, God aligned my path with the dream my father-in-law began in 1998.
After the pandemic, the magazine paused — yet the dream never died.
It simply awaited its new flight.

Today, that dream rises again as El Águila en Vuelo, dedicated to:
supporting families in need,
highlighting nonprofits,
promoting accessible events,
and providing a hub of resources and hope.
`,

      letterText: `
"I am a man of faith — a husband, father, son, and servant to my community.
At 40 years old, I finally understand my journey.
Just like the people of Israel spent forty years in the wilderness,
I too walked through seasons of struggle, silence, growth, and transformation.

The desert is not punishment — it is preparation.
It is where God teaches you to trust fully, shapes your character, and strengthens your spirit.

I lived through my deserts:
joyful days, painful days, moments of clarity, moments of confusion —
and through every season, God was working.

Now, after forty years, I believe God has brought me into my own promised land —
a renewed mission, a deeper purpose, and a greater calling to serve my community.

My prayer is that anyone who visits this site is reminded that it is never too late,
God never forgets His people,
and even in the desert He is preparing something greater.

El Águila flies again — and this flight is for our entire community.

To God be the Glory.”*
`,
    },
  };

  const L = t[langTyped];

  return (
    <div className="text-white bg-black min-h-screen pb-32">

      {/* HERO */}
      <div className="w-full text-center py-24 bg-gradient-to-b from-black via-[#2b210c] to-[#3a2c0f]">
        <Image
          src={newLogo}
          alt="El Águila"
          width={350}
          className="mx-auto mb-6 drop-shadow-[0_0_18px_rgba(255,215,0,0.55)]"
        />
        <h1 className="text-5xl font-bold text-yellow-400">{L.title}</h1>
      </div>

      {/* LEGACY SECTION */}
      <div className="max-w-5xl mx-auto px-6 py-20 border-b border-yellow-700/30">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10">{L.legacyTitle}</h2>

        <Image
          src={oldLogo}
          alt="Legacy Logo"
          className="w-full max-w-2xl mx-auto mb-10 drop-shadow-[0_0_18px_rgba(255,215,0,0.45)]"
        />

        <p className="whitespace-pre-line text-lg leading-relaxed text-gray-300">
          {L.legacyText}
        </p>
      </div>

      {/* REBIRTH SECTION */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10">{L.rebirthTitle}</h2>

        <Image
          src={newLogo}
          alt="New Logo"
          className="w-full max-w-xl mx-auto mb-10 drop-shadow-[0_0_18px_rgba(255,215,0,0.55)]"
        />

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

        <div className="bg-black/40 border border-yellow-600/40 p-8 rounded-xl shadow-xl backdrop-blur-sm">
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
