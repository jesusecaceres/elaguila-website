"use client";
import { useSearchParams } from "next/navigation";

export default function LegalRules() {
  const searchParams = useSearchParams()!;
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  const t = {
    es: {
      title: "Reglas Oficiales de los Sorteos",
      intro:
        "Estas reglas aplican a todos los sorteos realizados por El Águila en Vuelo. La participación es gratuita y abierta a residentes de California.",
      eligibility_title: "Elegibilidad",
      eligibility: [
        "Debe ser residente del estado de California.",
        "Debe tener 18 años de edad o más.",
        "No se requiere ciudadanía o estatus migratorio.",
        "Empleados de El Águila en Vuelo no son elegibles."
      ],
      entry_title: "Cómo Participar",
      entry: [
        "La entrada es completamente gratuita.",
        "Solo una entrada por persona por sorteo.",
        "Entradas adicionales pueden ser obtenidas mediante acciones promocionales (por ejemplo: seguir redes sociales)."
      ],
      winner_title: "Selección del Ganador",
      winner: [
        "Los ganadores son seleccionados al azar.",
        "Los ganadores serán anunciados en la página oficial de ganadores.",
        "Los ganadores serán contactados por correo electrónico."
      ],
      claim_title: "Cómo Reclamar un Premio",
      claim: [
        "El ganador debe responder dentro de 7 días.",
        "Se requiere verificación de identidad.",
        "Si el ganador no responde, se seleccionará un nuevo ganador."
      ],
      disclaimer_title: "Descargos de Responsabilidad",
      disclaimer: [
        "Este sorteo no está patrocinado ni asociado con Meta, Instagram, TikTok, o YouTube.",
        "Todos los impuestos asociados al premio son responsabilidad del ganador.",
        "Nulo donde sea prohibido."
      ],
      contact: "Para preguntas o asistencia, comuníquese a:",
      email: "support@elaguilamedia.com"
    },

    en: {
      title: "Official Sweepstakes Rules",
      intro:
        "These rules apply to all sweepstakes conducted by El Águila en Vuelo. Participation is free and open to California residents.",
      eligibility_title: "Eligibility",
      eligibility: [
        "Must be a resident of the state of California.",
        "Must be 18 years of age or older.",
        "Citizenship or immigration status is NOT required.",
        "Employees of El Águila en Vuelo are not eligible."
      ],
      entry_title: "How to Enter",
      entry: [
        "Entry is completely free.",
        "Only one entry per person per giveaway.",
        "Bonus entries may be earned through promotional actions (e.g., following social media)."
      ],
      winner_title: "Winner Selection",
      winner: [
        "Winners are selected at random.",
        "Winners will be announced on the official winners page.",
        "Winners will be contacted via email."
      ],
      claim_title: "How to Claim a Prize",
      claim: [
        "Winner must respond within 7 days.",
        "Identity verification may be required.",
        "If the winner does not respond, a new winner will be selected."
      ],
      disclaimer_title: "Disclaimers",
      disclaimer: [
        "This sweepstakes is not sponsored or endorsed by Meta, Instagram, TikTok, or YouTube.",
        "Any taxes associated with the prize are the responsibility of the winner.",
        "Void where prohibited."
      ],
      contact: "For questions or assistance, contact:",
      email: "support@elaguilamedia.com"
    },
  }[lang];

  return (
    <main className="min-h-screen w-full text-white px-6 pb-24 max-w-4xl mx-auto mt-20">
      <h1 className="text-5xl font-extrabold mb-6 text-center">{t.title}</h1>
      <p className="text-lg opacity-80 mb-10 text-center">{t.intro}</p>

      {/* Eligibility */}
      <section className="mb-10">
        <h2 className="text-3xl font-bold mb-3">{t.eligibility_title}</h2>
        <ul className="list-disc pl-6 opacity-90 space-y-2">
          {t.eligibility.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ul>
      </section>

      {/* Entry */}
      <section className="mb-10">
        <h2 className="text-3xl font-bold mb-3">{t.entry_title}</h2>
        <ul className="list-disc pl-6 opacity-90 space-y-2">
          {t.entry.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </section>

      {/* Winner Selection */}
      <section className="mb-10">
        <h2 className="text-3xl font-bold mb-3">{t.winner_title}</h2>
        <ul className="list-disc pl-6 opacity-90 space-y-2">
          {t.winner.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </section>

      {/* Claim Prize */}
      <section className="mb-10">
        <h2 className="text-3xl font-bold mb-3">{t.claim_title}</h2>
        <ul className="list-disc pl-6 opacity-90 space-y-2">
          {t.claim.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </section>

      {/* Disclaimers */}
      <section className="mb-10">
        <h2 className="text-3xl font-bold mb-3">{t.disclaimer_title}</h2>
        <ul className="list-disc pl-6 opacity-90 space-y-2">
          {t.disclaimer.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </section>

      {/* Contact */}
      <section className="mt-10 text-center">
        <p className="text-lg mb-2">{t.contact}</p>
        <p className="text-yellow-400 font-bold">{t.email}</p>
      </section>
    </main>
  );
}
