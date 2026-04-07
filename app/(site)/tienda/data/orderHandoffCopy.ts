import type { Lang } from "../types/tienda";
import type { TiendaLocalizedLine } from "../types/orderHandoff";

export function ohPick(row: TiendaLocalizedLine, lang: Lang): string {
  return lang === "en" ? row.en : row.es;
}

export const orderHandoffCopy = {
  pageTitle: { es: "Detalles del pedido", en: "Order details" } satisfies TiendaLocalizedLine,
  pageSubtitle: {
    es: "Revisa tu configuración, confirma tus datos y envía el pedido. Leonix lo recibirá por correo; el pago en línea llegará después.",
    en: "Review your configuration, confirm your details, and submit the order. Leonix receives it by email; online payment comes later.",
  } satisfies TiendaLocalizedLine,

  backToConfigurator: { es: "← Volver al configurador", en: "← Back to configurator" } satisfies TiendaLocalizedLine,
  backToProduct: { es: "← Página del producto", en: "← Product page" } satisfies TiendaLocalizedLine,

  summaryTitle: { es: "Resumen del producto", en: "Product summary" } satisfies TiendaLocalizedLine,
  pricingTitle: { es: "Precio (referencia)", en: "Pricing (reference)" } satisfies TiendaLocalizedLine,
  pricingLoading: { es: "Calculando referencia…", en: "Loading reference…" } satisfies TiendaLocalizedLine,
  specsTitle: { es: "Especificaciones", en: "Specifications" } satisfies TiendaLocalizedLine,
  sidednessTitle: { es: "Lados / modalidad", en: "Sides / mode" } satisfies TiendaLocalizedLine,

  assetsTitle: { es: "Archivos y vistas", en: "Files & previews" } satisfies TiendaLocalizedLine,
  approvalTitle: { es: "Estado de aprobación (último guardado)", en: "Approval status (last save)" } satisfies TiendaLocalizedLine,
  warningsTitle: { es: "Notas de revisión", en: "Review notes" } satisfies TiendaLocalizedLine,

  formTitle: { es: "Tus datos de contacto", en: "Your contact details" } satisfies TiendaLocalizedLine,
  formIntro: {
    es: "Los usaremos para coordinar tu pedido y responderte.",
    en: "We’ll use this to coordinate your order and reach you.",
  } satisfies TiendaLocalizedLine,

  fieldFullName: { es: "Nombre completo", en: "Full name" } satisfies TiendaLocalizedLine,
  fieldBusinessName: { es: "Empresa (opcional)", en: "Business name (optional)" } satisfies TiendaLocalizedLine,
  fieldEmail: { es: "Correo electrónico", en: "Email" } satisfies TiendaLocalizedLine,
  fieldPhone: { es: "Teléfono", en: "Phone" } satisfies TiendaLocalizedLine,
  fieldNotes: { es: "Notas o instrucciones", en: "Notes or special instructions" } satisfies TiendaLocalizedLine,

  fulfillmentTitle: { es: "Cómo deseas recibir o coordinar", en: "How you’d like to receive or coordinate" } satisfies TiendaLocalizedLine,
  fulfillmentIntro: {
    es: "Las opciones exactas de envío y logística se confirman con Leonix; esto nos ayuda a preparar tu caso.",
    en: "Exact shipping and logistics are confirmed with Leonix—this helps us prepare your order.",
  } satisfies TiendaLocalizedLine,

  fulfillmentLocalPickup: {
    title: { es: "Recoger en ubicación Leonix", en: "Pick up at Leonix" } satisfies TiendaLocalizedLine,
    body: {
      es: "Coordinaremos retiro cuando el pedido esté listo.",
      en: "We’ll coordinate pickup when your order is ready.",
    } satisfies TiendaLocalizedLine,
  },
  fulfillmentLocalDelivery: {
    title: { es: "Entrega local / coordinar con Leonix", en: "Local delivery / coordinate with Leonix" } satisfies TiendaLocalizedLine,
    body: {
      es: "Acordamos detalle de entrega y ventana según disponibilidad.",
      en: "We’ll align delivery details and timing based on availability.",
    } satisfies TiendaLocalizedLine,
  },
  fulfillmentShipping: {
    title: { es: "Envío — detalles después del checkout", en: "Shipping — details after checkout" } satisfies TiendaLocalizedLine,
    body: {
      es: "Opciones de paquetería y costos se definen en la siguiente fase de implementación.",
      en: "Carrier options and costs will be defined in the next implementation phase.",
    } satisfies TiendaLocalizedLine,
  },
  fulfillmentRequired: {
    es: "Elige una preferencia de entrega o coordinación.",
    en: "Choose a fulfillment preference.",
  } satisfies TiendaLocalizedLine,

  reminderTitle: { es: "Antes de continuar", en: "Before you continue" } satisfies TiendaLocalizedLine,
  reminderIntro: {
    es: "Leonix trabaja a partir de lo que envías desde este flujo: render de referencia si diseñaste en Studio, o tu archivo listo para imprenta si usaste esa subida.",
    en: "Leonix works from what this flow submits: a reference render if you built in Studio, or your print-ready file if you used that upload path.",
  } satisfies TiendaLocalizedLine,
  reminderBullets: [
    {
      es: "Revisa ortografía y datos con calma. El constructor envía una referencia visual; la subida “lista para imprenta” entrega tu archivo original.",
      en: "Review spelling and details carefully. The builder submits a visual reference; the print-ready upload delivers your original file.",
    },
    {
      es: "Los pedidos en línea no incluyen rediseño manual salvo que contrates ayuda aparte.",
      en: "Self‑serve orders don’t include manual redesign unless you engage Leonix for design help.",
    },
    {
      es: "Para dudas o ajustes especiales: primero oficina o teléfono; la página de contacto Tienda resume correo y dirección.",
      en: "Questions or special tweaks: office or phone first; the Tienda contact page lists email and address.",
    },
  ] satisfies TiendaLocalizedLine[],

  ctaContinue: { es: "Enviar pedido a Leonix", en: "Submit order to Leonix" } satisfies TiendaLocalizedLine,
  ctaHelp: { es: "¿Prefieres ayuda humana?", en: "Prefer human help?" } satisfies TiendaLocalizedLine,
  ctaHelpHint: {
    es: "Si prefieres ayuda antes de enviar, escríbenos; no se cobra nada en esta etapa.",
    en: "Prefer help before submitting? Reach out—nothing is charged at this stage.",
  } satisfies TiendaLocalizedLine,

  savedAtLabel: { es: "Guardado en configurador:", en: "Saved from configurator:" } satisfies TiendaLocalizedLine,

  invalidTitle: { es: "No encontramos tu configuración guardada", en: "We couldn’t find your saved configuration" } satisfies TiendaLocalizedLine,
  invalidBody: {
    es: "Abre el configurador, guarda de nuevo y vuelve aquí. Si ya cerraste la pestaña, tus datos pueden haberse limpiado.",
    en: "Open the configurator, save again, and return here. If you closed the tab, your session may have cleared.",
  } satisfies TiendaLocalizedLine,
  invalidCtaBuilder: { es: "Ir al configurador", en: "Go to configurator" } satisfies TiendaLocalizedLine,

  checkoutPageTitle: { es: "Finalizar en “Detalles del pedido”", en: "Finish on “Order details”" } satisfies TiendaLocalizedLine,
  checkoutPageBody: {
    es: "Los pedidos se envían desde la página de detalles del pedido (correo a Leonix). El pago en línea se añadirá después.",
    en: "Orders are submitted from the order details page (email to Leonix). Online payment will be added later.",
  } satisfies TiendaLocalizedLine,
  checkoutBack: { es: "← Ir a detalles del pedido", en: "← Go to order details" } satisfies TiendaLocalizedLine,
} as const;
