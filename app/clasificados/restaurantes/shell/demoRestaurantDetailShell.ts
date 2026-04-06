import type { RestaurantDetailShellData } from "./restaurantDetailShellTypes";

/**
 * Pre-filled demo listing — source-of-truth sample for preview + final ad shell.
 *
 * Planned optional modules (not rendered in core shell; wire separately later):
 * A) Moving business — truck / pop-up schedule
 * B) Home-based food — pickup windows, radius, preorder
 * C) Catering / events — inquiry, lead time, radius
 * D) Ordering / reservations — platforms, call-to-order
 */
export const DEMO_RESTAURANT_DETAIL_SHELL: RestaurantDetailShellData = {
  id: "demo-naranjo-sal-mission",
  heroImageUrl:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=80",
  heroImageAlt: "Interior de restaurante con barra y mesas iluminadas cálidamente",
  businessName: "Naranjo & Sal",
  cuisineTypeLine: "Nueva cocina americana · Mediterráneo",
  summaryShort:
    "Salón céntrico con decoración cuidada, terraza y carta mediterránea que rota con la temporada — ideal para una cena sin prisa.",
  trustRating: {
    average: 4.6,
    count: 612,
  },
  hoursPreview: {
    status: "open",
    statusLine: "Abierto ahora · hasta las 22:00",
    scheduleSummary: "Lun – Dom · 17:00 – 22:00",
  },
  seeHoursLabel: "Ver horarios",
  seeHoursHref: "#horarios",
  primaryCtas: [
    { key: "website", label: "Sitio web", href: "https://naranjosal.example.com", enabled: true },
    { key: "call", label: "Llamar", href: "tel:+14155550123", enabled: true },
    { key: "whatsapp", label: "WhatsApp", href: "https://wa.me/14155550199", enabled: true },
    { key: "message", label: "Mensaje", href: "sms:+14155550123", enabled: true },
    { key: "menu", label: "Ver menú", href: "https://naranjosal.example.com/menu", enabled: true },
    { key: "reserve", label: "Reservar", href: "https://naranjosal.example.com/reservas", enabled: true },
    {
      key: "order",
      label: "Ordenar",
      href: "#",
      enabled: false,
      disabledReason: "Enlace de pedido no configurado",
    },
    { key: "save", label: "Guardar", href: "#guardar", enabled: true },
    { key: "share", label: "Compartir", href: "#compartir", enabled: true },
  ],
  quickInfo: [
    { key: "neighborhood", label: "Zona", value: "Mission · San Francisco" },
    { key: "price", label: "Precio", value: "$$$" },
    { key: "businessType", label: "Tipo", value: "Restaurante de sitio · Bar de vinos" },
    { key: "hours", label: "Horario", value: "Cena diaria · abierto hoy" },
    { key: "service", label: "Servicio", value: "Comer en local · Terraza · Para llevar" },
  ],
  menuHighlights: [
    {
      name: "Chuletillas de cordero",
      supportingLine: "Costillar fino con hierbas y limón confitado",
      imageUrl:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
      badge: "46 fotos",
    },
    {
      name: "Calamar a la brasa",
      supportingLine: "Pimentón ahumado, ajo tierno y limón",
      imageUrl:
        "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=80",
      badge: "31 fotos",
    },
    {
      name: "Baklava de pistacho",
      supportingLine: "Postre de la casa · porción para compartir",
      imageUrl:
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
      badge: "18 fotos",
    },
    {
      name: "Menú de vinos",
      supportingLine: "Copas y botellas · selección mediterránea",
      imageUrl:
        "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
      badge: "PDF",
    },
  ],
  fullMenuCta: {
    label: "Ver menú completo (PDF)",
    href: "https://naranjosal.example.com/menu-carta.pdf",
  },
  highlightTags: [
    { key: "outdoor", label: "Terraza" },
    { key: "upscale", label: "Ambiente elevado" },
    { key: "casual", label: "Casual elegante" },
    { key: "trendy", label: "De moda" },
    { key: "reservations", label: "Reservas" },
    { key: "catering", label: "Catering" },
    { key: "family", label: "Familiar" },
  ],
  gallery: [
    {
      category: "interior",
      imageUrl:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      alt: "Comedor con mesas de madera y iluminación cálida",
      countOverlay: 10,
    },
    {
      category: "food",
      imageUrl:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      alt: "Plato mediterráneo con vegetales asados",
    },
    {
      category: "exterior",
      imageUrl:
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
      alt: "Fachada del restaurante al atardecer",
    },
    {
      category: "video",
      imageUrl:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
      alt: "Video: recorrido por el comedor",
    },
  ],
  galleryCta: {
    label: "Ver todas las fotos y videos",
    href: "#media",
  },
  contact: {
    addressLine1: "235 Valencia St",
    addressLine2: "San Francisco, CA 94103",
    mapsSearchQuery: "235 Valencia St, San Francisco, CA 94103",
    phoneDisplay: "(415) 555-0123",
    phoneTelHref: "tel:+14155550123",
    email: "hola@naranjosal.example.com",
    websiteDisplay: "naranjosal.example.com",
    websiteHref: "https://naranjosal.example.com",
    instagramHref: "https://instagram.com/naranjosal",
    facebookHref: "https://facebook.com/naranjosalsf",
    tiktokHref: "https://www.tiktok.com/@naranjosal_sf",
    whatsappHref: "https://wa.me/14155550199",
    menuFileLabel: "Carta de temporada (PDF)",
    menuFileHref: "https://naranjosal.example.com/menu-carta.pdf",
  },
  aboutTitle: "Sobre el negocio",
  aboutBody:
    "Naranjo & Sal nació como un pequeño proyecto familiar y hoy es un punto de encuentro en la Mission: cocina honesta, producto local cuando se puede, y una carta de vinos pensada para acompañar sin complicar. El equipo prioriza el servicio tranquilo y mesas donde se puede conversar — perfecto para celebraciones íntimas o una cena entre amigos. Si vienes por primera vez, prueba el menú degustación los jueves o pide recomendación al sommelier.",
  trustLight: {
    summaryLine:
      "Leonix resume: clientes destacan la terraza, el servicio atento y la carta de vinos. Sin reseñas nativas pesadas aquí — el foco es conectar contigo al instante.",
    externalTrustHref: "https://example.com/trust",
    externalTrustLabel: "Más contexto",
  },
};
