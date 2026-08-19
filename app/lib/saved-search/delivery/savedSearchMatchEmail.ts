import { escapeHtml } from "@/app/lib/email/escapeHtml";

export type SavedSearchMatchEmailFields = {
  listingTitle: string;
  listingPrice: number | null;
  listingCity: string | null;
  listingState: string | null;
  detailUrl: string;
  manageUrl: string;
};

function formatPrice(price: number | null): string | null {
  if (price === null || !Number.isFinite(price) || price <= 0) return null;
  return `$${Math.round(price).toLocaleString("en-US")} USD`;
}

function formatLocation(city: string | null, state: string | null): string | null {
  const c = (city ?? "").trim();
  const s = (state ?? "").trim();
  if (c && s) return `${c}, ${s}`;
  return c || s || null;
}

/**
 * Saved Search 05 — truthful Autos match-alert email. Saved searches don't store a language
 * preference (nothing to reuse, nothing invented here) — V1 always sends Spanish first, English
 * second, in one email, mirroring the fixed-order convention already used elsewhere in Leonix
 * bilingual email (see `buildNewsletterPromoCodeEmail`).
 */
export function buildSavedSearchMatchEmail(fields: SavedSearchMatchEmailFields): {
  subject: string;
  text: string;
  html: string;
} {
  const title = fields.listingTitle.trim();
  const price = formatPrice(fields.listingPrice);
  const location = formatLocation(fields.listingCity, fields.listingState);
  const subject = "Leonix: Encontramos un auto que coincide con tu búsqueda";

  const textEs = [
    "Hola,",
    "",
    `Un anuncio activo de Autos en Leonix ahora coincide con una de tus búsquedas guardadas: "${title}".`,
    price ? `Precio: ${price}.` : null,
    location ? `Ubicación: ${location}.` : null,
    "",
    `Ver el anuncio: ${fields.detailUrl}`,
    "",
    "Recibiste este correo porque tienes una búsqueda guardada activa en Leonix que coincide con este anuncio.",
    `Administra tus búsquedas guardadas (pausar, reanudar o eliminar) aquí: ${fields.manageUrl}`,
  ].filter((l): l is string => l !== null);

  const textEn = [
    "Hi,",
    "",
    `An active Autos listing on Leonix now matches one of your saved searches: "${title}".`,
    price ? `Price: ${price}.` : null,
    location ? `Location: ${location}.` : null,
    "",
    `View the listing: ${fields.detailUrl}`,
    "",
    "You received this email because you have an active saved search on Leonix that matches this listing.",
    `Manage your saved searches (pause, resume, or delete) here: ${fields.manageUrl}`,
  ].filter((l): l is string => l !== null);

  const text = [...textEs, "", "———", "", ...textEn].join("\n");

  const htmlBlock = (isEn: boolean) => `
    <h2 style="margin:0 0 8px;font-size:18px;">${isEn ? "You have a new match" : "Tienes una nueva coincidencia"}</h2>
    <p style="margin:0 0 12px;">${isEn ? "Hi," : "Hola,"}</p>
    <p style="margin:0 0 6px;">${
      isEn
        ? `An active Autos listing on Leonix now matches one of your saved searches: <strong>${escapeHtml(title)}</strong>.`
        : `Un anuncio activo de Autos en Leonix ahora coincide con una de tus búsquedas guardadas: <strong>${escapeHtml(title)}</strong>.`
    }</p>
    ${price ? `<p style="margin:0 0 6px;"><strong>${isEn ? "Price" : "Precio"}: ${escapeHtml(price)}</strong></p>` : ""}
    ${location ? `<p style="margin:0 0 12px;">${isEn ? "Location" : "Ubicación"}: ${escapeHtml(location)}</p>` : ""}
    <p style="margin:0 0 12px;">
      <a href="${escapeHtml(fields.detailUrl)}" style="display:inline-block;padding:10px 16px;background:#0b5fff;color:#ffffff;text-decoration:none;border-radius:6px;">${
        isEn ? "View listing" : "Ver anuncio"
      }</a>
    </p>
    <p style="margin:0 0 6px;font-size:13px;color:#555;">${
      isEn
        ? "You received this email because you have an active saved search on Leonix that matches this listing."
        : "Recibiste este correo porque tienes una búsqueda guardada activa en Leonix que coincide con este anuncio."
    }</p>
    <p style="margin:0;font-size:13px;"><a href="${escapeHtml(fields.manageUrl)}" style="color:#0b5fff;">${
      isEn ? "Manage your saved searches" : "Administra tus búsquedas guardadas"
    }</a></p>`;

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;max-width:560px;margin:0 auto;padding:16px;">
  <p style="margin:0 0 16px;font-weight:700;font-size:16px;">Leonix</p>
  ${htmlBlock(false)}
  <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;" />
  ${htmlBlock(true)}
</body></html>`;

  return { subject, text, html };
}
