/**
 * Autos Privado — paid private-seller lane (product definition for UI + future publish).
 * Lighter than Negocios: no dealership business stack, inventory, or dealer-only CTAs.
 */
export const AUTOS_PRIVADO_PRODUCT = {
  /** Canonical routes — keep in sync with `app/publicar/autos/privado` and preview app routes. */
  routes: {
    publish: "/publicar/autos/privado",
    preview: "/clasificados/autos/privado/preview",
  },
  includes: [
    "Premium listing layout (title, specs, highlights, description)",
    "Image gallery + optional video",
    "Location (city / state / ZIP contract)",
    "CTA stack: call, optional WhatsApp (prefilled interest text), Leonix message form, optional seller email",
    "Lightweight 2×2 analytics strip (views / saves / shares / contacts vocabulary)",
    "Results-card participation (distinct Privado presentation)",
    "Optional seller social DM links, seller-entered per listing (Facebook, Instagram, TikTok, X, other)",
  ],
  excludes: [
    "Dealership logo / business stack",
    "Dealership website, hours, booking URL",
    "Dealer business social links (`dealerSocials`) — never read on Privado, see PrivadoContactStrip",
    "Related dealer inventory",
    "Default featured dealership treatment",
  ],
} as const;
