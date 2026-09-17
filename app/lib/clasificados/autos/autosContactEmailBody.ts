/**
 * Owner lock (2026-09-17): the "Correo"/"Enviar correo" action sheet must never hand the buyer an
 * empty "MENSAJE —" with no useful context to send. Builds a short, sensible default body from
 * data already on the listing (recipient name when one exists, the vehicle's own title) — never
 * invents anything the listing doesn't already have, and never includes internal ids.
 */
export type AutosContactEmailBodyIntent = "dealer" | "finance";

export function buildAutosContactEmailBody(params: {
  lang: "es" | "en";
  recipientName?: string | null;
  vehicleTitle?: string | null;
  intent: AutosContactEmailBodyIntent;
}): string {
  const es = params.lang === "es";
  const name = params.recipientName?.trim();
  const vehicle = params.vehicleTitle?.trim();
  const greeting = name ? (es ? `Hola ${name},` : `Hello ${name},`) : es ? "Hola," : "Hello,";

  if (params.intent === "finance") {
    const line = es
      ? vehicle
        ? `me interesa conocer las opciones de financiamiento para\n${vehicle} en Leonix.`
        : "me interesa conocer las opciones de financiamiento en Leonix."
      : vehicle
        ? `I'm interested in financing options for the\n${vehicle} listing on Leonix.`
        : "I'm interested in financing options on Leonix.";
    return `${greeting}\n${line}`;
  }

  const line = es
    ? vehicle
      ? `me interesa el ${vehicle} publicado en Leonix.`
      : "me interesa este anuncio publicado en Leonix."
    : vehicle
      ? `I'm interested in the ${vehicle} listing on Leonix.`
      : "I'm interested in this listing on Leonix.";
  return `${greeting}\n${line}`;
}
