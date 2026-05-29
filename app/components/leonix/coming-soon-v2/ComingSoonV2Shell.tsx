"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

/** Square emblem — no baked-in checkerboard (logo-clean.png has transparency grid in file). */
const HEADER_LOGO_SRC = "/logo.png";

type Lang = "es" | "en";

type NavItem = { label: string; href: string; active?: boolean };

type HeroAccent = "burgundy" | "gold";

type HeroLinePart = { text: string; accent?: HeroAccent };

type HeroLine = { parts: HeroLinePart[] };

type HeroCta = { label: string; href: string; variant: "primary" | "secondary" | "green" };

type WhatYouGetCardAccent = "burgundy" | "gold" | "green" | "qr" | "founder";

type WhatYouGetCard = {
  title: string;
  body: string;
  detail: string;
  accent: WhatYouGetCardAccent;
};

type ProcessStep = { title: string; body: string };

type QrBenefitCard = { title: string; body: string };

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
          label: "Solicitar Media Kit",
          href: "/media-kit?lang=es",
          variant: "secondary",
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
          label: "Request Media Kit",
          href: "/media-kit?lang=en",
          variant: "secondary",
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
  },
};

const heroAccentClass: Record<HeroAccent, string> = {
  burgundy: "font-bold text-[#7A1E2C]",
  gold: "font-bold text-[#8A6B1F] underline decoration-[#C9A84A] decoration-2 underline-offset-[0.2em]",
};

const heroLineClass =
  "text-[1.05rem] font-semibold leading-snug tracking-tight text-[#3D3428] sm:text-xl sm:leading-snug";

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
    <Link href={cta.href} className={styles[cta.variant]}>
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

        <div className="mt-3.5 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-2.5">
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
      className={`flex h-full flex-col rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.22)] sm:p-6 ${extra} ${
        card.accent === "founder"
          ? "bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF]"
          : ""
      } ${card.accent === "green" ? "border-l-[3px] border-l-[#2A4536]/50" : ""}`}
    >
      <WhatYouGetCardIcon accent={card.accent} />
      <h3 className="font-serif text-lg font-bold leading-snug text-[#7A1E2C] sm:text-xl">
        {card.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
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
      className="scroll-mt-28 border-t border-[#D6C7AD]/60 py-12 sm:py-14 lg:py-16"
      aria-labelledby="what-you-get-title"
    >
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E] sm:text-xs">
        {eyebrow}
      </p>
      <h2
        id="what-you-get-title"
        className="mt-3 max-w-3xl font-serif text-2xl font-bold leading-snug tracking-tight text-[#2A4536] sm:text-[1.75rem] lg:text-3xl"
      >
        {headline}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#3D3428] sm:text-[1.0625rem]">
        {intro}
      </p>

      <ul className="mt-8 grid list-none gap-5 p-0 lg:grid-cols-6 lg:gap-5">
        {cards.map((card, index) => {
          const spanClass = index < 3 ? "lg:col-span-2" : "lg:col-span-3";
          return (
            <li key={index} className={spanClass}>
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
      className="scroll-mt-28 border-t border-[#D6C7AD]/60 py-12 sm:py-14 lg:py-16"
      aria-labelledby="como-funciona-title"
    >
      <span id="how-it-works" className="block h-0 scroll-mt-28" aria-hidden />
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E] sm:text-xs">
        {eyebrow}
      </p>
      <h2
        id="como-funciona-title"
        className="mt-3 max-w-3xl font-serif text-2xl font-bold leading-snug tracking-tight text-[#2A4536] sm:text-[1.75rem] lg:text-3xl"
      >
        {headline}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#3D3428] sm:text-[1.0625rem]">
        {intro}
      </p>

      <ol
        className="mt-8 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
        aria-label={stepsAria}
      >
        {steps.map((step, index) => (
          <li key={index}>
            <article className="flex h-full flex-col rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.2)] sm:p-6">
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
      className="scroll-mt-28 border-t border-[#D6C7AD]/60 py-12 sm:py-14 lg:py-16"
      aria-labelledby="qr-title"
    >
      <span id="qr-access" className="block h-0 scroll-mt-28" aria-hidden />
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E] sm:text-xs">
        {eyebrow}
      </p>
      <h2
        id="qr-title"
        className="mt-3 max-w-3xl font-serif text-2xl font-bold leading-snug tracking-tight text-[#2A4536] sm:text-[1.75rem] lg:text-3xl"
      >
        {headline}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#3D3428] sm:text-[1.0625rem]">
        {intro}
      </p>

      <div className="mt-8 grid min-w-0 items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <p className="text-base leading-relaxed text-[#3D3428] sm:text-[1.0625rem]">
          {explanation}
        </p>

        <div className="flex min-w-0 flex-col items-center gap-4 rounded-2xl border border-[#2A4536]/20 bg-[#2A4536] px-6 py-7 text-center shadow-[0_16px_40px_-18px_rgba(42,69,54,0.65)] sm:px-8 sm:py-8">
          <DecorativeQrVisual />
          <p className="font-serif text-xl font-bold leading-snug text-[#F8F4EA] sm:text-2xl">
            {callout}
          </p>
        </div>
      </div>

      <ul
        className="mt-8 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
        aria-label={benefitsAria}
      >
        {benefits.map((benefit, index) => (
          <li key={index}>
            <article className="h-full rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)] sm:p-6">
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

function launchHref(lang: Lang) {
  return `/contact?interest=launch&lang=${lang}`;
}

function LaunchCtaLink({ lang, label }: { lang: Lang; label: string }) {
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
  const [lang, setLang] = useState<Lang>("es");
  const t = COPY[lang];
  const h = t.hero;
  const wyg = t.whatYouGet;
  const hiw = t.howItWorks;
  const qr = t.qrAccess;

  return (
    <div lang={lang} className="min-h-screen overflow-x-hidden bg-[#F5F0E6] text-[#1F241C]">
      <header className="border-b border-[#D6C7AD] bg-[#FAF6EE] shadow-[0_1px_0_0_rgba(201,168,74,0.35)]">
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
              <div
                className="flex rounded-full border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 text-[0.6875rem] font-semibold sm:text-xs"
                role="group"
                aria-label={t.langAria}
              >
                {(["es", "en"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    className={`min-h-[1.875rem] min-w-[3.25rem] rounded-full px-2 py-1 transition-colors sm:min-h-[2rem] sm:min-w-[3.5rem] sm:px-2.5 ${
                      lang === code
                        ? "bg-[#7A1E2C] text-white"
                        : "text-[#3D3428] hover:bg-[#EDE6D6]"
                    }`}
                  >
                    {COPY[code].langToggle[code]}
                  </button>
                ))}
              </div>

              <LaunchCtaLink lang={lang} label={t.launchCta} />
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

      <main id="inicio" className="relative mx-auto max-w-6xl px-4 sm:px-6" aria-label={t.mainAria}>
        <section
          className="scroll-mt-28 py-10 sm:py-12 lg:py-14"
          aria-labelledby="hero-title"
        >
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:items-start lg:gap-8 xl:gap-10">
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

              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
                {h.ctas.map((cta) => (
                  <HeroCtaLink key={cta.label} cta={cta} />
                ))}
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
      </main>
    </div>
  );
}
