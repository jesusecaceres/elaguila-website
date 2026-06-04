"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";
import {
  LEONIX_MAGAZINE_HERO_CTAS,
  resolveLeonixSiteLang,
  withLeonixLang,
  type LeonixSiteLang,
} from "@/app/lib/lang";

/** Square emblem — no baked-in checkerboard (logo-clean.png has transparency grid in file). */
const HEADER_LOGO_SRC = "/logo.png";

type Lang = "es" | "en";

type NavItem = { label: string; href: string; active?: boolean };

type HeroAccent = "burgundy" | "gold";

type HeroLinePart = { text: string; accent?: HeroAccent };

type HeroLine = { parts: HeroLinePart[] };

type HeroCta = {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "green";
  external?: boolean;
};

type WhatYouGetCardAccent = "burgundy" | "gold" | "green" | "qr" | "founder";

type WhatYouGetCard = {
  title: string;
  body: string;
  detail: string;
  accent: WhatYouGetCardAccent;
};

type ProcessStep = { title: string; body: string };

type QrBenefitCard = { title: string; body: string };

type MediaKitPreviewCard = { title: string; body: string };

type MarketplaceCategoryCard = { title: string; body: string };

const COPY: Record<
  Lang,
  {
    nav: NavItem[];
    launchCta: string;
    brandName: string;
    langToggle: { es: string; en: string };
    mainAria: string;
    navAria: string;
    langAria: string;
    hero: {
      badge: string;
      title: string;
      valueLines: [HeroLine, HeroLine, HeroLine];
      paragraph: string;
      ctas: [HeroCta, HeroCta, HeroCta];
      trustChips: [string, string, string];
      valueAria: string;
      trustAria: string;
      mediaVisual: {
        label: string;
        qrOverlay: string;
        magazineAlt: string;
      };
      magazineCta: string;
      magazineCtaHint: string;
    };
    marketplace: {
      eyebrow: string;
      headline: string;
      intro: string;
      bridge: string;
      cards: [
        MarketplaceCategoryCard,
        MarketplaceCategoryCard,
        MarketplaceCategoryCard,
        MarketplaceCategoryCard,
        MarketplaceCategoryCard,
        MarketplaceCategoryCard,
      ];
      cardsAria: string;
      closing: string;
      exploreCta: { label: string; href: string };
    };
    whatYouGet: {
      eyebrow: string;
      headline: string;
      intro: string;
      expandMore: string;
      expandLess: string;
      cards: [
        WhatYouGetCard,
        WhatYouGetCard,
        WhatYouGetCard,
        WhatYouGetCard,
        WhatYouGetCard,
      ];
    };
    howItWorks: {
      eyebrow: string;
      headline: string;
      intro: string;
      steps: [ProcessStep, ProcessStep, ProcessStep, ProcessStep];
      stepsAria: string;
    };
    qrAccess: {
      eyebrow: string;
      headline: string;
      intro: string;
      callout: string;
      explanation: string;
      benefits: [QrBenefitCard, QrBenefitCard, QrBenefitCard];
      benefitsAria: string;
    };
    mediaKitPreview: {
      eyebrow: string;
      headline: string;
      intro: string;
      cards: [
        MediaKitPreviewCard,
        MediaKitPreviewCard,
        MediaKitPreviewCard,
        MediaKitPreviewCard,
      ];
      cardsAria: string;
      ctaHeading: string;
      viewCta: { label: string; href: string };
      downloadCta: { label: string; href: string };
      supportingLine: string;
    };
    finalCta: {
      eyebrow: string;
      headline: string;
      body: string;
      ctas: [HeroCta, HeroCta, HeroCta];
      mediaKitDownload: { label: string; href: string };
    };
    contact: {
      title: string;
      body: string;
      emailLabel: string;
      email: string;
      phoneLabel: string;
      phone: string;
      phoneHref: string;
      addressLabel: string;
      address: string;
      areaLabel: string;
      area: string;
    };
    newsletter: {
      title: string;
      body: string;
      placeholder: string;
      button: string;
      formAria: string;
      emailLabel: string;
    };
    footer: string;
  }
> = {
  es: {
    nav: [
      { label: "Inicio", href: "#inicio", active: true },
      { label: "Qué obtienes", href: "#que-obtienes" },
      { label: "Cómo funciona", href: "#como-funciona" },
      { label: "Acceso QR", href: "#qr" },
      { label: "Contacto", href: "#contacto" },
    ],
    launchCta: "Únete al lanzamiento",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    mainAria: "Leonix Media — Inicio",
    navAria: "Navegación principal",
    langAria: "Idioma",
    hero: {
      badge: "PRÓXIMAMENTE",
      title: "Leonix Media",
      valueLines: [
        {
          parts: [
            { text: "Publicidad impresa en " },
            { text: "español", accent: "burgundy" },
            { text: "." },
          ],
        },
        {
          parts: [
            { text: "Exposición digital " },
            { text: "bilingüe", accent: "burgundy" },
            { text: "." },
          ],
        },
        {
          parts: [
            { text: "Acceso " },
            { text: "multilingüe", accent: "burgundy" },
            { text: " por " },
            { text: "QR", accent: "gold" },
            { text: "." },
          ],
        },
      ],
      paragraph:
        "Conecta tu negocio con la comunidad latina y multicultural del Bay Area a través de una revista premium, presencia digital bilingüe y herramientas que convierten la atención en acción.",
      ctas: [
        {
          label: "Anúnciate con nosotros",
          href: "/contact?interest=advertise&lang=es",
          variant: "primary",
        },
        {
          label: "Ver Media Kit",
          href: "/media-kit/leonix-media-kit-es.pdf",
          variant: "secondary",
          external: true,
        },
        {
          label: "Únete al lanzamiento",
          href: "/newsletter?source=coming-soon-v2&lang=es",
          variant: "green",
        },
      ],
      trustChips: ["Hecho para nuestra comunidad", "Confianza local", "Acción digital"],
      valueAria: "Propuesta de valor",
      trustAria: "Confianza",
      mediaVisual: {
        label: "Revista premium + presencia digital",
        qrOverlay: "Escanea. Traduce. Conecta.",
        magazineAlt: "Vista previa decorativa de la revista Leonix Media",
      },
      magazineCta: "Leer la revista",
      magazineCtaHint: "Lea la revista en su idioma",
    },
    marketplace: {
      eyebrow: "CLASIFICADOS + MARKETPLACE LOCAL",
      headline: "La comunidad viene por lo útil. Los negocios ganan visibilidad.",
      intro:
        "Leonix no es solo publicidad. También estamos construyendo un marketplace local donde la comunidad puede buscar, publicar y compartir oportunidades reales: rentas, empleos, autos privados, cosas en venta, eventos, comida, mascotas y más.",
      bridge:
        "Más razones para visitar Leonix significa más oportunidades para que los negocios sean vistos.",
      cardsAria: "Categorías del marketplace local",
      cards: [
        {
          title: "Varios gratis",
          body: "Cosas en venta, artículos del hogar, herramientas, ropa y más. Publicaciones pensadas para atraer tráfico local y compartir oportunidades entre vecinos.",
        },
        {
          title: "Rentas",
          body: "Cuartos, apartamentos, espacios y oportunidades de vivienda con fotos, descripción, ubicación, precio y contacto.",
        },
        {
          title: "Empleos",
          body: "Negocios que están contratando pueden conectar con personas de la comunidad que buscan trabajo y nuevas oportunidades.",
        },
        {
          title: "Autos privados",
          body: "Publicaciones de autos con fotos, descripción, precio y contacto para compradores locales.",
        },
        {
          title: "Comida + eventos",
          body: "Pop-ups, comida local, actividades, eventos comunitarios y momentos que hacen que la gente regrese.",
        },
        {
          title: "Busco + mascotas",
          body: "La comunidad también puede buscar, compartir necesidades, conectar por mascotas, objetos perdidos, adopciones o apoyo local.",
        },
      ],
      closing:
        "Clasificados trae tráfico. Negocios Locales convierte esa atención en llamadas, visitas y clientes.",
      exploreCta: { label: "Explorar Clasificados", href: "/clasificados" },
    },
    whatYouGet: {
      eyebrow: "QUÉ OBTIENES",
      headline: "Más que un anuncio: una presencia completa para tu negocio.",
      intro:
        "Leonix combina revista impresa, presencia digital y acciones por QR para ayudar a que más clientes encuentren, entiendan y contacten tu negocio.",
      expandMore: "Ver más",
      expandLess: "Ver menos",
      cards: [
        {
          title: "Revista impresa premium",
          body: "Tu negocio aparece en una publicación diseñada para conectar con la comunidad latina local.",
          detail:
            "Tu anuncio aparece dentro de una revista diseñada para sentirse local, confiable y profesional. La meta no es solo verse bonito; es poner tu negocio frente a una comunidad que quiere apoyar negocios locales.",
          accent: "burgundy",
        },
        {
          title: "Presencia digital bilingüe",
          body: "Tu anuncio también puede vivir en una experiencia digital clara, profesional y fácil de compartir.",
          detail:
            "Tu presencia digital ayuda a que el anuncio no termine en una sola página. Los clientes pueden encontrar tu información, compartirla y volver a verla desde su celular.",
          accent: "gold",
        },
        {
          title: "QR + acciones reales",
          body: "Convierte la atención en llamadas, mensajes, mapas, enlaces, ofertas y más información.",
          detail:
            "El QR ayuda a llevar a las personas desde la revista a una acción concreta: llamar, abrir un mapa, mandar mensaje, visitar un sitio web, ver redes sociales o pedir más información.",
          accent: "qr",
        },
        {
          title: "Negocios Locales",
          body: "Una presencia organizada para mostrar teléfono, ubicación, redes, fotos, reseñas y enlaces importantes.",
          detail:
            "Negocios Locales organiza tu información en un solo lugar para que el cliente no tenga que buscar entre plataformas separadas. Teléfono, dirección, mapa, redes, fotos y enlaces pueden vivir juntos.",
          accent: "green",
        },
        {
          title: "Oportunidad de lanzamiento fundador",
          body: "Sé parte de los primeros negocios en aparecer con Leonix Media durante la etapa de lanzamiento.",
          detail:
            "Durante el lanzamiento, los primeros negocios ayudan a construir la red inicial de Leonix Media. Esto crea oportunidad de visibilidad temprana mientras la comunidad empieza a conocer la plataforma.",
          accent: "founder",
        },
      ],
    },
    howItWorks: {
      eyebrow: "CÓMO FUNCIONA",
      headline: "Un proceso claro para lanzar tu presencia con Leonix.",
      intro:
        "Te guiamos desde la información inicial hasta una presencia lista para imprimir, compartir y conectar.",
      stepsAria: "Pasos del proceso",
      steps: [
        {
          title: "Elige tu camino",
          body: "Selecciona el tipo de presencia que quieres: anuncio impreso, presencia digital, QR, Media Kit o paquete de lanzamiento.",
        },
        {
          title: "Envíanos tu información",
          body: "Compártenos logo, fotos, teléfono, dirección, redes, enlaces, oferta y los detalles principales de tu negocio.",
        },
        {
          title: "Preparamos tu presencia",
          body: "Organizamos tu anuncio, tu información digital y los elementos que ayudan al cliente a entender y contactar tu negocio.",
        },
        {
          title: "Lanza y conecta",
          body: "Tu negocio queda listo para aparecer ante la comunidad y convertir interés en llamadas, mensajes, visitas y conexiones.",
        },
      ],
    },
    qrAccess: {
      eyebrow: "ACCESO QR",
      headline: "Del anuncio impreso al celular del cliente.",
      intro:
        "El QR ayuda a que tu anuncio no termine en una sola página. El cliente puede escanear, entender y tomar acción desde su teléfono.",
      callout: "Escanea. Traduce. Conecta.",
      explanation:
        "La revista mantiene su identidad en español para servir primero a nuestra comunidad latina. Con el QR, los clientes pueden abrir la experiencia digital y usar herramientas de traducción del dispositivo o navegador para entender la información en el idioma que prefieran.",
      benefitsAria: "Beneficios del acceso QR",
      benefits: [
        {
          title: "Más formas de entender",
          body: "El cliente puede apoyarse en herramientas como traducción del navegador, Google Lens o Apple Translate cuando lo necesite.",
        },
        {
          title: "Más formas de actuar",
          body: "Desde el celular puede llamar, abrir mapas, enviar mensajes, visitar enlaces, ver redes sociales o pedir más información.",
        },
        {
          title: "Sin perder la identidad",
          body: "Leonix sigue siendo una revista pensada en español, con acceso digital que ayuda a abrir la puerta a más comunidades.",
        },
      ],
    },
    mediaKitPreview: {
      eyebrow: "MEDIA KIT",
      headline: "Lo que encontrarás en el Media Kit",
      intro:
        "El Media Kit reúne la explicación completa de cómo Leonix Media combina revista impresa, presencia digital, QR, acciones reales y paquetes publicitarios para ayudar a que tu negocio se vea mejor y sea más fácil de contactar.",
      cardsAria: "Contenido del Media Kit",
      cards: [
        {
          title: "Por qué anunciarte con Leonix",
          body: "Conoce cómo Leonix ayuda a crear alcance, confianza y acción para negocios locales que quieren conectar con la comunidad latina y multicultural.",
        },
        {
          title: "QR + botones de acción",
          body: "Mira cómo un anuncio impreso puede llevar al cliente a llamar, abrir el mapa, enviar mensaje, visitar tu sitio web, ver redes sociales, reseñas y más.",
        },
        {
          title: "Negocios Locales + presencia digital",
          body: "Entiende cómo tu negocio puede tener una presencia organizada con teléfono, dirección, mapa, fotos, reseñas, redes, sitio web y botones de contacto.",
        },
        {
          title: "Paquetes y próximos pasos",
          body: "Revisa las opciones de publicidad, niveles de visibilidad y el proceso para empezar con Leonix Media.",
        },
      ],
      ctaHeading: "¿Listo para ver los detalles?",
      viewCta: {
        label: "Ver Media Kit",
        href: "/media-kit/leonix-media-kit-es.pdf",
      },
      downloadCta: {
        label: "Descargar Media Kit",
        href: "/media-kit/leonix-media-kit-es.pdf",
      },
      supportingLine:
        "Abre el Media Kit para ver formatos, beneficios, paquetes y próximos pasos.",
    },
    finalCta: {
      eyebrow: "LISTO PARA LANZAR",
      headline: "Reserva tu espacio antes del lanzamiento.",
      body: "Leonix Media está preparando su lanzamiento para conectar negocios locales con la comunidad latina y multicultural del Bay Area. Si quieres aparecer desde el inicio, este es el momento de levantar la mano.",
      ctas: [
        {
          label: "Anúnciate con nosotros",
          href: "/contact?interest=advertise&lang=es",
          variant: "primary",
        },
        {
          label: "Ver Media Kit",
          href: "/media-kit/leonix-media-kit-es.pdf",
          variant: "secondary",
          external: true,
        },
        {
          label: "Únete al lanzamiento",
          href: "/newsletter?source=coming-soon-v2&lang=es",
          variant: "green",
        },
      ],
      mediaKitDownload: {
        label: "Descargar Media Kit",
        href: "/media-kit/leonix-media-kit-es.pdf",
      },
    },
    contact: {
      title: "Contacto",
      body: "¿Tienes preguntas sobre publicidad, el Media Kit o la etapa de lanzamiento? Contáctanos y te ayudamos a elegir el mejor camino para tu negocio.",
      emailLabel: "Correo",
      email: "info@leonixmedia.com",
      phoneLabel: "Teléfono",
      phone: "(408) 303-6500",
      phoneHref: "tel:+14083036500",
      addressLabel: "Dirección",
      address: "871 Coleman Avenue, Suite 202, San Jose, CA 95110",
      areaLabel: "Área",
      area: "San José • Silicon Valley • Comunidad Latina",
    },
    newsletter: {
      title: "Sé parte del lanzamiento",
      body: "Recibe noticias, oportunidades y actualizaciones de Leonix Media.",
      placeholder: "Tu correo electrónico",
      button: "Notifícame",
      formAria: "Registro al boletín",
      emailLabel: "Correo electrónico",
    },
    footer: "© 2026 Leonix Media. Hecho para nuestra comunidad.",
  },
  en: {
    nav: [
      { label: "Home", href: "#inicio", active: true },
      { label: "What you get", href: "#que-obtienes" },
      { label: "How it works", href: "#como-funciona" },
      { label: "QR access", href: "#qr" },
      { label: "Contact", href: "#contacto" },
    ],
    launchCta: "Join the launch",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    mainAria: "Leonix Media — Home",
    navAria: "Main navigation",
    langAria: "Language",
    hero: {
      badge: "COMING SOON",
      title: "Leonix Media",
      valueLines: [
        {
          parts: [
            { text: "Spanish ", accent: "burgundy" },
            { text: "print advertising." },
          ],
        },
        {
          parts: [
            { text: "Bilingual ", accent: "burgundy" },
            { text: "digital exposure." },
          ],
        },
        {
          parts: [
            { text: "Multilingual ", accent: "burgundy" },
            { text: "access through " },
            { text: "QR", accent: "gold" },
            { text: "." },
          ],
        },
      ],
      paragraph:
        "Connect your business with the Latino and multicultural Bay Area community through a premium magazine, bilingual digital presence, and tools that turn attention into action.",
      ctas: [
        {
          label: "Advertise with us",
          href: "/contact?interest=advertise&lang=en",
          variant: "primary",
        },
        {
          label: "View Media Kit",
          href: "/media-kit/leonix-media-kit-en.pdf",
          variant: "secondary",
          external: true,
        },
        {
          label: "Join the launch",
          href: "/newsletter?source=coming-soon-v2&lang=en",
          variant: "green",
        },
      ],
      trustChips: ["Built for our community", "Local trust", "Digital action"],
      valueAria: "Value proposition",
      trustAria: "Trust",
      mediaVisual: {
        label: "Premium magazine + digital presence",
        qrOverlay: "Scan. Translate. Connect.",
        magazineAlt: "Decorative Leonix Media magazine preview",
      },
      magazineCta: "Read the magazine",
      magazineCtaHint: "Read the magazine in your language",
    },
    marketplace: {
      eyebrow: "CLASSIFIEDS + LOCAL MARKETPLACE",
      headline: "The community comes for what they need. Businesses gain visibility.",
      intro:
        "Leonix is not only advertising. We are also building a local marketplace where the community can search, post, and share real opportunities: rentals, jobs, private autos, items for sale, events, food, pets, and more.",
      bridge:
        "More reasons to visit Leonix means more opportunities for businesses to be seen.",
      cardsAria: "Local marketplace categories",
      cards: [
        {
          title: "Free stuff for sale",
          body: "Items for sale, home goods, tools, clothing, and more. Listings designed to bring local traffic and help neighbors share opportunities.",
        },
        {
          title: "Rentals",
          body: "Rooms, apartments, spaces, and housing opportunities with photos, description, location, price, and contact.",
        },
        {
          title: "Jobs",
          body: "Businesses that are hiring can connect with people in the community looking for work and new opportunities.",
        },
        {
          title: "Private autos",
          body: "Car listings with photos, description, price, and contact for local buyers.",
        },
        {
          title: "Food + events",
          body: "Pop-ups, local food, activities, community events, and moments that keep people coming back.",
        },
        {
          title: "Wanted + pets",
          body: "The community can also search, share needs, connect around pets, lost items, adoptions, or local support.",
        },
      ],
      closing:
        "Classifieds bring traffic. Local Businesses turn that attention into calls, visits, and customers.",
      exploreCta: { label: "Explore Classifieds", href: "/clasificados" },
    },
    whatYouGet: {
      eyebrow: "WHAT YOU GET",
      headline: "More than an ad: a complete presence for your business.",
      intro:
        "Leonix combines print magazine visibility, digital presence, and QR-powered actions to help more customers find, understand, and contact your business.",
      expandMore: "Learn more",
      expandLess: "Show less",
      cards: [
        {
          title: "Premium print magazine",
          body: "Your business appears in a publication designed to connect with the local Latino community.",
          detail:
            "Your ad appears inside a magazine designed to feel local, trustworthy, and professional. The goal is not just to look good; it is to place your business in front of a community that wants to support local businesses.",
          accent: "burgundy",
        },
        {
          title: "Bilingual digital presence",
          body: "Your ad can also live in a clear, professional digital experience that is easy to share.",
          detail:
            "Your digital presence helps the ad go beyond a single page. Customers can find your information, share it, and return to it from their phone.",
          accent: "gold",
        },
        {
          title: "QR + real actions",
          body: "Turn attention into calls, messages, maps, links, offers, and more information.",
          detail:
            "The QR helps move people from the magazine to a concrete action: call, open a map, send a message, visit a website, view social media, or request more information.",
          accent: "qr",
        },
        {
          title: "Local Businesses",
          body: "An organized presence for phone, location, socials, photos, reviews, and important links.",
          detail:
            "Local Businesses organizes your information in one place so customers do not have to search across separate platforms. Phone, address, map, socials, photos, and links can live together.",
          accent: "green",
        },
        {
          title: "Founder launch opportunity",
          body: "Be one of the first businesses featured with Leonix Media during the launch stage.",
          detail:
            "During launch, the first businesses help build the initial Leonix Media network. This creates an early visibility opportunity while the community starts discovering the platform.",
          accent: "founder",
        },
      ],
    },
    howItWorks: {
      eyebrow: "HOW IT WORKS",
      headline: "A clear process to launch your presence with Leonix.",
      intro:
        "We guide you from the first information to a presence ready to print, share, and connect.",
      stepsAria: "Process steps",
      steps: [
        {
          title: "Choose your path",
          body: "Select the type of presence you want: print ad, digital presence, QR, Media Kit, or launch package.",
        },
        {
          title: "Send your information",
          body: "Share your logo, photos, phone, address, socials, links, offer, and the main details of your business.",
        },
        {
          title: "We prepare your presence",
          body: "We organize your ad, your digital information, and the elements that help customers understand and contact your business.",
        },
        {
          title: "Launch and connect",
          body: "Your business is ready to appear in front of the community and turn interest into calls, messages, visits, and connections.",
        },
      ],
    },
    qrAccess: {
      eyebrow: "QR ACCESS",
      headline: "From the printed ad to the customer's phone.",
      intro:
        "The QR helps your ad go beyond a single page. Customers can scan, understand, and take action from their phone.",
      callout: "Scan. Translate. Connect.",
      explanation:
        "The magazine keeps its Spanish-first identity to serve our Latino community first. Through QR, customers can open the digital experience and use device or browser translation tools to understand the information in the language they prefer.",
      benefitsAria: "QR access benefits",
      benefits: [
        {
          title: "More ways to understand",
          body: "Customers can use tools like browser translation, Google Lens, or Apple Translate when they need them.",
        },
        {
          title: "More ways to act",
          body: "From their phone, they can call, open maps, send messages, visit links, view social media, or request more information.",
        },
        {
          title: "Identity stays intact",
          body: "Leonix remains a Spanish-first magazine, with digital access that helps open the door to more communities.",
        },
      ],
    },
    mediaKitPreview: {
      eyebrow: "MEDIA KIT",
      headline: "What you'll find in the Media Kit",
      intro:
        "The Media Kit brings together the full explanation of how Leonix Media combines print magazine exposure, digital presence, QR, real actions, and advertising packages to help your business look stronger and become easier to contact.",
      cardsAria: "Media Kit contents",
      cards: [
        {
          title: "Why advertise with Leonix",
          body: "See how Leonix helps create reach, trust, and action for local businesses that want to connect with the Latino and multicultural community.",
        },
        {
          title: "QR + action buttons",
          body: "See how a printed ad can help customers call you, open your map, send a message, visit your website, view social media, reviews, and more.",
        },
        {
          title: "Local Businesses + digital presence",
          body: "Understand how your business can have an organized presence with phone, address, map, photos, reviews, social media, website, and contact buttons.",
        },
        {
          title: "Packages and next steps",
          body: "Review advertising options, visibility levels, and the process to get started with Leonix Media.",
        },
      ],
      ctaHeading: "Ready to see the details?",
      viewCta: {
        label: "View Media Kit",
        href: "/media-kit/leonix-media-kit-en.pdf",
      },
      downloadCta: {
        label: "Download Media Kit",
        href: "/media-kit/leonix-media-kit-en.pdf",
      },
      supportingLine:
        "Open the Media Kit to see formats, benefits, packages, and next steps.",
    },
    finalCta: {
      eyebrow: "READY TO LAUNCH",
      headline: "Reserve your space before launch.",
      body: "Leonix Media is preparing its launch to connect local businesses with the Latino and multicultural Bay Area community. If you want to appear from the beginning, this is the moment to raise your hand.",
      ctas: [
        {
          label: "Advertise with us",
          href: "/contact?interest=advertise&lang=en",
          variant: "primary",
        },
        {
          label: "View Media Kit",
          href: "/media-kit/leonix-media-kit-en.pdf",
          variant: "secondary",
          external: true,
        },
        {
          label: "Join the launch",
          href: "/newsletter?source=coming-soon-v2&lang=en",
          variant: "green",
        },
      ],
      mediaKitDownload: {
        label: "Download Media Kit",
        href: "/media-kit/leonix-media-kit-en.pdf",
      },
    },
    contact: {
      title: "Contact",
      body: "Have questions about advertising, the Media Kit, or the launch stage? Contact us and we'll help you choose the best path for your business.",
      emailLabel: "Email",
      email: "info@leonixmedia.com",
      phoneLabel: "Phone",
      phone: "(408) 303-6500",
      phoneHref: "tel:+14083036500",
      addressLabel: "Address",
      address: "871 Coleman Avenue, Suite 202, San Jose, CA 95110",
      areaLabel: "Area",
      area: "San José • Silicon Valley • Latino Community",
    },
    newsletter: {
      title: "Be part of the launch",
      body: "Receive news, opportunities, and updates from Leonix Media.",
      placeholder: "Your email address",
      button: "Notify Me",
      formAria: "Newsletter signup",
      emailLabel: "Email address",
    },
    footer: "© 2026 Leonix Media. Built for our community.",
  },
};

const heroAccentClass: Record<HeroAccent, string> = {
  burgundy: "font-bold text-[#7A1E2C]",
  gold: "font-bold text-[#8A6B1F] underline decoration-[#C9A84A] decoration-2 underline-offset-[0.2em]",
};

const heroLineClass =
  "text-[1.05rem] font-semibold leading-snug tracking-tight text-[#3D3428] sm:text-xl sm:leading-snug";

/** Sticky header clearance — taller on mobile where nav pills stack below the bar. */
const ANCHOR_SCROLL = "scroll-mt-32 lg:scroll-mt-28";

const sectionShellClass = `${ANCHOR_SCROLL} border-t border-[#D6C7AD]/55 py-11 sm:py-12 lg:py-14`;

const sectionEyebrowClass =
  "text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E] sm:text-xs";

const sectionTitleClass =
  "mt-3 max-w-3xl font-serif text-2xl font-bold leading-snug tracking-tight text-[#2A4536] sm:text-[1.75rem] lg:text-3xl";

const sectionIntroClass =
  "mt-4 max-w-2xl text-base leading-relaxed text-[#3D3428] sm:text-[1.0625rem]";

const cardShellClass =
  "rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] shadow-[0_10px_28px_-16px_rgba(31,36,28,0.2)]";

function HeroLineText({ line }: { line: HeroLine }) {
  return (
    <>
      {line.parts.map((part, index) =>
        part.accent ? (
          <span key={`${part.text}-${index}`} className={heroAccentClass[part.accent]}>
            {part.text}
          </span>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        )
      )}
    </>
  );
}

function HeroCtaLink({ cta }: { cta: HeroCta }) {
  const base =
    "inline-flex min-h-[3rem] w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-bold transition sm:min-h-[3.125rem] sm:w-auto sm:text-[0.9375rem]";
  const styles = {
    primary: `${base} bg-[#7A1E2C] text-white shadow-[0_8px_20px_-6px_rgba(122,30,44,0.5)] hover:bg-[#5e1721]`,
    secondary: `${base} border-2 border-[#C9A84A] bg-[#FFFDF7] text-[#1F241C] shadow-sm hover:border-[#b89742] hover:bg-[#FBF7EF]`,
    green: `${base} bg-[#2A4536] text-[#F8F4EA] shadow-[0_6px_16px_-6px_rgba(42,69,54,0.45)] hover:bg-[#223528]`,
  };
  return (
    <Link
      href={cta.href}
      className={`${styles[cta.variant]} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C]`}
      {...(cta.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {cta.label}
    </Link>
  );
}

function TrustChipIcon() {
  return (
    <span
      className="mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#C9A84A]/50 bg-[#C9A84A]/12 text-[#8A6B1F]"
      aria-hidden
    >
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l2 4.2 4.7.7-3.4 3.3.8 4.7L12 14.2 7.9 16l.8-4.7-3.4-3.3 4.7-.7L12 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function HeroMediaVisual({
  label,
  qrOverlay,
  magazineAlt,
}: {
  label: string;
  qrOverlay: string;
  magazineAlt: string;
}) {
  return (
    <aside className="w-full min-w-0 lg:justify-self-stretch" aria-label={label}>
      <div className="mx-auto w-full max-w-[min(100%,22rem)] sm:max-w-[min(100%,26rem)] lg:mx-0 lg:max-w-none">
        <div className="w-full overflow-hidden rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7] shadow-[0_20px_48px_-20px_rgba(31,36,28,0.38)] ring-1 ring-[#C9A84A]/12">
          <Image
            src="/magazine/leonix-media-launch-es.png"
            alt={magazineAlt}
            width={1792}
            height={1344}
            className="block h-auto w-full max-w-full"
            sizes="(max-width: 640px) 352px, (max-width: 1024px) 416px, 512px"
            priority
          />
        </div>

        <div className="mt-3.5 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-2.5 lg:items-start lg:justify-start">
          <p className="inline-flex max-w-full rounded-full border border-[#C9A84A]/55 bg-[#FFFDF7] px-3 py-1.5 text-center text-[0.65rem] font-bold uppercase tracking-[0.11em] text-[#2A4536] shadow-sm sm:text-[0.68rem]">
            {label}
          </p>
          <p className="inline-flex max-w-full rounded-full border border-[#C9A84A]/45 bg-[#2A4536] px-3 py-1.5 text-center font-serif text-[0.75rem] font-bold leading-snug text-[#F8F4EA] shadow-[0_6px_16px_-10px_rgba(42,69,54,0.65)] sm:text-[0.8125rem]">
            {qrOverlay}
          </p>
        </div>
      </div>
    </aside>
  );
}

const cardAccentStyles: Record<
  WhatYouGetCardAccent,
  { iconRing: string; iconBg: string; iconText: string; articleExtra?: string }
> = {
  burgundy: {
    iconRing: "border-[#7A1E2C]/35",
    iconBg: "bg-[#7A1E2C]/10",
    iconText: "text-[#7A1E2C]",
  },
  gold: {
    iconRing: "border-[#C9A84A]/45",
    iconBg: "bg-[#C9A84A]/12",
    iconText: "text-[#8A6B1F]",
  },
  green: {
    iconRing: "border-[#2A4536]/35",
    iconBg: "bg-[#2A4536]/10",
    iconText: "text-[#2A4536]",
  },
  qr: {
    iconRing: "border-[#C9A84A]/55",
    iconBg: "bg-[#FFFDF7]",
    iconText: "text-[#7A1E2C]",
  },
  founder: {
    iconRing: "border-[#C9A84A]/55",
    iconBg: "bg-gradient-to-br from-[#7A1E2C]/12 to-[#C9A84A]/15",
    iconText: "text-[#7A1E2C]",
    articleExtra: "ring-1 ring-[#C9A84A]/35",
  },
};

function WhatYouGetCardIcon({ accent }: { accent: WhatYouGetCardAccent }) {
  const s = cardAccentStyles[accent];
  return (
    <span
      className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 ${s.iconRing} ${s.iconBg} ${s.iconText}`}
      aria-hidden
    >
      {accent === "qr" ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3v3h-3v-3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

function WhatYouGetCardArticle({
  card,
  index,
  isOpen,
  expandMore,
  expandLess,
  onToggle,
}: {
  card: WhatYouGetCard;
  index: number;
  isOpen: boolean;
  expandMore: string;
  expandLess: string;
  onToggle: () => void;
}) {
  const detailId = `wyg-detail-${index}`;
  const extra = cardAccentStyles[card.accent].articleExtra ?? "";

  return (
    <article
      className={`flex h-full flex-col ${cardShellClass} p-5 sm:p-6 ${extra} ${
        card.accent === "founder"
          ? "bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF]"
          : ""
      } ${card.accent === "green" ? "border-l-[3px] border-l-[#2A4536]/50" : ""}`}
    >
      <WhatYouGetCardIcon accent={card.accent} />
      <h3 className="font-serif text-lg font-bold leading-snug text-[#7A1E2C] sm:text-xl">
        {card.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
        {card.body}
      </p>

      <button
        type="button"
        className="mt-4 inline-flex min-h-[2.25rem] self-start items-center rounded-full border border-[#C9A84A]/55 bg-[#FFFDF7] px-3.5 py-1.5 text-xs font-semibold text-[#7A1E2C] transition-colors hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C] sm:text-[0.8125rem]"
        aria-expanded={isOpen}
        aria-controls={detailId}
        onClick={onToggle}
      >
        {isOpen ? expandLess : expandMore}
      </button>

      <div
        id={detailId}
        aria-hidden={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-3 border-t border-[#C9A84A]/40 pt-3">
            <p className="text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
              {card.detail}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

const marketplaceCardAccents = [
  {
    ring: "border-[#7A1E2C]/35",
    bg: "bg-[#7A1E2C]/10",
    text: "text-[#7A1E2C]",
    dot: "bg-[#7A1E2C]",
  },
  {
    ring: "border-[#2A4536]/35",
    bg: "bg-[#2A4536]/10",
    text: "text-[#2A4536]",
    dot: "bg-[#2A4536]",
  },
  {
    ring: "border-[#C9A84A]/55",
    bg: "bg-[#C9A84A]/12",
    text: "text-[#8A6B1F]",
    dot: "bg-[#C9A84A]",
  },
  {
    ring: "border-[#7A1E2C]/35",
    bg: "bg-gradient-to-br from-[#7A1E2C]/10 to-[#C9A84A]/12",
    text: "text-[#7A1E2C]",
    dot: "bg-[#7A1E2C]",
  },
  {
    ring: "border-[#2A4536]/35",
    bg: "bg-[#2A4536]/10",
    text: "text-[#2A4536]",
    dot: "bg-[#2A4536]",
  },
  {
    ring: "border-[#C9A84A]/55",
    bg: "bg-[#C9A84A]/12",
    text: "text-[#8A6B1F]",
    dot: "bg-[#C9A84A]",
  },
] as const;

function MarketplaceCategoryIcon({ index }: { index: number }) {
  const accent = marketplaceCardAccents[index];
  return (
    <span
      className={`mb-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${accent.ring} ${accent.bg}`}
      aria-hidden
    >
      <span className={`h-2.5 w-2.5 rounded-full ${accent.dot}`} />
    </span>
  );
}

function MarketplaceSection({
  eyebrow,
  headline,
  intro,
  bridge,
  cards,
  cardsAria,
  closing,
  exploreCta,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  bridge: string;
  cards: [
    MarketplaceCategoryCard,
    MarketplaceCategoryCard,
    MarketplaceCategoryCard,
    MarketplaceCategoryCard,
    MarketplaceCategoryCard,
    MarketplaceCategoryCard,
  ];
  cardsAria: string;
  closing: string;
  exploreCta: { label: string; href: string };
}) {
  return (
    <section
      id="marketplace"
      className={sectionShellClass}
      aria-labelledby="marketplace-title"
    >
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 id="marketplace-title" className={sectionTitleClass}>
        {headline}
      </h2>
      <p className={`${sectionIntroClass} max-w-3xl`}>{intro}</p>
      <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-[#2A4536] sm:text-[0.9375rem]">
        {bridge}
      </p>

      <ul
        className="mt-8 grid min-w-0 list-none gap-4 p-0 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
        aria-label={cardsAria}
      >
        {cards.map((card, index) => (
          <li key={index} className="flex min-w-0">
            <article
              className={`flex h-full w-full min-w-0 flex-col ${cardShellClass} border-l-[3px] border-l-[#C9A84A]/45 p-4 sm:p-5`}
            >
              <MarketplaceCategoryIcon index={index} />
              <h3 className="font-serif text-base font-bold leading-snug text-[#7A1E2C] sm:text-lg">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#3D3428] sm:text-[0.875rem]">
                {card.body}
              </p>
            </article>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl border border-[#2A4536]/25 bg-gradient-to-br from-[#2A4536] via-[#2A4536] to-[#1a2d24] p-5 shadow-[0_16px_40px_-18px_rgba(42,69,54,0.55)] sm:p-6">
        <p className="max-w-3xl font-serif text-lg font-bold leading-snug text-[#F8F4EA] sm:text-xl">
          {closing}
        </p>
        <Link
          href={exploreCta.href}
          className="mt-4 inline-flex min-h-[2.5rem] items-center text-sm font-semibold text-[#C9A84A] underline decoration-[#C9A84A]/50 underline-offset-[0.25em] transition-colors hover:text-[#EDE6D6] hover:decoration-[#EDE6D6]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A] sm:text-[0.9375rem]"
        >
          {exploreCta.label}
        </Link>
      </div>
    </section>
  );
}

function WhatYouGetSection({
  eyebrow,
  headline,
  intro,
  cards,
  expandMore,
  expandLess,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  cards: WhatYouGetCard[];
  expandMore: string;
  expandLess: string;
}) {
  const [openCards, setOpenCards] = useState<Set<number>>(() => new Set());

  const toggleCard = (index: number) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <section
      id="que-obtienes"
      className={sectionShellClass}
      aria-labelledby="what-you-get-title"
    >
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 id="what-you-get-title" className={sectionTitleClass}>
        {headline}
      </h2>
      <p className={sectionIntroClass}>{intro}</p>

      <ul className="mt-8 grid list-none gap-5 p-0 sm:gap-5 lg:grid-cols-6">
        {cards.map((card, index) => {
          const spanClass = index < 3 ? "lg:col-span-2" : "lg:col-span-3";
          return (
            <li key={index} className={`flex ${spanClass}`}>
              <WhatYouGetCardArticle
                card={card}
                index={index}
                isOpen={openCards.has(index)}
                expandMore={expandMore}
                expandLess={expandLess}
                onToggle={() => toggleCard(index)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const processStepBadgeStyles = [
  "bg-[#7A1E2C] text-white ring-[#C9A84A]/45",
  "bg-[#2A4536] text-[#F8F4EA] ring-[#C9A84A]/40",
  "bg-[#C9A84A] text-[#1F241C] ring-[#7A1E2C]/20",
  "bg-[#7A1E2C] text-white ring-[#2A4536]/35",
] as const;

function HowItWorksSection({
  eyebrow,
  headline,
  intro,
  steps,
  stepsAria,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  steps: [ProcessStep, ProcessStep, ProcessStep, ProcessStep];
  stepsAria: string;
}) {
  return (
    <section
      id="como-funciona"
      className={sectionShellClass}
      aria-labelledby="como-funciona-title"
    >
      <span id="how-it-works" className="block h-0" aria-hidden />
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 id="como-funciona-title" className={sectionTitleClass}>
        {headline}
      </h2>
      <p className={sectionIntroClass}>{intro}</p>

      <ol
        className="mt-8 grid list-none gap-5 p-0 sm:grid-cols-2 sm:items-stretch lg:grid-cols-4"
        aria-label={stepsAria}
      >
        {steps.map((step, index) => (
          <li key={index} className="flex">
            <article className={`flex h-full w-full flex-col ${cardShellClass} p-5 sm:p-6`}>
              <span
                className={`mb-4 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2 ${processStepBadgeStyles[index]}`}
                aria-hidden
              >
                {index + 1}
              </span>
              <h3 className="font-serif text-lg font-bold leading-snug text-[#7A1E2C] sm:text-xl">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
                {step.body}
              </p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Decorative QR-style grid — not scannable. */
function DecorativeQrVisual() {
  const pattern = [
    1, 1, 1, 1, 1, 0, 1,
    1, 0, 0, 0, 1, 0, 1,
    1, 0, 1, 0, 1, 0, 0,
    1, 0, 0, 0, 1, 0, 1,
    1, 1, 1, 0, 1, 0, 1,
    0, 0, 0, 0, 0, 0, 1,
    1, 1, 1, 0, 1, 1, 1,
  ];

  return (
    <div
      className="rounded-xl border-2 border-[#C9A84A]/45 bg-[#FFFDF7] p-2.5 shadow-inner sm:p-3"
      aria-hidden
    >
      <div className="grid grid-cols-7 gap-0.5">
        {pattern.map((filled, index) => (
          <span
            key={index}
            className={`h-2.5 w-2.5 rounded-[1px] sm:h-3 sm:w-3 ${
              filled ? "bg-[#2A4536]" : "bg-[#F8F4EA]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function QrAccessSection({
  eyebrow,
  headline,
  intro,
  callout,
  explanation,
  benefits,
  benefitsAria,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  callout: string;
  explanation: string;
  benefits: [QrBenefitCard, QrBenefitCard, QrBenefitCard];
  benefitsAria: string;
}) {
  return (
    <section
      id="qr"
      className={sectionShellClass}
      aria-labelledby="qr-title"
    >
      <span id="qr-access" className="block h-0" aria-hidden />
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 id="qr-title" className={sectionTitleClass}>
        {headline}
      </h2>
      <p className={sectionIntroClass}>{intro}</p>

      <div className="mt-8 grid min-w-0 items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <p className="text-base leading-relaxed text-[#3D3428] sm:text-[1.0625rem] lg:max-w-xl">
          {explanation}
        </p>

        <div className="flex min-w-0 max-w-md flex-col items-center gap-4 self-center rounded-2xl border border-[#2A4536]/20 bg-[#2A4536] px-6 py-6 text-center shadow-[0_16px_40px_-18px_rgba(42,69,54,0.65)] sm:px-8 sm:py-7 lg:max-w-none lg:self-start">
          <DecorativeQrVisual />
          <p className="font-serif text-xl font-bold leading-snug text-[#F8F4EA] sm:text-[1.75rem]">
            {callout}
          </p>
        </div>
      </div>

      <ul
        className="mt-8 grid list-none gap-5 p-0 sm:grid-cols-2 sm:items-stretch lg:grid-cols-3"
        aria-label={benefitsAria}
      >
        {benefits.map((benefit, index) => (
          <li key={index} className="flex">
            <article className={`h-full w-full ${cardShellClass} p-5 sm:p-6`}>
              <h3 className="font-serif text-lg font-bold leading-snug text-[#7A1E2C]">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
                {benefit.body}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

const mediaKitPreviewAccents = [
  {
    ring: "border-[#7A1E2C]/35",
    bg: "bg-[#7A1E2C]/10",
    text: "text-[#7A1E2C]",
  },
  {
    ring: "border-[#C9A84A]/55",
    bg: "bg-[#C9A84A]/12",
    text: "text-[#8A6B1F]",
  },
  {
    ring: "border-[#2A4536]/35",
    bg: "bg-[#2A4536]/10",
    text: "text-[#2A4536]",
  },
  {
    ring: "border-[#C9A84A]/55",
    bg: "bg-gradient-to-br from-[#7A1E2C]/12 to-[#C9A84A]/15",
    text: "text-[#7A1E2C]",
  },
] as const;

function MediaKitPreviewCardIcon({ index }: { index: number }) {
  const accent = mediaKitPreviewAccents[index];
  return (
    <span
      className={`mb-4 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${accent.ring} ${accent.bg} ${accent.text}`}
      aria-hidden
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 4h10v16H7V4zm2 2v12h6V6H9zm1.5 2h3v1.5h-3V8zm0 2.5h3v1.5h-3v-1.5z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function MediaKitPreviewSection({
  eyebrow,
  headline,
  intro,
  cards,
  cardsAria,
  ctaHeading,
  viewCta,
  downloadCta,
  supportingLine,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  cards: [
    MediaKitPreviewCard,
    MediaKitPreviewCard,
    MediaKitPreviewCard,
    MediaKitPreviewCard,
  ];
  cardsAria: string;
  ctaHeading: string;
  viewCta: { label: string; href: string };
  downloadCta: { label: string; href: string };
  supportingLine: string;
}) {
  const viewLinkCta: HeroCta = {
    label: viewCta.label,
    href: viewCta.href,
    variant: "secondary",
    external: true,
  };

  return (
    <section
      id="media-kit-preview"
      className={sectionShellClass}
      aria-labelledby="media-kit-preview-title"
    >
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 id="media-kit-preview-title" className={sectionTitleClass}>
        {headline}
      </h2>
      <p className={`${sectionIntroClass} max-w-3xl`}>{intro}</p>

      <ul
        className="mt-8 grid list-none gap-5 p-0 sm:grid-cols-2 sm:items-stretch lg:grid-cols-4"
        aria-label={cardsAria}
      >
        {cards.map((card, index) => (
          <li key={index} className="flex">
            <article
              className={`flex h-full w-full flex-col ${cardShellClass} p-5 ring-1 ring-[#C9A84A]/10 sm:p-6`}
            >
              <MediaKitPreviewCardIcon index={index} />
              <h3 className="font-serif text-lg font-bold leading-snug text-[#7A1E2C]">
                {card.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
                {card.body}
              </p>
            </article>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl border border-[#C9A84A]/40 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-6 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.18)] ring-1 ring-[#C9A84A]/15 sm:p-7">
        <h3 className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
          {ctaHeading}
        </h3>
        <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2.5">
          <HeroCtaLink cta={viewLinkCta} />
          <MediaKitDownloadLink
            label={downloadCta.label}
            href={downloadCta.href}
            tone="light"
          />
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428]/90 sm:text-[0.9375rem]">
          {supportingLine}
        </p>
      </div>
    </section>
  );
}

function MediaKitDownloadLink({
  label,
  href,
  tone = "dark",
}: {
  label: string;
  href: string;
  tone?: "dark" | "light";
}) {
  const toneClass =
    tone === "dark"
      ? "border-[#C9A84A]/40 bg-[#1a2d24]/35 text-[#EDE6D6] hover:border-[#C9A84A]/60 hover:bg-[#1a2d24]/55"
      : "border-[#C9A84A]/55 bg-[#FFFDF7] text-[#2A4536] hover:border-[#C9A84A] hover:bg-[#FBF7EF]";

  return (
    <a
      href={href}
      download
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-[3rem] w-full items-center justify-center rounded-full border px-5 py-3 text-center text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C] sm:min-h-[3.125rem] sm:w-auto sm:px-6 sm:text-[0.9375rem] ${toneClass}`}
    >
      {label}
    </a>
  );
}

function FinalCtaActions({
  ctas,
  mediaKitDownload,
}: {
  ctas: [HeroCta, HeroCta, HeroCta];
  mediaKitDownload: { label: string; href: string };
}) {
  const [advertiseCta, mediaKitViewCta, joinCta] = ctas;

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
      <HeroCtaLink cta={advertiseCta} />
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
        <HeroCtaLink cta={mediaKitViewCta} />
        <MediaKitDownloadLink
          label={mediaKitDownload.label}
          href={mediaKitDownload.href}
        />
      </div>
      <HeroCtaLink cta={joinCta} />
    </div>
  );
}

function FinalContactSection({
  finalCta,
  contact,
  newsletter,
  lang,
}: {
  finalCta: {
    eyebrow: string;
    headline: string;
    body: string;
    ctas: [HeroCta, HeroCta, HeroCta];
    mediaKitDownload: { label: string; href: string };
  };
  contact: {
    title: string;
    body: string;
    emailLabel: string;
    email: string;
    phoneLabel: string;
    phone: string;
    phoneHref: string;
    addressLabel: string;
    address: string;
    areaLabel: string;
    area: string;
  };
  newsletter: {
    title: string;
    body: string;
    formAria: string;
    emailLabel: string;
    placeholder: string;
    button: string;
  };
  lang: LeonixSiteLang;
}) {
  return (
    <section
      id="contacto"
      className={sectionShellClass}
      aria-labelledby="contacto-title"
    >
      <span id="contact" className="block h-0" aria-hidden />

      <div className="rounded-2xl border border-[#C9A84A]/35 bg-gradient-to-br from-[#2A4536] via-[#2A4536] to-[#1a2d24] p-6 shadow-[0_20px_48px_-24px_rgba(31,36,28,0.55)] sm:p-8">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#C9A84A] sm:text-xs">
          {finalCta.eyebrow}
        </p>
        <h2
          id="contacto-title"
          className="mt-3 max-w-2xl font-serif text-2xl font-bold leading-snug tracking-tight text-[#F8F4EA] sm:text-[1.75rem] lg:text-3xl"
        >
          {finalCta.headline}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#EDE6D6] sm:text-[1.0625rem]">
          {finalCta.body}
        </p>
        <FinalCtaActions
          ctas={finalCta.ctas.map((cta) => ({
            ...cta,
            href: cta.href.includes("lang=") ? withLeonixLang(cta.href, lang) : cta.href,
          })) as [HeroCta, HeroCta, HeroCta]}
          mediaKitDownload={finalCta.mediaKitDownload}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-6 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)] sm:p-8">
        <h2 className="font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">
          {contact.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#3D3428] sm:text-[1.0625rem]">
          {contact.body}
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#556B3E]">
              {contact.emailLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold sm:text-base">
              <a
                href={`mailto:${contact.email}`}
                className="text-[#7A1E2C] underline decoration-[#C9A84A]/60 underline-offset-[0.2em] hover:text-[#5e1721]"
              >
                {contact.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#556B3E]">
              {contact.phoneLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold sm:text-base">
              <a
                href={contact.phoneHref}
                className="text-[#7A1E2C] underline decoration-[#C9A84A]/60 underline-offset-[0.2em] hover:text-[#5e1721]"
              >
                {contact.phone}
              </a>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#556B3E]">
              {contact.addressLabel}
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-[#3D3428] sm:text-base">
              {contact.address}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#556B3E]">
              {contact.areaLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#2A4536] sm:text-base">
              {contact.area}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#2A4536]/20 bg-[#2A4536] p-6 shadow-[0_16px_40px_-18px_rgba(42,69,54,0.55)] sm:p-8">
        <h2 className="font-serif text-xl font-bold text-[#F8F4EA] sm:text-2xl">
          {newsletter.title}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#EDE6D6] sm:text-base">
          {newsletter.body}
        </p>
        <form
          action="/newsletter"
          method="get"
          className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch"
          aria-label={newsletter.formAria}
        >
          <input type="hidden" name="source" value="coming-soon-v2" />
          <input type="hidden" name="lang" value={lang} />
          <label htmlFor="coming-soon-v2-newsletter-email" className="sr-only">
            {newsletter.emailLabel}
          </label>
          <input
            id="coming-soon-v2-newsletter-email"
            type="email"
            name="email"
            placeholder={newsletter.placeholder}
            autoComplete="email"
            className="min-h-[3rem] min-w-0 flex-1 rounded-full border border-[#C9A84A]/45 bg-[#FFFDF7] px-4 text-sm text-[#1F241C] placeholder:text-[#3D3428]/55 focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/40 sm:text-[0.9375rem]"
          />
          <button
            type="submit"
            className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(122,30,44,0.5)] transition hover:bg-[#5e1721] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A] sm:text-[0.9375rem]"
          >
            {newsletter.button}
          </button>
        </form>
      </div>
    </section>
  );
}

function ComingSoonV2Footer({ text }: { text: string }) {
  return (
    <footer className="border-t border-[#D6C7AD]/55 bg-[#FAF6EE] py-6 sm:py-7">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-sm font-medium text-[#3D3428]">{text}</p>
      </div>
    </footer>
  );
}

function launchHref(lang: LeonixSiteLang) {
  return `/contact?interest=launch&lang=${lang}`;
}

function LaunchCtaLink({ lang, label }: { lang: LeonixSiteLang; label: string }) {
  return (
    <Link
      href={launchHref(lang)}
      className="inline-flex min-h-[2rem] shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] px-3 py-1.5 text-[0.7rem] font-bold text-white shadow-[0_3px_10px_-3px_rgba(122,30,44,0.55)] transition-colors hover:bg-[#5e1721] sm:min-h-[2.125rem] sm:px-3.5 sm:text-xs lg:text-sm"
    >
      {label}
    </Link>
  );
}

export function ComingSoonV2Shell() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center bg-[#F5F0E6] text-[#3D3428]"
          aria-busy="true"
        />
      }
    >
      <ComingSoonV2ShellContent />
    </Suspense>
  );
}

function ComingSoonV2ShellContent() {
  const searchParams = useSearchParams();
  const urlLang = searchParams?.get("lang");
  const routeLang = resolveLeonixSiteLang(urlLang);
  const displayLang: Lang = routeLang === "es" ? "es" : "en";

  const t = COPY[displayLang];
  const h = t.hero;
  const mp = t.marketplace;
  const wyg = t.whatYouGet;
  const hiw = t.howItWorks;
  const qr = t.qrAccess;
  const mkp = t.mediaKitPreview;
  const final = t.finalCta;
  const contact = t.contact;
  const newsletter = t.newsletter;
  const magazineHref = `/magazine?lang=${routeLang}`;
  const magazineHero = LEONIX_MAGAZINE_HERO_CTAS[routeLang];

  const heroCtas = useMemo(
    () =>
      h.ctas.map((cta) => ({
        ...cta,
        href: cta.href.includes("lang=") ? withLeonixLang(cta.href, routeLang) : cta.href,
      })),
    [h.ctas, routeLang]
  );

  return (
    <div lang={routeLang} className="min-h-screen overflow-x-hidden bg-[#F5F0E6] text-[#1F241C]">
      <header className="sticky top-0 z-50 border-b border-[#D6C7AD] bg-[#FAF6EE]/95 shadow-[0_1px_0_0_rgba(201,168,74,0.35)] backdrop-blur-sm supports-[backdrop-filter]:bg-[#FAF6EE]/90">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-0 py-1.5 sm:gap-x-4 sm:py-2 lg:py-2">
            <Link
              href="#inicio"
              className="flex shrink-0 items-center gap-1.5 sm:gap-2"
              aria-label={t.brandName}
            >
              <span className="inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#120f0c] ring-1 ring-[#C9A84A]/35 sm:h-9 sm:w-9 lg:h-10 lg:w-10">
                <Image
                  src={HEADER_LOGO_SRC}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover object-center"
                  priority
                  aria-hidden
                />
              </span>
              <span className="font-serif text-xs font-bold leading-tight text-[#2A4536] sm:text-sm lg:text-[0.9375rem]">
                {t.brandName}
              </span>
            </Link>

            <nav
              className="hidden min-w-0 items-center justify-center gap-x-4 text-[0.8125rem] font-medium text-[#3D3428] lg:flex xl:gap-x-5 xl:text-[0.875rem]"
              aria-label={t.navAria}
            >
              {t.nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={
                    item.active
                      ? "whitespace-nowrap text-[#7A1E2C] underline decoration-[#7A1E2C] decoration-2 underline-offset-[0.3em]"
                      : "whitespace-nowrap hover:text-[#7A1E2C]"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
              <LeonixHeaderLanguageSelector variant="full" pathnameOverride="/coming-soon-v2" />

              <LaunchCtaLink lang={routeLang} label={t.launchCta} />
            </div>
          </div>

          <nav
            className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
            aria-label={t.navAria}
          >
            {t.nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold sm:px-3 sm:py-1.5 sm:text-xs ${
                  item.active
                    ? "bg-[#7A1E2C]/10 text-[#7A1E2C] ring-1 ring-[#7A1E2C]/25"
                    : "bg-[#FFFDF7] text-[#3D3428] ring-1 ring-[#D6C7AD]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main
        id="inicio"
        className={`relative mx-auto max-w-6xl px-4 sm:px-6 ${ANCHOR_SCROLL}`}
        aria-label={t.mainAria}
      >
        <section
          className="pb-10 pt-2 sm:pb-12 sm:pt-3 lg:pb-14 lg:pt-4"
          aria-labelledby="hero-title"
        >
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:items-start lg:gap-10 xl:gap-12">
            <div className="min-w-0 max-w-3xl lg:max-w-none">
              <p className="inline-flex rounded-full border border-[#C9A84A]/65 bg-[#FFFDF7] px-3.5 py-1 text-[0.68rem] font-bold tracking-[0.14em] text-[#7A1E2C] sm:text-xs">
                {h.badge}
              </p>

              <h1
                id="hero-title"
                className="mt-5 font-serif text-[2.35rem] font-bold leading-[1.05] tracking-tight text-[#2A4536] sm:mt-6 sm:text-5xl lg:text-[3.15rem]"
              >
                {h.title}
              </h1>

              <ul
                className="mt-6 space-y-2.5 border-l-[3px] border-[#C9A84A]/55 pl-4 sm:mt-7 sm:space-y-3 sm:pl-5"
                aria-label={h.valueAria}
              >
                {h.valueLines.map((line, index) => (
                  <li
                    key={index}
                    className={
                      index === 2
                        ? `${heroLineClass} rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7] px-3 py-2.5 sm:px-4`
                        : heroLineClass
                    }
                  >
                    <HeroLineText line={line} />
                  </li>
                ))}
              </ul>

              <p className="mt-6 max-w-[38rem] text-base leading-relaxed text-[#3D3428] sm:mt-8 sm:text-[1.0625rem]">
                {h.paragraph}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-stretch">
                {heroCtas.map((cta) => (
                  <HeroCtaLink key={cta.label} cta={cta} />
                ))}
                <HeroCtaLink
                  cta={{
                    label: magazineHero.read,
                    href: magazineHref,
                    variant: "secondary",
                  }}
                />
                <HeroCtaLink
                  cta={{
                    label: magazineHero.digital,
                    href: magazineHref,
                    variant: "green",
                  }}
                />
              </div>

              <ul
                className="mt-8 flex flex-col gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4"
                aria-label={h.trustAria}
              >
                {h.trustChips.map((chip) => (
                  <li
                    key={chip}
                    className="flex items-center text-sm font-semibold text-[#3D3428]"
                  >
                    <TrustChipIcon />
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            <HeroMediaVisual
              label={h.mediaVisual.label}
              qrOverlay={h.mediaVisual.qrOverlay}
              magazineAlt={h.mediaVisual.magazineAlt}
            />
          </div>
        </section>

        <MarketplaceSection
          eyebrow={mp.eyebrow}
          headline={mp.headline}
          intro={mp.intro}
          bridge={mp.bridge}
          cards={mp.cards}
          cardsAria={mp.cardsAria}
          closing={mp.closing}
          exploreCta={mp.exploreCta}
        />

        <WhatYouGetSection
          eyebrow={wyg.eyebrow}
          headline={wyg.headline}
          intro={wyg.intro}
          cards={wyg.cards}
          expandMore={wyg.expandMore}
          expandLess={wyg.expandLess}
        />

        <HowItWorksSection
          eyebrow={hiw.eyebrow}
          headline={hiw.headline}
          intro={hiw.intro}
          steps={hiw.steps}
          stepsAria={hiw.stepsAria}
        />

        <QrAccessSection
          eyebrow={qr.eyebrow}
          headline={qr.headline}
          intro={qr.intro}
          callout={qr.callout}
          explanation={qr.explanation}
          benefits={qr.benefits}
          benefitsAria={qr.benefitsAria}
        />

        <MediaKitPreviewSection
          eyebrow={mkp.eyebrow}
          headline={mkp.headline}
          intro={mkp.intro}
          cards={mkp.cards}
          cardsAria={mkp.cardsAria}
          ctaHeading={mkp.ctaHeading}
          viewCta={mkp.viewCta}
          downloadCta={mkp.downloadCta}
          supportingLine={mkp.supportingLine}
        />

        <FinalContactSection
          finalCta={final}
          contact={contact}
          newsletter={newsletter}
          lang={routeLang}
        />
      </main>

      <ComingSoonV2Footer text={t.footer} />
    </div>
  );
}
