/**
 * Autos Privado — paid private-seller lane (product definition for UI + future publish).
 * Lighter than Negocios: no dealership business stack, inventory, or dealer-only CTAs.
 */
export const AUTOS_PRIVADO_PRODUCT = {
  includes: [
    "Premium listing layout (title, specs, highlights, description)",
    "Image gallery + optional video",
    "Location (city / state / ZIP contract)",
    "Call CTA + optional WhatsApp",
    "Basic analytics strip (same vocabulary as dashboard)",
    "Results-card participation (distinct Privado presentation)",
  ],
  excludes: [
    "Dealership logo / business stack",
    "Website, socials, hours, booking URL",
    "Related dealer inventory",
    "Default featured dealership treatment",
  ],
} as const;
