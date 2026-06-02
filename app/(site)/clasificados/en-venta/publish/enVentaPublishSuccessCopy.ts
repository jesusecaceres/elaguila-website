/** Seller-facing copy after a successful Varios publish (Gate P4-I). */

export type EnVentaPublishSuccessCopy = {
  title: string;
  body: string;
  leonixIdLabel: string;
  duration: string;
  republish: string;
  soldReminder: string;
  termsReminder: string;
  flagWarning: string;
  viewAd: string;
  dashboard: string;
  postAnother: string;
};

export function getEnVentaPublishSuccessCopy(
  lang: "es" | "en",
  plan: "free" | "pro"
): EnVentaPublishSuccessCopy {
  const hasRepublish = plan === "pro";

  if (lang === "es") {
    return {
      title: "Tu anuncio fue publicado con éxito",
      body: "Ya está disponible para compradores en Varios.",
      leonixIdLabel: "ID Leonix:",
      duration:
        "Los anuncios de Varios están pensados para mantenerse activos por 30 días. Te recomendamos revisar tu panel para actualizar, marcar como vendido o volver a publicar cuando sea necesario.",
      republish: hasRepublish
        ? "Después de 30 días, podrás volver a publicarlo o refrescarlo desde tu panel."
        : "Si quieres volver a publicarlo después de 30 días, crea un nuevo anuncio o revisa las opciones disponibles en tu panel.",
      soldReminder:
        "Si vendes el artículo, márcalo como vendido desde tu panel para que deje de aparecer como disponible.",
      termsReminder: "Al publicar, confirmaste que tu anuncio cumple con las reglas de Leonix.",
      flagWarning:
        "Si tu anuncio es reportado o marcado por nuestro asistente de seguridad, Leonix podrá revisarlo y tomar acción para mantener la comunidad segura.",
      viewAd: "Ver mi anuncio",
      dashboard: "Ir a mi panel",
      postAnother: "Publicar otro anuncio",
    };
  }

  return {
    title: "Your ad was published successfully",
    body: "It is now available to buyers in For Sale.",
    leonixIdLabel: "Leonix ID:",
    duration:
      "For Sale listings are intended to stay active for 30 days. We recommend checking your dashboard to update, mark as sold, or republish when needed.",
    republish: hasRepublish
      ? "After 30 days, you can republish or refresh it from your dashboard."
      : "To post it again after 30 days, create a new ad or review the available options in your dashboard.",
    soldReminder:
      "If your item sells, mark it as sold from your dashboard so it no longer appears as available.",
    termsReminder: "By publishing, you confirmed that your ad follows Leonix rules.",
    flagWarning:
      "If your ad is reported or flagged by our safety assistant, Leonix may review it and take action to keep the community safe.",
    viewAd: "View my ad",
    dashboard: "Go to my dashboard",
    postAnother: "Post another ad",
  };
}

/** Canonical public detail URL for a freshly published listing. */
export function buildEnVentaPublishedListingHref(listingId: string, lang: "es" | "en"): string {
  return `/clasificados/anuncio/${encodeURIComponent(listingId.trim())}?lang=${lang}`;
}

/** Seller dashboard route for managing listings. */
export function buildEnVentaSellerDashboardHref(lang: "es" | "en"): string {
  return `/dashboard/mis-anuncios?lang=${lang}`;
}

/** Fresh publish intake (no resume) for posting another ad. */
export function buildEnVentaPostAnotherHref(lang: "es" | "en", plan: "free" | "pro"): string {
  return `/clasificados/publicar/en-venta/${plan}?lang=${lang}`;
}
