import type { Lang } from "../types/tienda";

export const tiendaCopy = {
  hero: {
    eyebrow: {
      es: "Tienda Leonix • Impresión para negocios",
      en: "Leonix Store • Print for business",
    },
    headline: {
      es: "Impresión premium para tu marca.",
      en: "Premium print for your brand.",
    },
    subhead: {
      es: "Elige tu producto, sube tu archivo listo para imprimir y Leonix lo produce con acabado profesional. ¿Necesitas diseño o una cotización especial? Te ayudamos.",
      en: "Choose your product, upload print‑ready artwork, and Leonix produces it with a professional finish. Need design help or a custom quote? We’ve got you.",
    },
    ctaPrimary: { es: "Ver productos", en: "Shop products" },
    ctaSecondary: { es: "Necesito diseño", en: "Need design help" },
    supportingLine: {
      es: "Listo para subir archivos • Materiales de marketing • Producción confiable para negocios",
      en: "Upload‑ready • Marketing materials • Reliable production for businesses",
    },
  },
  sections: {
    categories: {
      eyebrow: { es: "Explorar", en: "Browse" },
      title: { es: "Comprar por categoría", en: "Shop by category" },
      description: {
        es: "Una base clara para crecer a páginas de categoría y productos. Empieza con los esenciales de marketing y ventas.",
        en: "A clean foundation to scale into category and product pages. Start with business essentials.",
      },
    },
    featured: {
      eyebrow: { es: "Listo para ordenar", en: "Ready to order" },
      title: { es: "Más vendidos", en: "Best sellers" },
      description: {
        es: "Productos estándar, orden fácil, y flujo listo para subir arte cuando activemos el configurador.",
        en: "Standard products, easy ordering, and an upload‑ready flow once configurators go live.",
      },
    },
    howItWorks: {
      eyebrow: { es: "Flujo simple", en: "Simple flow" },
      title: { es: "Cómo funciona", en: "How it works" },
      description: {
        es: "Compra en línea cuando tu archivo está listo. Si no, te ayudamos con diseño y ajustes.",
        en: "Order online when your file is ready. If not, we can help with design and adjustments.",
      },
      steps: [
        {
          title: { es: "Elige tu producto", en: "Choose your product" },
          body: {
            es: "Selecciona la familia (tarjetas, flyers, banners, etc.) y la opción ideal.",
            en: "Pick the product family (cards, flyers, banners, etc.) and the right option.",
          },
        },
        {
          title: { es: "Sube tu arte", en: "Upload your artwork" },
          body: {
            es: "Recomendado: archivo listo para imprimir. Pronto tendrás guía y verificación.",
            en: "Print‑ready is best. Soon you’ll have guided upload and checks.",
          },
        },
        {
          title: { es: "Imprimimos y entregamos", en: "We print and deliver" },
          body: {
            es: "Producción profesional y soporte cuando lo necesites.",
            en: "Professional production with support when you need it.",
          },
        },
      ],
      note: {
        es: "Nota: Si necesitas diseño, correcciones o una cotización especial, usa la opción de ayuda personalizada.",
        en: "Note: If you need design, corrections, or a special quote, choose the custom help option.",
      },
    },
    split: {
      title: { es: "Auto‑servicio vs ayuda personalizada", en: "Self‑serve vs custom help" },
      left: {
        title: { es: "Listo para imprimir", en: "Ready to print" },
        body: {
          es: "Para archivos listos, productos estándar y pedidos rápidos.",
          en: "For print‑ready files, standard products, and fast ordering.",
        },
        bullets: {
          es: ["Flujo simple", "Opciones estándar", "Entrega confiable"] as string[],
          en: ["Simple flow", "Standard options", "Reliable delivery"] as string[],
        },
        cta: { es: "Explorar productos", en: "Browse products" },
      },
      right: {
        title: { es: "¿Necesitas diseño o cotización?", en: "Need design or a custom quote?" },
        body: {
          es: "Para layouts, ajustes, pedidos especiales, o apoyo de marca.",
          en: "For layouts, adjustments, specialty requests, or brand support.",
        },
        bullets: {
          es: ["Diseño y retoque", "Pedidos especiales", "Soporte de marca"] as string[],
          en: ["Design & retouch", "Specialty requests", "Brand support"] as string[],
        },
        cta: { es: "Contactar a Leonix", en: "Contact Leonix" },
      },
    },
    trust: {
      eyebrow: { es: "Calidad", en: "Quality" },
      title: { es: "Producción en la que puedes confiar", en: "Production you can trust" },
      items: {
        es: [
          "Impresión de alta calidad y acabados profesionales",
          "Manejo cuidadoso de archivos y especificaciones",
          "Soluciones enfocadas en negocios (ventas, branding, señalización)",
          "Soporte humano cuando lo necesitas",
          "Flujo local de producción y cumplimiento con Leonix",
        ] as string[],
        en: [
          "High‑quality print and professional finishes",
          "Careful file handling and specs",
          "Business‑focused solutions (sales, branding, signage)",
          "Human support when needed",
          "Local production + fulfillment workflow with Leonix",
        ] as string[],
      },
    },
    finalCta: {
      title: { es: "Listo para imprimir con Leonix", en: "Ready to print with Leonix" },
      body: {
        es: "Empieza por categoría o cuéntanos lo que necesitas. Construimos esta Tienda para crecer con tu negocio.",
        en: "Start by category or tell us what you need. This storefront is built to scale with your business.",
      },
      primary: { es: "Comprar ahora", en: "Shop now" },
      secondary: { es: "Hablar con Leonix", en: "Talk to Leonix" },
    },
    categoryPage: {
      backToStore: { es: "← Volver a la Tienda", en: "← Back to store" },
      productFamilies: { es: "Familias de producto", en: "Product families" },
      categoryWorks: { es: "Cómo funciona esta categoría", en: "How this category works" },
      closingTitle: { es: "¿Listo para el siguiente paso?", en: "Ready for the next step?" },
      closingBody: {
        es: "Explora una familia o escríbenos si necesitas algo a medida.",
        en: "Explore a family or message us if you need something custom.",
      },
    },
    productPage: {
      backToCategory: { es: "← Volver a la categoría", en: "← Back to category" },
      specs: { es: "Especificaciones", en: "Specs" },
      options: { es: "Opciones destacadas", en: "Highlighted options" },
      howOrdered: { es: "Cómo se ordena este producto", en: "How this product is ordered" },
      fileQuality: { es: "Archivos y responsabilidad", en: "Files & responsibility" },
      needHelp: { es: "¿Necesitas diseño o ayuda?", en: "Need design help?" },
      futureCtaTitle: { es: "Siguiente: configurador", en: "Next: configurator" },
      futureCtaBody: {
        es: "Aquí conectarás el editor o la carga de archivos. Aún no hay checkout—solo preparación del pedido.",
        en: "This is where the editor or file upload will connect. No checkout yet—just order preparation.",
      },
      futureCtaButtonDesigner: { es: "Abrir constructor", en: "Open builder" },
      futureCtaButtonUpload: { es: "Subir archivo (pronto)", en: "Upload file (soon)" },
      futureCtaButtonContact: { es: "Hablar con Leonix", en: "Talk to Leonix" },
    },
    modeLabels: {
      designOnline: { es: "Diseño en línea", en: "Design online" },
      uploadReady: { es: "Sube tu archivo", en: "Upload print‑ready" },
      mixed: { es: "Mixto (diseño o archivo)", en: "Mixed (design or upload)" },
    },
  },
} as const;

export function pick<T>(v: { es: T; en: T }, lang: Lang): T {
  return lang === "en" ? v.en : v.es;
}

