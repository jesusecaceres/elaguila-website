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
      es: "Tarjetas con constructor en línea, volantes y gran formato con subida de archivos, y catálogo promo con cotización humana. Leonix produce con acabado profesional — llama a la oficina o escríbenos si necesitas diseño o algo a medida.",
      en: "Business cards with an online builder, flyers and large format with file upload, and promo lines quoted by humans. Leonix produces with a pro finish — call the office or message us for design or custom work.",
    },
    ctaPrimary: { es: "Ver productos", en: "Shop products" },
    ctaSecondary: { es: "Ayuda Tienda / diseño", en: "Tienda help / design" },
    supportingLine: {
      es: "Tarjetas • Gran formato • Marketing impreso • Merch y promo con Leonix",
      en: "Cards • Large format • Marketing print • Merch & promo with Leonix",
    },
  },
  sections: {
    categories: {
      eyebrow: { es: "Explorar", en: "Browse" },
      title: { es: "Comprar por categoría", en: "Shop by category" },
      description: {
        es: "Tarjetas, volantes, materiales de marketing y productos promocionales — el foco principal de la tienda.",
        en: "Business cards, flyers, marketing materials, and promotional products — the core of the storefront.",
      },
    },
    featured: {
      eyebrow: { es: "Catálogo", en: "Catalog" },
      title: {
        es: "Surtido promo y destacados",
        en: "Featured sourced & promo picks",
      },
      description: {
        es: "Surtido especial desde el catálogo admin de Leonix — cada tarjeta muestra imagen y notas honestas de precio.",
        en: "Sourced or specialty picks from the Leonix admin catalog — every card shows imagery and honest pricing notes.",
      },
    },
    howItWorks: {
      eyebrow: { es: "Flujo simple", en: "Simple flow" },
      title: { es: "Cómo funciona", en: "How it works" },
      description: {
        es: "Arma tu pedido en la Tienda; Leonix revisa y confirma antes de producción. Si falta diseño o hay algo especial, mejor llamar a la oficina.",
        en: "Build your order in the store; Leonix reviews and confirms before production. If you need design or something special, calling the office is fastest.",
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
          title: { es: "Sube o diseña", en: "Upload or design" },
          body: {
            es: "Tarjetas: constructor en línea o subida cuando aplique. Volantes, brochures y gran formato: sube PDF u otros formatos aceptados. Leonix valida sangrado y resolución al revisar el pedido.",
            en: "Cards: online builder or upload when applicable. Flyers, brochures, and large format: upload PDFs or other accepted formats. Leonix checks bleed and resolution when we review your order.",
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
      futureCtaButtonUpload: { es: "Subir archivos", en: "Upload files" },
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

