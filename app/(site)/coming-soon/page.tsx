import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type Lang = "es" | "en";
type DrawerId = "anunciate" | "launch" | "ediciones" | "beneficios" | "nosotros" | "contacto" | "mediakit";

const DEEP_RED = "#A30F18";
const DARK_RED = "#7E0D13";
const CREAM = "#FDFBF7";
const LOGO_SRC = "/logo-clean.png";

function normalizeLang(v: string | undefined): Lang {
  return v === "en" ? "en" : "es";
}

function drawerInputId(id: DrawerId) {
  return `cs-drawer-${id}`;
}

const COPY = {
  es: {
    meta: {
      title: "Próximamente — Leonix Media",
      description:
        "Publicidad impresa en español. Exposición digital multilingüe. San José · Silicon Valley · Bay Area.",
    },
    langSwitch: "English",
    headerCta: "Únete al lanzamiento",
    badge: "PRÓXIMAMENTE",
    tagline1: "Publicidad impresa en",
    tagline1Em: "español",
    tagline2: "Exposición digital",
    tagline2Em: "multilingüe",
    heroBody:
      "Leonix está pensado para la comunidad latina y la publicidad impresa en español, mientras que la experiencia digital amplía el alcance con QR codes, herramientas de traducción y acceso multilingüe.",
    multilingualReach:
      "La revista nace en español para servir a nuestra comunidad latina, pero la experiencia digital está diseñada para llegar más lejos: lectores pueden usar QR codes, herramientas de traducción y páginas digitales para explorar contenido, anuncios y negocios en su idioma.",
    cta1: "Anúnciate con nosotros",
    cta2: "Únete al lanzamiento",
    mediaKit: "Ver Media Kit",
    trust: ["Hecho para nuestra comunidad", "Confianza local", "Resultados reales"],
    slogan: "Que Ruja El León — Let The Lion Roar",
    navLabels: ["Inicio", "Anúnciate", "Ediciones", "Beneficios", "Sobre Nosotros", "Contacto"],
    magazine: {
      guide: "Guía de negocios locales",
      connect: "Conecta tu negocio con nuestra comunidad",
      advertise: "Anuncie aquí",
      partner: "Partner oficial",
      sample: "Ejemplo",
    },
    cats: {
      items: [
        { name: "Clasificados", sub: "Rentas, empleos, a la venta, mascotas y busco" },
        {
          name: "Nuestros Negocios",
          sub: "Restaurantes, servicios, bienes raíces, autos y viajes",
        },
        { name: "Comunidad", sub: "Clases, recursos y conexiones locales" },
      ],
    },
    benefits: {
      items: [
        { title: "Revista mensual premium", body: "Contenido local que informa, inspira y conecta." },
        { title: "Edición digital semanal", body: "Accede desde cualquier dispositivo, donde estés." },
        {
          title: "QR + CTAs",
          body: "Conecta tu anuncio con llamadas, mensajes, mapas, enlaces y opciones multilingües.",
        },
        {
          title: "Un solo enlace para tu negocio",
          body: "Toda tu información, ofertas y redes en un solo lugar.",
        },
      ],
    },
    signup: {
      title: "Sé parte del lanzamiento",
      sub: "Recibe noticias, oportunidades y el lanzamiento oficial de Leonix Media.",
      placeholder: "Tu correo electrónico",
      cta: "Notifícame",
    },
    footer: {
      left: "San José · Silicon Valley · Bay Area · Comunidad Latina",
      rights: "Todos los derechos reservados",
    },
    drawers: {
      anunciate: {
        title: "Anúnciate con Leonix",
        who: "Negocios locales, profesionales, restaurantes, servicios, tiendas, anunciantes y socios comunitarios.",
        what: "Revista impresa en español + exposición digital multilingüe.",
        where: "San José, Silicon Valley, Bay Area y Northern California.",
        when: "Lanzamiento próximamente; oportunidades para negocios fundadores abiertas ahora.",
        why: "Para que los negocios locales se vean profesionales, sean fáciles de contactar y lleguen a más clientes.",
        bullets: [
          "Revista impresa premium",
          "Exposición digital multilingüe",
          "QR codes para llamadas, mensajes, mapas, enlaces y traducción",
          "Página de negocio con redes, contacto, ofertas y reseñas",
          "Cupones, clasificados y descubrimiento local",
        ],
        cta: "Contactar a Leonix",
      },
      launch: {
        title: "Únete al lanzamiento",
        body: "Estamos preparando el lanzamiento oficial de Leonix Media en San José, Silicon Valley y el Bay Area. Únete para recibir noticias del lanzamiento y conocer oportunidades para negocios fundadores antes del estreno.",
        bullets: [
          "Sé de los primeros en conocer el lanzamiento",
          "Accede a oportunidades para negocios fundadores",
          "Recibe avisos de ediciones, beneficios y promociones",
          "Mantente conectado con la comunidad latina",
        ],
        cta: "Notifícame",
      },
      ediciones: {
        title: "Ediciones Leonix",
        body: "Leonix combina una revista mensual premium impresa en español con una edición digital semanal para presencia constante — no solo un anuncio aislado.",
        bullets: [
          "Revista mensual premium en español",
          "Edición digital semanal con QR y CTAs",
          "Contenido local, empresarial y comunitario",
          "Exposición digital multilingüe para ampliar alcance",
        ],
        cta: "Contactar a Leonix",
      },
      beneficios: {
        title: "Beneficios para negocios",
        body: "Leonix está diseñado para que tu negocio sea más fácil de encontrar, contactar y recordar — en impreso y digital.",
        bullets: [
          "La revista impresa está enfocada en español",
          "La experiencia digital ayuda a llegar a más idiomas mediante QR codes, traducción del sitio y herramientas como Google Lens o Apple Translate",
          "QR codes para acceder a contenido digital, llamadas, mensajes y mapas",
          "Un solo enlace para tu negocio con redes, contacto y ofertas",
          "Más confianza local y presencia profesional para compartir",
        ],
        note: "Las traducciones automáticas pueden variar; recomendamos revisar contenido importante.",
        cta: "Contactar a Leonix",
      },
      nosotros: {
        title: "Sobre Leonix Media",
        body: "Leonix Media conecta negocios locales con la comunidad latina mediante publicidad impresa en español y exposición digital multilingüe. Nuestra misión es servir a la comunidad latina con contenido confiable, mientras la experiencia digital abre puertas a un alcance más inclusivo.",
        who: "Negocios locales, familias, anunciantes y comunidad latina.",
        what: "Revista premium, clasificados, negocios, comunidad, cupones, QR codes y páginas de negocio.",
        where: "San José, Silicon Valley, Bay Area y Northern California.",
        why: "Porque la comunidad latina merece opciones confiables y los negocios locales merecen ser vistos con profesionalismo.",
        cta: "Contactar a Leonix",
      },
      contacto: {
        title: "Contacto",
        body: "¿Quieres anunciar tu negocio, participar como socio fundador o conocer el media kit?",
        cta: "Contactar a Leonix",
      },
      mediakit: {
        title: "Media Kit",
        body: "El media kit incluirá opciones de anuncios, paquetes de lanzamiento, presencia impresa, exposición digital multilingüe, QR codes, CTAs, productos para promoción y oportunidades para negocios fundadores.",
        cta: "Solicitar Media Kit",
      },
    },
    close: "Cerrar",
  },
  en: {
    meta: {
      title: "Coming Soon — Leonix Media",
      description:
        "Spanish print advertising. Multilingual digital exposure. San José · Silicon Valley · Bay Area.",
    },
    langSwitch: "Español",
    headerCta: "Join the launch",
    badge: "COMING SOON",
    tagline1: "Print advertising in",
    tagline1Em: "Spanish",
    tagline2: "Multilingual digital",
    tagline2Em: "exposure",
    heroBody:
      "Leonix is tailored to the Latino community and Spanish print, while the digital experience expands reach with QR codes, translation tools and multilingual access.",
    multilingualReach:
      "The magazine is born in Spanish to serve our Latino community, but the digital experience is designed to go further: readers can use QR codes, translation tools and digital pages to explore content, ads and businesses in their language.",
    cta1: "Advertise with us",
    cta2: "Join the launch",
    mediaKit: "View Media Kit",
    trust: ["Made for our community", "Local trust", "Real results"],
    slogan: "Que Ruja El León — Let The Lion Roar",
    navLabels: ["Home", "Advertise", "Editions", "Benefits", "About Us", "Contact"],
    magazine: {
      guide: "Local business guide",
      connect: "Connect your business with our community",
      advertise: "Advertise here",
      partner: "Official partner",
      sample: "Sample",
    },
    cats: {
      items: [
        { name: "Classifieds", sub: "Rentals, jobs, for sale, pets and wanted" },
        {
          name: "Our Businesses",
          sub: "Restaurants, services, real estate, autos and travel",
        },
        { name: "Community", sub: "Classes, resources and local connections" },
      ],
    },
    benefits: {
      items: [
        { title: "Monthly premium magazine", body: "Local content that informs, inspires and connects." },
        { title: "Weekly digital edition", body: "Access from any device, wherever you are." },
        {
          title: "QR + CTAs",
          body: "Link your ad to calls, messages, maps, links and multilingual options.",
        },
        {
          title: "One link for your business",
          body: "All your info, deals and networks in one place.",
        },
      ],
    },
    signup: {
      title: "Be part of the launch",
      sub: "Get news, opportunities and the official Leonix Media launch.",
      placeholder: "Your email address",
      cta: "Notify Me",
    },
    footer: {
      left: "San José · Silicon Valley · Bay Area · Latino Community",
      rights: "All rights reserved",
    },
    drawers: {
      anunciate: {
        title: "Advertise with Leonix",
        who: "Local businesses, professionals, restaurants, services, stores, advertisers and community partners.",
        what: "Spanish print magazine + multilingual digital exposure.",
        where: "San José, Silicon Valley, Bay Area and Northern California.",
        when: "Launch coming soon; founding business opportunities open now.",
        why: "So local businesses look professional, are easy to contact and reach more customers.",
        bullets: [
          "Premium print magazine",
          "Multilingual digital exposure",
          "QR codes for calls, messages, maps, links and translation",
          "Business page with social, contact, deals and reviews",
          "Coupons, classifieds and local discovery",
        ],
        cta: "Contact Leonix",
      },
      launch: {
        title: "Join the launch",
        body: "We are preparing the official Leonix Media launch in San José, Silicon Valley and the Bay Area. Join to get launch news and learn about founding business opportunities before we go live.",
        bullets: [
          "Be among the first to know about the launch",
          "Access founding business opportunities",
          "Get edition, benefit and promotion updates",
          "Stay connected with the Latino community",
        ],
        cta: "Notify Me",
      },
      ediciones: {
        title: "Leonix Editions",
        body: "Leonix combines a monthly premium Spanish print magazine with a weekly digital edition for constant presence — not just a one-off ad.",
        bullets: [
          "Monthly premium magazine in Spanish",
          "Weekly digital edition with QR and CTAs",
          "Local, business and community content",
          "Multilingual digital exposure to expand reach",
        ],
        cta: "Contact Leonix",
      },
      beneficios: {
        title: "Benefits for businesses",
        body: "Leonix is designed so your business is easier to find, contact and remember — in print and digital.",
        bullets: [
          "The print magazine is focused on Spanish",
          "The digital experience helps reach more languages via QR codes, site translation and tools like Google Lens or Apple Translate",
          "QR codes to access digital content, calls, messages and maps",
          "One link for your business with social, contact and deals",
          "More local trust and a professional presence to share",
        ],
        note: "Automatic translations may vary; we recommend reviewing important content.",
        cta: "Contact Leonix",
      },
      nosotros: {
        title: "About Leonix Media",
        body: "Leonix Media connects local businesses with the Latino community through Spanish print advertising and multilingual digital exposure. Our mission is to serve the Latino community with reliable content while the digital experience opens doors to more inclusive reach.",
        who: "Local businesses, families, advertisers and the Latino community.",
        what: "Premium magazine, classifieds, businesses, community, coupons, QR codes and business pages.",
        where: "San José, Silicon Valley, Bay Area and Northern California.",
        why: "Because the Latino community deserves reliable options and local businesses deserve to be seen professionally.",
        cta: "Contact Leonix",
      },
      contacto: {
        title: "Contact",
        body: "Want to advertise your business, join as a founding partner or request the media kit?",
        cta: "Contact Leonix",
      },
      mediakit: {
        title: "Media Kit",
        body: "The media kit will include ad options, launch packages, print presence, multilingual digital exposure, QR codes, CTAs, promotional products and founding business opportunities.",
        cta: "Request Media Kit",
      },
    },
    close: "Close",
  },
} as const;

const NAV_DRAWERS: (DrawerId | null)[] = [
  null,
  "anunciate",
  "ediciones",
  "beneficios",
  "nosotros",
  "contacto",
];

function ArrowIcon() {
  return (
    <svg className="ml-2 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M3 10a1 1 0 011-1h10.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L14.586 11H4a1 1 0 01-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DrawerTrigger({
  id,
  className,
  style,
  children,
}: {
  id: DrawerId;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <label htmlFor={drawerInputId(id)} className={`cursor-pointer ${className ?? ""}`} style={style}>
      {children}
    </label>
  );
}

function DrawerShell({
  id,
  title,
  closeLabel,
  children,
}: {
  id: DrawerId;
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const inputId = drawerInputId(id);
  return (
    <>
      <input type="checkbox" id={inputId} className="peer hidden" />
      <div className="fixed inset-0 z-[200] hidden justify-end peer-checked:flex">
        <label htmlFor={inputId} className="absolute inset-0 bg-black/50" aria-label={closeLabel} />
        <div
          className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-hidden shadow-2xl"
          style={{ background: "var(--lx-card)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${inputId}-title`}
        >
          <div
            className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4"
            style={{ borderColor: "var(--lx-border)" }}
          >
            <h2 id={`${inputId}-title`} className="text-lg font-bold sm:text-xl" style={{ color: "var(--lx-text)" }}>
              {title}
            </h2>
            <label
              htmlFor={inputId}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-2xl leading-none transition hover:opacity-70"
              style={{ background: "var(--lx-section)", color: "var(--lx-text)" }}
              aria-label={closeLabel}
            >
              ×
            </label>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">{children}</div>
        </div>
      </div>
    </>
  );
}

function DrawerPanels({ lang, c }: { lang: Lang; c: (typeof COPY)[Lang] }) {
  const d = c.drawers;
  const contactHref = `/contacto?lang=${lang}`;

  return (
    <>
      <DrawerShell id="anunciate" title={d.anunciate.title} closeLabel={c.close}>
        <dl className="flex flex-col gap-4 text-sm sm:text-base">
          {(
            [
              [lang === "es" ? "Quién" : "Who", d.anunciate.who],
              [lang === "es" ? "Qué" : "What", d.anunciate.what],
              [lang === "es" ? "Dónde" : "Where", d.anunciate.where],
              [lang === "es" ? "Cuándo" : "When", d.anunciate.when],
              [lang === "es" ? "Por qué" : "Why", d.anunciate.why],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="font-bold" style={{ color: DEEP_RED }}>
                {label}
              </dt>
              <dd className="mt-1" style={{ color: "var(--lx-muted)" }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm font-bold sm:text-base" style={{ color: "var(--lx-text)" }}>
          {lang === "es" ? "Beneficios" : "Benefits"}
        </p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {d.anunciate.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-sm sm:text-base">
              <span style={{ color: "var(--lx-olive)" }} aria-hidden>
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <Link
          href={contactHref}
          className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white sm:text-base"
          style={{ background: DEEP_RED }}
        >
          {d.anunciate.cta}
        </Link>
      </DrawerShell>

      <DrawerShell id="launch" title={d.launch.title} closeLabel={c.close}>
        <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-muted)" }}>
          {d.launch.body}
        </p>
        <ul className="mt-5 flex flex-col gap-2.5">
          {d.launch.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-sm sm:text-base">
              <span style={{ color: "var(--lx-olive)" }} aria-hidden>
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <a
          href="#signup"
          className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white sm:text-base"
          style={{ background: DEEP_RED }}
        >
          {d.launch.cta}
        </a>
      </DrawerShell>

      <DrawerShell id="ediciones" title={d.ediciones.title} closeLabel={c.close}>
        <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-muted)" }}>
          {d.ediciones.body}
        </p>
        <ul className="mt-5 flex flex-col gap-2.5">
          {d.ediciones.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-sm sm:text-base">
              <span style={{ color: "var(--lx-lion)" }} aria-hidden>
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <Link
          href={contactHref}
          className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white sm:text-base"
          style={{ background: DEEP_RED }}
        >
          {d.ediciones.cta}
        </Link>
      </DrawerShell>

      <DrawerShell id="beneficios" title={d.beneficios.title} closeLabel={c.close}>
        <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-muted)" }}>
          {d.beneficios.body}
        </p>
        <ul className="mt-5 flex flex-col gap-2.5">
          {d.beneficios.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-sm sm:text-base">
              <span style={{ color: "var(--lx-olive)" }} aria-hidden>
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {"note" in d.beneficios && d.beneficios.note ? (
          <p className="mt-4 text-xs leading-relaxed italic sm:text-sm" style={{ color: "var(--lx-muted)" }}>
            {d.beneficios.note}
          </p>
        ) : null}
        <Link
          href={contactHref}
          className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white sm:text-base"
          style={{ background: DEEP_RED }}
        >
          {d.beneficios.cta}
        </Link>
      </DrawerShell>

      <DrawerShell id="nosotros" title={d.nosotros.title} closeLabel={c.close}>
        <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-muted)" }}>
          {d.nosotros.body}
        </p>
        <dl className="mt-6 flex flex-col gap-4 text-sm sm:text-base">
          <div>
            <dt className="font-bold" style={{ color: DEEP_RED }}>
              {lang === "es" ? "Quién" : "Who"}
            </dt>
            <dd className="mt-1" style={{ color: "var(--lx-muted)" }}>
              {d.nosotros.who}
            </dd>
          </div>
          <div>
            <dt className="font-bold" style={{ color: DEEP_RED }}>
              {lang === "es" ? "Qué" : "What"}
            </dt>
            <dd className="mt-1" style={{ color: "var(--lx-muted)" }}>
              {d.nosotros.what}
            </dd>
          </div>
          <div>
            <dt className="font-bold" style={{ color: DEEP_RED }}>
              {lang === "es" ? "Dónde" : "Where"}
            </dt>
            <dd className="mt-1" style={{ color: "var(--lx-muted)" }}>
              {d.nosotros.where}
            </dd>
          </div>
          <div>
            <dt className="font-bold" style={{ color: DEEP_RED }}>
              {lang === "es" ? "Por qué" : "Why"}
            </dt>
            <dd className="mt-1" style={{ color: "var(--lx-muted)" }}>
              {d.nosotros.why}
            </dd>
          </div>
        </dl>
        <Link
          href={contactHref}
          className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white sm:text-base"
          style={{ background: DEEP_RED }}
        >
          {d.nosotros.cta}
        </Link>
      </DrawerShell>

      <DrawerShell id="contacto" title={d.contacto.title} closeLabel={c.close}>
        <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-muted)" }}>
          {d.contacto.body}
        </p>
        <Link
          href={contactHref}
          className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white sm:text-base"
          style={{ background: DEEP_RED }}
        >
          {d.contacto.cta}
        </Link>
      </DrawerShell>

      <DrawerShell id="mediakit" title={d.mediakit.title} closeLabel={c.close}>
        <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-muted)" }}>
          {d.mediakit.body}
        </p>
        <Link
          href={contactHref}
          className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white sm:text-base"
          style={{ background: DEEP_RED }}
        >
          {d.mediakit.cta}
        </Link>
      </DrawerShell>
    </>
  );
}

function MagazineCover({ lang }: { lang: Lang }) {
  const m = COPY[lang].magazine;
  return (
    <div
      className="relative mx-auto w-full max-w-[min(100%,32rem)] lg:max-w-none"
      aria-label="Leonix Media — Vista previa de la revista"
      role="img"
    >
      <div
        className="absolute -inset-6 -z-10 rounded-3xl opacity-70 blur-2xl sm:-inset-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(80,90,110,0.35) 0%, rgba(163,15,24,0.15) 50%, rgba(85,107,62,0.2) 100%)",
        }}
        aria-hidden
      />
      <div
        className="relative overflow-hidden rounded-sm shadow-[0_40px_100px_-30px_rgba(42,36,22,0.55)]"
        style={{
          border: "4px solid var(--lx-lion)",
          background: CREAM,
          transform: "perspective(1400px) rotateY(-8deg) rotateX(3deg)",
        }}
      >
        <div
          className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5"
          style={{ background: DARK_RED, borderBottom: "3px solid var(--lx-lion)" }}
        >
          <Image src={LOGO_SRC} alt="Leonix Media" width={150} height={52} className="h-11 w-auto object-contain sm:h-12" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/85 sm:text-xs">VOL. 1 · 2026</span>
        </div>

        <div className="px-4 pt-3 sm:px-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] sm:text-[11px]" style={{ color: DEEP_RED }}>
            {m.guide}
          </p>
        </div>

        <div className="relative mx-4 mt-2 aspect-[4/3] overflow-hidden sm:mx-5">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #d4cfc4 0%, #9a958c 35%, #6b6560 70%, #4a4540 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.04) 40px, rgba(255,255,255,0.04) 41px)",
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
            <p className="text-sm font-bold text-white sm:text-base">{m.connect}</p>
          </div>
          <div
            className="absolute right-3 top-3 max-w-[42%] rounded border-2 px-2 py-2 text-center sm:right-4 sm:px-3"
            style={{ borderColor: "var(--lx-lion)", background: DEEP_RED }}
          >
            <p className="text-[9px] font-black uppercase leading-tight text-white sm:text-[10px]">{m.advertise}</p>
          </div>
        </div>

        <div className="px-4 py-3 sm:px-5" style={{ background: "var(--lx-page)" }}>
          <p className="text-base font-black sm:text-lg" style={{ color: "var(--lx-text)" }}>
            Que Ruja El León
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--lx-olive)" }}>
            Let The Lion Roar
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px" style={{ background: "var(--lx-border)" }}>
          <div className="flex min-h-[5.75rem] flex-col justify-between p-3 sm:min-h-[6.5rem]" style={{ background: DARK_RED }}>
            <div>
              <p className="text-sm font-black text-white sm:text-base">War Fitness</p>
              <p className="mt-0.5 text-[10px] text-white/75 sm:text-xs">Gym &amp; Entrenamiento</p>
            </div>
            <p className="text-[10px] font-bold uppercase sm:text-[11px]" style={{ color: "var(--lx-lion)" }}>
              {m.partner}
            </p>
          </div>
          <div className="flex min-h-[5.75rem] flex-col justify-between p-3 sm:min-h-[6.5rem]" style={{ background: "var(--lx-blue)" }}>
            <div>
              <p className="text-sm font-bold text-white sm:text-base">Sample Law Office</p>
              <p className="mt-0.5 text-[10px] text-white/80 sm:text-xs">Inmigración · Familia</p>
            </div>
            <p className="text-[10px] italic text-white/55 sm:text-[11px]">{m.sample}</p>
          </div>
          <div className="flex min-h-[5.75rem] flex-col justify-between p-3 sm:min-h-[6.5rem]" style={{ background: DEEP_RED }}>
            <div>
              <p className="text-sm font-bold text-white sm:text-base">Sample Restaurant</p>
              <p className="mt-0.5 text-[10px] text-white/80 sm:text-xs">Cocina auténtica</p>
            </div>
            <p className="text-[10px] italic text-white/55 sm:text-[11px]">{m.sample}</p>
          </div>
          <div className="flex min-h-[5.75rem] flex-col justify-between p-3 sm:min-h-[6.5rem]" style={{ background: "var(--lx-text)" }}>
            <div>
              <p className="text-sm font-bold text-white sm:text-base">Sample Plumbing</p>
              <p className="mt-0.5 text-[10px] text-white/80 sm:text-xs">24/7 · Residencial</p>
            </div>
            <p className="text-[10px] italic text-white/55 sm:text-[11px]">{m.sample}</p>
          </div>
          <div
            className="col-span-2 flex min-h-[4.25rem] items-center justify-between gap-3 p-3 sm:min-h-[4.75rem]"
            style={{ background: "var(--lx-section)", borderTop: "2px solid var(--lx-lion)" }}
          >
            <div>
              <p className="text-sm font-bold sm:text-base" style={{ color: "var(--lx-text)" }}>
                Sample Auto Dealer
              </p>
              <p className="text-[10px] sm:text-xs" style={{ color: "var(--lx-muted)" }}>
                Autos · Financiamiento
              </p>
            </div>
            <span className="text-[10px] italic sm:text-[11px]" style={{ color: "var(--lx-muted)" }}>
              {m.sample}
            </span>
          </div>
        </div>

        <div className="px-4 py-2.5 text-center sm:py-3" style={{ background: DARK_RED, borderTop: "3px solid var(--lx-lion)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/90 sm:text-xs">
            Leonix Media · Gratis · Mensual
          </p>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ c, otherLang }: { c: (typeof COPY)[Lang]; otherLang: Lang }) {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: "color-mix(in srgb, var(--lx-page) 94%, transparent)",
        borderColor: "var(--lx-border)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-6 lg:py-3.5">
        <Link href="#inicio" className="shrink-0">
          <Image
            src={LOGO_SRC}
            alt="Leonix Media"
            width={200}
            height={72}
            className="h-12 w-auto object-contain sm:h-[3.25rem]"
            priority
          />
        </Link>

        <nav
          className="order-3 flex w-full flex-wrap items-center justify-center gap-x-0.5 gap-y-1 lg:order-2 lg:flex-1 lg:justify-center"
          aria-label="Navegación principal"
        >
          {c.navLabels.map((label, i) => {
            const drawerId = NAV_DRAWERS[i];
            const isActive = i === 0;
            const linkClass = `rounded-lg px-2.5 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${
              isActive ? "border-b-2" : "hover:opacity-80"
            }`;
            const linkStyle = {
              color: "var(--lx-text)",
              borderColor: isActive ? DEEP_RED : "transparent",
            };
            if (drawerId) {
              return (
                <DrawerTrigger key={label} id={drawerId} className={linkClass} style={linkStyle}>
                  {label}
                </DrawerTrigger>
              );
            }
            return (
              <a key={label} href="#inicio" className={linkClass} style={linkStyle}>
                {label}
              </a>
            );
          })}
        </nav>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:gap-3 lg:order-3">
          <Link
            href={`?lang=${otherLang}`}
            className="rounded-full border px-3 py-2 text-xs font-semibold sm:text-sm"
            style={{ borderColor: "var(--lx-border)", color: "var(--lx-text)", background: "var(--lx-card)" }}
          >
            {c.langSwitch}
          </Link>
          <DrawerTrigger
            id="launch"
            className="hidden min-h-[42px] items-center rounded-lg px-4 text-xs font-bold text-white sm:inline-flex sm:text-sm"
            style={{ background: DEEP_RED }}
          >
            {c.headerCta}
          </DrawerTrigger>
        </div>
      </div>
    </header>
  );
}

const TRUST_ICONS = ["📍", "♥", "📈"];

const CAT_ICON_STYLES = [
  { bg: DEEP_RED, icon: "📋" },
  { bg: "var(--lx-olive)", icon: "🏪" },
  { bg: "var(--lx-lion)", icon: "🤝" },
];

const BENEFIT_ICONS = ["📖", "📱", "🔗", "🏠"];

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const c = COPY[lang];
  return { title: c.meta.title, description: c.meta.description };
}

export default async function ComingSoonPage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const c = COPY[lang];
  const otherLang: Lang = lang === "es" ? "en" : "es";
  const year = new Date().getFullYear();

  return (
    <main className="w-full overflow-x-hidden" style={{ background: "var(--lx-page)", color: "var(--lx-text)" }}>
      <DrawerPanels lang={lang} c={c} />
      <PageHeader c={c} otherLang={otherLang} />

      {/* Hero */}
      <section
        id="inicio"
        className="relative w-full overflow-hidden"
        style={{
          background: `linear-gradient(180deg, var(--lx-section) 0%, ${CREAM} 45%, var(--lx-page) 100%)`,
          borderBottom: "1px solid var(--lx-border)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,253,247,0.7), rgba(255,253,247,0.85)), radial-gradient(ellipse 80% 50% at 70% 40%, rgba(120,130,150,0.25), transparent)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-[90rem] grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[52%_48%] lg:gap-8 lg:py-16 xl:py-20">
          <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
            <span
              className="inline-flex w-fit items-center rounded-full border-2 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] sm:text-xs"
              style={{ borderColor: "var(--lx-lion)", color: "var(--lx-lion)", background: "var(--lx-card)" }}
            >
              {c.badge}
            </span>

            <Image
              src={LOGO_SRC}
              alt="Leonix Media"
              width={420}
              height={140}
              className="h-auto w-full max-w-[min(100%,22rem)] object-contain object-left sm:max-w-md lg:max-w-lg"
              priority
            />

            <div className="space-y-1">
              <p className="text-2xl font-bold leading-snug sm:text-3xl lg:text-[2rem] lg:leading-tight" style={{ color: "var(--lx-text)" }}>
                {c.tagline1}{" "}
                <span style={{ color: DEEP_RED }}>{c.tagline1Em}</span>.
              </p>
              <p className="text-2xl font-bold leading-snug sm:text-3xl lg:text-[2rem] lg:leading-tight" style={{ color: "var(--lx-text)" }}>
                {c.tagline2}{" "}
                <span style={{ color: DEEP_RED }}>{c.tagline2Em}</span>.
              </p>
            </div>

            <p className="max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--lx-muted)" }}>
              {c.heroBody}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <DrawerTrigger
                id="anunciate"
                className="inline-flex min-h-[50px] items-center justify-center rounded-lg px-6 text-sm font-bold text-white sm:text-base"
                style={{ background: DEEP_RED }}
              >
                {c.cta1}
                <ArrowIcon />
              </DrawerTrigger>
              <DrawerTrigger
                id="launch"
                className="inline-flex min-h-[50px] items-center justify-center rounded-lg border-2 bg-white px-6 text-sm font-bold sm:text-base"
                style={{ borderColor: "var(--lx-lion)", color: "var(--lx-lion)" }}
              >
                {c.cta2}
                <ArrowIcon />
              </DrawerTrigger>
              <DrawerTrigger
                id="mediakit"
                className="inline-flex min-h-[50px] items-center justify-center rounded-lg border px-6 text-sm font-semibold sm:text-base"
                style={{ borderColor: "var(--lx-border)", color: "var(--lx-text)", background: "var(--lx-card)" }}
              >
                {c.mediaKit}
              </DrawerTrigger>
            </div>

            <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
              {c.trust.map((t, i) => (
                <li key={t} className="flex items-center gap-2 text-sm font-medium sm:text-base" style={{ color: "var(--lx-text)" }}>
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                    style={{ background: "var(--lx-section)", border: "1px solid var(--lx-lion)" }}
                    aria-hidden
                  >
                    {TRUST_ICONS[i]}
                  </span>
                  {t}
                </li>
              ))}
            </ul>

            <p className="text-sm italic sm:text-base" style={{ color: "var(--lx-muted)" }}>
              {c.slogan}
            </p>

            <DrawerTrigger
              id="launch"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg px-6 text-sm font-bold text-white sm:hidden"
              style={{ background: DEEP_RED }}
            >
              {c.headerCta}
            </DrawerTrigger>
          </div>

          <div className="flex justify-center lg:justify-end lg:pl-4">
            <MagazineCover lang={lang} />
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section
        id="ediciones"
        className="w-full border-y px-4 py-10 sm:px-6 sm:py-12"
        style={{ background: "var(--lx-card)", borderColor: "var(--lx-border)" }}
      >
        <div className="mx-auto grid max-w-[90rem] grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0" style={{ borderColor: "var(--lx-border)" }}>
          {c.cats.items.map((cat, i) => (
            <article key={cat.name} className="flex flex-col items-center px-4 py-8 text-center sm:px-6 sm:py-6">
              <span
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-md"
                style={{ background: CAT_ICON_STYLES[i].bg }}
                aria-hidden
              >
                {CAT_ICON_STYLES[i].icon}
              </span>
              <h2 className="text-lg font-black sm:text-xl" style={{ color: "var(--lx-text)" }}>
                {cat.name}
              </h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-muted)" }}>
                {cat.sub}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Benefits strip */}
      <section
        id="beneficios"
        className="w-full px-4 py-12 sm:px-6 sm:py-14"
        style={{ background: "var(--lx-page)" }}
      >
        <div className="mx-auto max-w-[90rem]">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {c.benefits.items.map((b, i) => (
              <article key={b.title} className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <span
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl"
                  style={{ borderColor: "var(--lx-lion)", background: "var(--lx-card)" }}
                  aria-hidden
                >
                  {BENEFIT_ICONS[i]}
                </span>
                <h3 className="text-base font-bold sm:text-lg">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-muted)" }}>
                  {b.body}
                </p>
              </article>
            ))}
          </div>
          <div
            className="mt-10 rounded-2xl border-2 p-6 sm:p-8"
            style={{ borderColor: "var(--lx-lion)", background: "var(--lx-card)" }}
          >
            <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-text)" }}>
              {c.multilingualReach}
            </p>
          </div>
        </div>
      </section>

      {/* Signup strip */}
      <section id="signup" className="w-full px-4 py-10 sm:px-6 sm:py-12" style={{ background: DEEP_RED }}>
        <div className="mx-auto flex max-w-[90rem] flex-col items-center gap-6 lg:flex-row lg:justify-between lg:gap-10">
          <div className="flex items-start gap-4 text-white lg:max-w-[50%]">
            <span
              className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
              style={{ background: "rgba(255,255,255,0.15)" }}
              aria-hidden
            >
              ✉
            </span>
            <div>
              <h2 className="text-xl font-black sm:text-2xl lg:text-3xl">{c.signup.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/88 sm:text-base">{c.signup.sub}</p>
            </div>
          </div>
          <form
            action="/contacto"
            method="get"
            className="flex w-full max-w-xl flex-col gap-3 sm:flex-row lg:w-auto lg:min-w-[28rem] lg:flex-1 lg:justify-end"
          >
            <input type="hidden" name="lang" value={lang} />
            <input
              type="email"
              name="prefillMessage"
              placeholder={c.signup.placeholder}
              className="min-h-[50px] flex-1 rounded-lg border-0 px-4 text-base text-[#1F241C] outline-none"
              style={{ background: "#FFFDF7" }}
              autoComplete="email"
            />
            <DrawerTrigger
              id="launch"
              className="inline-flex min-h-[50px] items-center justify-center rounded-lg px-8 text-base font-bold"
              style={{ background: "var(--lx-lion)", color: DARK_RED }}
            >
              {c.signup.cta}
              <ArrowIcon />
            </DrawerTrigger>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="w-full px-4 py-8 sm:px-6 sm:py-10"
        style={{ background: "var(--lx-text)", color: "var(--lx-page)" }}
      >
        <div className="mx-auto flex max-w-[90rem] flex-col items-center gap-6 text-center sm:gap-4 lg:flex-row lg:justify-between lg:text-left">
          <p className="text-sm font-medium sm:text-base">{c.footer.left}</p>
          <p className="text-sm italic opacity-90 sm:text-base">{c.slogan}</p>
          <p className="text-xs opacity-70 sm:text-sm">
            © {year} Leonix Media / Leonix Global LLC · {c.footer.rights}
          </p>
        </div>
      </footer>
    </main>
  );
}
