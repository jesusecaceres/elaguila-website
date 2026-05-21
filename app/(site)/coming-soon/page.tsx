import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type Lang = "es" | "en";
type DrawerId = "anunciate" | "launch" | "ediciones" | "beneficios" | "nosotros" | "contacto" | "mediakit";

const DEEP_RED = "#A30F18";

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
    close: "Cerrar",
    mobileCtas: [
      { label: "Anúnciate", id: "anunciate" as DrawerId },
      { label: "Únete", id: "launch" as DrawerId },
      { label: "Media Kit", id: "mediakit" as DrawerId },
      { label: "Contacto", id: "contacto" as DrawerId },
    ],
    drawers: {
      anunciate: {
        title: "Anúnciate con Leonix",
        who: "Negocios locales, profesionales, restaurantes, servicios, tiendas, anunciantes y socios comunitarios.",
        what: "Revista impresa en español + exposición digital multilingüe.",
        where: "San José, Silicon Valley, Bay Area y Northern California.",
        when: "Lanzamiento próximamente; oportunidades para negocios fundadores abiertas ahora.",
        why: "Para que los negocios locales se vean profesionales, sean fáciles de contactar y lleguen a más clientes dentro y fuera de su comunidad inmediata.",
        bullets: [
          "Revista impresa premium",
          "Exposición digital multilingüe",
          "QR codes que conectan el impreso con contenido digital",
          "Lectores pueden acceder al contenido digital en su idioma seleccionado donde esté disponible",
          "Compatible con herramientas de traducción como Google Lens o Apple Translate",
          "Página de negocio con redes, contacto, ofertas y reseñas",
          "CTAs para llamadas, mensajes, mapas y enlaces",
          "Cupones, clasificados y descubrimiento local",
          "Mayor alcance: enfocado en la comunidad latina, pero inclusivo para clientes de diferentes idiomas",
        ],
        cta: "Contactar a Leonix",
      },
      launch: {
        title: "Únete al lanzamiento",
        body: "Estamos preparando el lanzamiento oficial de Leonix Media en San José, Silicon Valley y el Bay Area. Regístrate para recibir noticias, oportunidades de lanzamiento, ediciones, promociones, media kit y actualizaciones.",
        bullets: [
          "Negocios fundadores: oportunidades exclusivas antes del lanzamiento oficial",
          "Accede a paquetes y beneficios para ser de los primeros socios",
          "Oportunidades para anunciarse con paquetes de apertura",
          "Actualización del media kit cuando esté disponible",
          "Alcance impreso y digital multilingüe desde el primer número",
        ],
        cta: "Notifícame",
      },
      ediciones: {
        title: "Ediciones Leonix",
        body: "Leonix combina una revista impresa mensual premium con una experiencia digital semanal para que los negocios tengan presencia constante, no solo un anuncio aislado.",
        bullets: [
          "Revista impresa en español — mensual, premium",
          "Edición digital multilingüe — semanal, accesible desde cualquier dispositivo",
          "QR codes en la revista que conectan al lector con contenido digital",
          "Contenido local y empresarial",
          "Anuncios con CTAs: llamadas, mensajes, mapas y enlaces",
          "Acceso digital para ampliar el alcance de cada edición",
        ],
        cta: "Contactar a Leonix",
      },
      beneficios: {
        title: "Beneficios para negocios",
        body: "Leonix está diseñado para que tu negocio sea más fácil de encontrar, contactar, recordar y compartir.",
        bullets: [
          "Más confianza local",
          "Un solo enlace para tu negocio",
          "Visibilidad impresa y digital",
          "Llamadas, mensajes, mapas y enlaces",
          "Presencia profesional para compartir",
          "QR codes conectando la revista impresa con páginas digitales",
          "Alcance multilingüe mediante experiencia digital y herramientas de traducción",
          "Enfoque en comunidad latina con alcance inclusivo para más clientes",
        ],
        note: "Las traducciones automáticas pueden variar; recomendamos revisar contenido importante. Compatible con Google Lens, Apple Translate y herramientas similares.",
        cta: "Contactar a Leonix",
      },
      nosotros: {
        title: "Sobre Leonix Media",
        intro: "La revista está pensada para nuestra comunidad latina, pero el alcance digital permite conectar con clientes de diferentes idiomas.",
        who: "Leonix Media sirve a negocios locales, anunciantes, familias y comunidad.",
        what: "Una plataforma de publicidad impresa en español, exposición digital multilingüe, revista premium, clasificados, negocios, cupones, QR codes y páginas de negocio.",
        where: "San José, Silicon Valley, Bay Area y Northern California.",
        when: "Lanzamiento próximamente, con oportunidades para negocios fundadores abiertas ahora.",
        why: "Porque los negocios locales merecen ser vistos profesionalmente y la comunidad merece encontrar opciones confiables en un formato moderno, accesible y multilingüe.",
        cta: "Contactar a Leonix",
      },
      contacto: {
        title: "Contacto",
        body: "¿Quieres anunciar tu negocio, participar como socio fundador, conocer el media kit o hablar sobre productos para promoción?",
        cta: "Contactar a Leonix",
      },
      mediakit: {
        title: "Media Kit",
        body: "El media kit incluirá opciones de anuncios, paquetes de lanzamiento, presencia impresa, exposición digital multilingüe, QR codes, CTAs, productos para promoción, beneficios para negocios fundadores y oportunidades para conectar con la comunidad.",
        bullets: [
          "Tamaños y opciones de anuncios",
          "Paquetes de lanzamiento",
          "Presencia impresa + digital",
          "QR codes + CTAs",
          "Productos para promoción",
          "Negocios fundadores",
        ],
        cta: "Solicitar Media Kit",
      },
    },
  },
  en: {
    meta: {
      title: "Coming Soon — Leonix Media",
      description:
        "Spanish print advertising. Multilingual digital exposure. San José · Silicon Valley · Bay Area.",
    },
    langSwitch: "Español",
    close: "Close",
    mobileCtas: [
      { label: "Advertise", id: "anunciate" as DrawerId },
      { label: "Join", id: "launch" as DrawerId },
      { label: "Media Kit", id: "mediakit" as DrawerId },
      { label: "Contact", id: "contacto" as DrawerId },
    ],
    drawers: {
      anunciate: {
        title: "Advertise with Leonix",
        who: "Local businesses, professionals, restaurants, services, stores, advertisers and community partners.",
        what: "Spanish print magazine + multilingual digital exposure.",
        where: "San José, Silicon Valley, Bay Area and Northern California.",
        when: "Launch coming soon; founding business opportunities open now.",
        why: "So local businesses look professional, are easy to contact and reach more customers inside and beyond their immediate community.",
        bullets: [
          "Premium print magazine",
          "Multilingual digital exposure",
          "QR codes connecting print to digital content",
          "Readers can access digital content in their selected language where supported",
          "Compatible with translation tools like Google Lens or Apple Translate",
          "Business page with social, contact, deals and reviews",
          "CTAs for calls, messages, maps and links",
          "Coupons, classifieds and local discovery",
          "Broader reach: focused on the Latino community, inclusive for customers of different languages",
        ],
        cta: "Contact Leonix",
      },
      launch: {
        title: "Join the launch",
        body: "We are preparing the official Leonix Media launch in San José, Silicon Valley and the Bay Area. Sign up to get news, launch opportunities, editions, promotions, media kit and updates.",
        bullets: [
          "Founding businesses: exclusive opportunities before the official launch",
          "Access packages and benefits for early partners",
          "Opportunities to advertise with opening packages",
          "Media kit update when available",
          "Print and multilingual digital reach from day one",
        ],
        cta: "Notify Me",
      },
      ediciones: {
        title: "Leonix Editions",
        body: "Leonix combines a monthly premium print magazine with a weekly digital experience so businesses have a constant presence — not just a one-off ad.",
        bullets: [
          "Spanish print magazine — monthly, premium",
          "Multilingual digital edition — weekly, accessible from any device",
          "QR codes in the magazine connecting readers to digital content",
          "Local and business content",
          "Ads with CTAs: calls, messages, maps and links",
          "Digital access to expand the reach of each edition",
        ],
        cta: "Contact Leonix",
      },
      beneficios: {
        title: "Benefits for businesses",
        body: "Leonix is designed so your business is easier to find, contact, remember and share.",
        bullets: [
          "More local trust",
          "One link for your business",
          "Print and digital visibility",
          "Calls, messages, maps and links",
          "Professional presence to share",
          "QR codes connecting the print magazine with digital pages",
          "Multilingual reach through digital experience and translation tools",
          "Focus on the Latino community with inclusive reach for more customers",
        ],
        note: "Automatic translations may vary; we recommend reviewing important content. Compatible with Google Lens, Apple Translate and similar tools.",
        cta: "Contact Leonix",
      },
      nosotros: {
        title: "About Leonix Media",
        intro: "The magazine is tailored to our Latino community, but the digital reach allows connecting with customers of different languages.",
        who: "Leonix Media serves local businesses, advertisers, families and community.",
        what: "A platform for Spanish print advertising, multilingual digital exposure, premium magazine, classifieds, businesses, coupons, QR codes and business pages.",
        where: "San José, Silicon Valley, Bay Area and Northern California.",
        when: "Launch coming soon, with founding business opportunities open now.",
        why: "Because local businesses deserve to be seen professionally and the community deserves to find reliable options in a modern, accessible and multilingual format.",
        cta: "Contact Leonix",
      },
      contacto: {
        title: "Contact",
        body: "Want to advertise your business, join as a founding partner, get the media kit or talk about promotional products?",
        cta: "Contact Leonix",
      },
      mediakit: {
        title: "Media Kit",
        body: "The media kit will include ad options, launch packages, print presence, multilingual digital exposure, QR codes, CTAs, promotional products and founding business opportunities.",
        bullets: [
          "Ad sizes and options",
          "Launch packages",
          "Print + digital presence",
          "QR codes + CTAs",
          "Promotional products",
          "Founding businesses",
        ],
        cta: "Request Media Kit",
      },
    },
  },
} as const;

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
      <input type="checkbox" id={inputId} className="lx-cs-chk sr-only absolute" />
      <div
        className="lx-cs-overlay fixed inset-0 z-[200] flex justify-end"
        data-drawer={id}
      >
        <label
          htmlFor={inputId}
          className="absolute inset-0 bg-black/50"
          aria-label={closeLabel}
        />
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
            <h2
              id={`${inputId}-title`}
              className="text-lg font-bold sm:text-xl"
              style={{ color: "var(--lx-text)" }}
            >
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

/* Drawer CSS injected inline so no Tailwind peer-checked specificity conflict */
const DRAWER_IDS: DrawerId[] = [
  "anunciate",
  "launch",
  "ediciones",
  "beneficios",
  "nosotros",
  "contacto",
  "mediakit",
];

const DRAWER_CSS = `
  .lx-cs-overlay { display: none; }
  ${DRAWER_IDS.map(
    (id) =>
      `#cs-drawer-${id}:checked ~ .lx-cs-overlay[data-drawer="${id}"]{ display: flex; }`,
  ).join("\n  ")}
  nav[data-navbar-root] { display: none !important; }
  footer.w-full { display: none !important; }
  .lx-cs-body { padding-bottom: 80px; }
  @media (min-width: 768px) { .lx-cs-body { padding-bottom: 0; } }
`;

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
        {d.beneficios.note ? (
          <p
            className="mt-4 text-xs leading-relaxed italic sm:text-sm"
            style={{ color: "var(--lx-muted)" }}
          >
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
          {d.nosotros.intro}
        </p>
        <dl className="mt-6 flex flex-col gap-4 text-sm sm:text-base">
          {(
            [
              [lang === "es" ? "Quién" : "Who", d.nosotros.who],
              [lang === "es" ? "Qué" : "What", d.nosotros.what],
              [lang === "es" ? "Dónde" : "Where", d.nosotros.where],
              [lang === "es" ? "Cuándo" : "When", d.nosotros.when],
              [lang === "es" ? "Por qué" : "Why", d.nosotros.why],
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
        <ul className="mt-5 flex flex-col gap-2.5">
          {d.mediakit.bullets.map((b) => (
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
          {d.mediakit.cta}
        </Link>
      </DrawerShell>
    </>
  );
}

/* Transparent hotspot: no visible outline, covers the target area */
function Hotspot({
  id,
  label,
  style,
}: {
  id: DrawerId;
  label: string;
  style: CSSProperties;
}) {
  return (
    <DrawerTrigger
      id={id}
      className="absolute cursor-pointer"
      style={{ ...style, background: "transparent" }}
    >
      <span className="sr-only">{label}</span>
    </DrawerTrigger>
  );
}

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

  return (
    <main className="lx-cs-body w-full overflow-x-hidden" style={{ background: "#1F241C" }}>
      {/* Inline CSS: drawer visibility + hide site chrome */}
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: DRAWER_CSS }} />

      {/* All drawer checkboxes + panels */}
      <DrawerPanels lang={lang} c={c} />

      {/* Lang switch bar — sits above the artwork */}
      <div
        className="flex items-center justify-end gap-3 px-4 py-2"
        style={{ background: "#1F241C" }}
      >
        <Link
          href={`/coming-soon?lang=${otherLang}`}
          className="rounded-full border px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-80"
          style={{ borderColor: "rgba(201,120,47,0.6)" }}
        >
          {c.langSwitch}
        </Link>
        <DrawerTrigger
          id="launch"
          className="rounded-lg px-4 py-2 text-xs font-bold text-white transition hover:opacity-80"
          style={{ background: DEEP_RED }}
        >
          {lang === "es" ? "Únete al lanzamiento" : "Join the launch"}
        </DrawerTrigger>
      </div>

      {/* ── Full-width reference image + transparent hotspots ── */}
      <div className="relative w-full" style={{ lineHeight: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coming-soon-exact.png"
          alt={
            lang === "es"
              ? "Leonix Media — Próximamente. Publicidad impresa en español. Exposición digital multilingüe."
              : "Leonix Media — Coming Soon. Spanish print advertising. Multilingual digital exposure."
          }
          className="block w-full"
          style={{ maxWidth: "100%", height: "auto" }}
        />

        {/* ── Transparent hotspots (percentage-based) ── */}

        {/* Header "Únete al lanzamiento" button — top-right */}
        <Hotspot
          id="launch"
          label={lang === "es" ? "Únete al lanzamiento" : "Join the launch"}
          style={{ left: "83%", top: "0%", width: "14%", height: "6.5%" }}
        />

        {/* Nav "Anúnciate" */}
        <Hotspot
          id="anunciate"
          label={lang === "es" ? "Anúnciate" : "Advertise"}
          style={{ left: "34%", top: "0%", width: "8%", height: "6.5%" }}
        />

        {/* Nav "Ediciones" */}
        <Hotspot
          id="ediciones"
          label={lang === "es" ? "Ediciones" : "Editions"}
          style={{ left: "42%", top: "0%", width: "7%", height: "6.5%" }}
        />

        {/* Nav "Beneficios" */}
        <Hotspot
          id="beneficios"
          label={lang === "es" ? "Beneficios" : "Benefits"}
          style={{ left: "49%", top: "0%", width: "8%", height: "6.5%" }}
        />

        {/* Nav "Sobre Nosotros" */}
        <Hotspot
          id="nosotros"
          label={lang === "es" ? "Sobre Nosotros" : "About Us"}
          style={{ left: "57%", top: "0%", width: "10%", height: "6.5%" }}
        />

        {/* Nav "Contacto" */}
        <Hotspot
          id="contacto"
          label="Contacto"
          style={{ left: "67%", top: "0%", width: "7.5%", height: "6.5%" }}
        />

        {/* Hero "Anúnciate con nosotros" button */}
        <Hotspot
          id="anunciate"
          label={lang === "es" ? "Anúnciate con nosotros" : "Advertise with us"}
          style={{ left: "2%", top: "56%", width: "27%", height: "8%" }}
        />

        {/* Hero "Únete al lanzamiento" button */}
        <Hotspot
          id="launch"
          label={lang === "es" ? "Únete al lanzamiento" : "Join the launch"}
          style={{ left: "30%", top: "56%", width: "18%", height: "8%" }}
        />

        {/* Signup "Notifícame" button */}
        <Hotspot
          id="launch"
          label={lang === "es" ? "Notifícame" : "Notify Me"}
          style={{ left: "68%", top: "83%", width: "16%", height: "8%" }}
        />

        {/* Media Kit — exposed via mobile bar; also adding small hotspot near signup area */}
        <Hotspot
          id="mediakit"
          label={lang === "es" ? "Media Kit" : "Media Kit"}
          style={{ left: "2%", top: "64%", width: "20%", height: "5%" }}
        />
      </div>

      {/* ── Mobile-only sticky CTA bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[100] flex md:hidden"
        style={{ background: "#1F241C", borderTop: "1px solid rgba(201,120,47,0.3)" }}
      >
        {c.mobileCtas.map(({ label, id }) => (
          <DrawerTrigger
            key={id + label}
            id={id}
            className="flex flex-1 cursor-pointer items-center justify-center py-3 text-xs font-bold text-white transition hover:opacity-80"
            style={{ borderRight: "1px solid rgba(201,120,47,0.2)" }}
          >
            {label}
          </DrawerTrigger>
        ))}
      </div>
    </main>
  );
}
