import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

type Lang = "es" | "en";

function normalizeLang(v: string | undefined): Lang {
  return v === "en" ? "en" : "es";
}

const COPY = {
  es: {
    meta: {
      title: "Próximamente — Leonix Media",
      description:
        "Publicidad impresa en español. Exposición digital bilingüe. San José · Silicon Valley · Bay Area.",
    },
    langSwitch: "View in English",
    badge: "PRÓXIMAMENTE",
    heroTitle: "Leonix Media",
    heroTagline: "Publicidad impresa en español.\nExposición digital bilingüe.",
    heroBody:
      "Conectando negocios locales con la comunidad latina a través de una revista premium, visibilidad digital y herramientas que generan acción.",
    cta1: "Anúnciate con nosotros",
    cta2: "Únete al lanzamiento",
    trust: ["Hecho para nuestra comunidad", "Confianza local", "Resultados reales"],
    slogan: "Que Ruja El León — Let The Lion Roar",
    navLabels: ["Inicio", "Anúnciate", "Ediciones", "Beneficios", "Sobre Nosotros", "Contacto"],
    cats: {
      title: "Lo que encontrarás en Leonix Media",
      items: [
        { icon: "📋", name: "Clasificados", sub: "Rentas, empleos y barrios" },
        {
          icon: "🏪",
          name: "Nuestros Negocios",
          sub: "Restaurantes, servicios, bienes raíces, autos y viajes",
        },
        { icon: "🤝", name: "Comunidad", sub: "Clases, recursos y conexiones locales" },
      ],
    },
    benefits: {
      title: "Lo que Leonix ofrece",
      items: [
        { icon: "📖", title: "Revista mensual premium", body: "Contenido local que informa, inspira y conecta." },
        { icon: "📱", title: "Edición digital semanal", body: "Accede desde cualquier dispositivo, donde estés." },
        { icon: "🔗", title: "QR + CTAs", body: "Conecta tu anuncio con llamadas, mensajes, mapas y más." },
        {
          icon: "🏠",
          title: "Un solo enlace para tu negocio",
          body: "Toda tu información, ofertas y redes en un solo lugar.",
        },
      ],
    },
    more: {
      title: "Más que un anuncio. Una presencia completa.",
      items: [
        "Revista impresa premium",
        "Exposición digital bilingüe",
        "QR codes que llevan a llamadas, mensajes, mapas y enlaces",
        "Página de negocio con contacto, redes, ofertas y reseñas",
        "Clasificados, cupones y descubrimiento local",
      ],
    },
    signup: {
      title: "Sé parte del lanzamiento",
      sub: "Recibe noticias, oportunidades y el lanzamiento oficial de Leonix Media.",
      placeholder: "Tu correo electrónico",
      cta: "Notifícame",
    },
    contact: {
      title: "¿Quieres anunciar tu negocio?",
      body: "Estamos conectando con negocios fundadores, restaurantes, servicios, tiendas, profesionales, patrocinadores y aliados comunitarios.",
      cta: "Contactar a Leonix",
    },
    footer: { tagline: "San José · Silicon Valley · Bay Area · Comunidad Latina" },
  },
  en: {
    meta: {
      title: "Coming Soon — Leonix Media",
      description:
        "Spanish print advertising. Bilingual digital exposure. San José · Silicon Valley · Bay Area.",
    },
    langSwitch: "Ver en Español",
    badge: "COMING SOON",
    heroTitle: "Leonix Media",
    heroTagline: "Print advertising in Spanish.\nBilingual digital exposure.",
    heroBody:
      "Connecting local businesses with the Latino community through a premium magazine, digital visibility and tools that drive action.",
    cta1: "Advertise with us",
    cta2: "Join the launch",
    trust: ["Made for our community", "Local trust", "Real results"],
    slogan: "Que Ruja El León — Let The Lion Roar",
    navLabels: ["Home", "Advertise", "Editions", "Benefits", "About Us", "Contact"],
    cats: {
      title: "What you will find in Leonix Media",
      items: [
        { icon: "📋", name: "Classifieds", sub: "Rentals, jobs and neighborhoods" },
        {
          icon: "🏪",
          name: "Our Businesses",
          sub: "Restaurants, services, real estate, autos and travel",
        },
        { icon: "🤝", name: "Community", sub: "Classes, resources and local connections" },
      ],
    },
    benefits: {
      title: "What Leonix offers",
      items: [
        { icon: "📖", title: "Monthly premium magazine", body: "Local content that informs, inspires and connects." },
        { icon: "📱", title: "Weekly digital edition", body: "Access from any device, wherever you are." },
        { icon: "🔗", title: "QR + CTAs", body: "Link your ad to calls, messages, maps and more." },
        {
          icon: "🏠",
          title: "One link for your business",
          body: "All your info, deals and networks in one place.",
        },
      ],
    },
    more: {
      title: "More than an ad. A complete presence.",
      items: [
        "Premium print magazine",
        "Bilingual digital exposure",
        "QR codes that drive calls, messages, maps and links",
        "Business page with contact, social, deals and reviews",
        "Classifieds, coupons and local discovery",
      ],
    },
    signup: {
      title: "Be part of the launch",
      sub: "Get news, opportunities and the official Leonix Media launch.",
      placeholder: "Your email address",
      cta: "Notify Me",
    },
    contact: {
      title: "Want to advertise your business?",
      body: "We are connecting with founding businesses, restaurants, services, stores, professionals, sponsors and community allies.",
      cta: "Contact Leonix",
    },
    footer: { tagline: "San José · Silicon Valley · Bay Area · Latino Community" },
  },
} as const;

const NAV_ANCHORS = ["inicio", "anunciate", "ediciones", "beneficios", "nosotros", "contacto"];

function MagazineCover() {
  return (
    <div
      className="w-full max-w-[280px] mx-auto overflow-hidden rounded-lg shadow-2xl flex-shrink-0"
      style={{ border: "3px solid #7D1716" }}
      aria-label="Leonix Media — Vista previa de la revista"
      role="img"
    >
      <div className="flex items-center justify-between px-3 py-2" style={{ background: "#7D1716" }}>
        <Image src="/logo.png" alt="Leonix Media" width={88} height={32} className="object-contain h-7 w-auto" />
        <span className="text-white text-[10px] font-bold tracking-widest">VOL. 1 · 2026</span>
      </div>
      <div className="px-3 py-2.5" style={{ background: "#FFFDF7" }}>
        <p className="text-[9px] uppercase tracking-widest font-black" style={{ color: "#7D1716" }}>
          LEONIX MEDIA
        </p>
        <p className="text-lg font-black leading-tight" style={{ color: "#1F241C" }}>
          Que Ruja El León
        </p>
        <p className="text-[11px] font-semibold" style={{ color: "#556B3E" }}>
          Let The Lion Roar
        </p>
        <p className="text-[9px] mt-1" style={{ color: "#5F6258" }}>
          Silicon Valley · Bay Area · San José
        </p>
      </div>
      <div className="px-3 py-1.5" style={{ background: "#556B3E" }}>
        <p className="text-white text-[10px] font-black tracking-wider">CLASIFICADOS</p>
        <p className="text-white/80 text-[9px]">Rentas · Empleos · Barrios</p>
      </div>
      <div className="px-3 py-2" style={{ background: "#F8F4EA" }}>
        <p className="text-[10px] font-semibold leading-snug" style={{ color: "#1F241C" }}>
          Publicidad impresa en español.
        </p>
        <p className="text-[9px] mt-0.5" style={{ color: "#5F6258" }}>
          Conectando negocios con la comunidad latina.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px" style={{ background: "#D6C7AD" }}>
        <div className="p-2" style={{ background: "#1F241C" }}>
          <p className="text-[11px] font-black text-white leading-tight">WAR FITNESS</p>
          <p className="text-[9px] text-white/70">Gym &amp; Entrenamiento</p>
          <p className="text-[9px] font-semibold" style={{ color: "#C9782F" }}>★ Partner Oficial</p>
        </div>
        <div className="p-2" style={{ background: "#2F5F9E" }}>
          <p className="text-[11px] font-bold text-white leading-tight">Sample Law Office</p>
          <p className="text-[9px] text-white/80">Inmigración · Familia</p>
          <p className="text-[8px] italic text-white/50">Ejemplo de anuncio</p>
        </div>
        <div className="p-2" style={{ background: "#7D1716" }}>
          <p className="text-[11px] font-bold text-white leading-tight">Sample Restaurant</p>
          <p className="text-[9px] text-white/80">Cocina auténtica</p>
          <p className="text-[8px] italic text-white/50">Ejemplo de anuncio</p>
        </div>
        <div className="p-2" style={{ background: "#3D3428" }}>
          <p className="text-[11px] font-bold text-white leading-tight">Sample Auto Dealer</p>
          <p className="text-[9px] text-white/80">Autos · Financiamiento</p>
          <p className="text-[8px] italic text-white/50">Ejemplo de anuncio</p>
        </div>
      </div>
      <div className="px-3 py-1.5 text-center" style={{ background: "#556B3E" }}>
        <p className="text-white text-[9px] font-semibold tracking-wider">LEONIX MEDIA · GRATIS · MENSUAL</p>
      </div>
    </div>
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
  const year = new Date().getFullYear();

  return (
    <main className="w-full overflow-x-hidden" style={{ background: "var(--lx-page)", color: "var(--lx-text)" }}>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section
        id="inicio"
        className="relative w-full"
        style={{
          background: "linear-gradient(155deg, var(--lx-section) 0%, var(--lx-page) 60%)",
          borderBottom: "1px solid var(--lx-border)",
        }}
      >
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <Link
            href={`?lang=${otherLang}`}
            className="text-xs font-semibold rounded-full px-3 py-1.5 border transition"
            style={{ borderColor: "var(--lx-border)", color: "var(--lx-text-2)", background: "var(--lx-card)" }}
          >
            {c.langSwitch}
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-28 pb-16 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 items-center">
          <div className="flex flex-col gap-5 min-w-0">
            <Image
              src="/logo.png"
              alt="Leonix Media"
              width={160}
              height={60}
              className="object-contain h-12 w-auto"
              priority
            />
            <span
              className="inline-block self-start rounded-full px-4 py-1 text-xs font-black tracking-widest uppercase"
              style={{ background: "var(--lx-cta-primary-bg)", color: "var(--lx-cta-primary-fg)" }}
            >
              {c.badge}
            </span>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight" style={{ color: "var(--lx-text)" }}>
              {c.heroTitle}
            </h1>
            <p
              className="text-xl sm:text-2xl font-bold leading-snug whitespace-pre-line"
              style={{ color: "var(--lx-lion)" }}
            >
              {c.heroTagline}
            </p>
            <p className="text-sm sm:text-base leading-relaxed max-w-lg" style={{ color: "var(--lx-text-2)" }}>
              {c.heroBody}
            </p>
            <div className="flex flex-wrap gap-2">
              {c.trust.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border"
                  style={{ borderColor: "var(--lx-border)", background: "var(--lx-card)", color: "var(--lx-text-2)" }}
                >
                  <span style={{ color: "var(--lx-olive)" }}>✓</span>
                  {t}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/contacto?lang=${lang}`}
                className="rounded-xl px-6 py-3 text-sm font-bold transition"
                style={{ background: "var(--lx-cta-primary-bg)", color: "var(--lx-cta-primary-fg)" }}
              >
                {c.cta1}
              </Link>
              <Link
                href={`/contacto?lang=${lang}`}
                className="rounded-xl px-6 py-3 text-sm font-bold border transition"
                style={{ borderColor: "var(--lx-border)", background: "var(--lx-card)", color: "var(--lx-text)" }}
              >
                {c.cta2}
              </Link>
            </div>
            <p className="text-xs italic" style={{ color: "var(--lx-muted)" }}>
              {c.slogan}
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <MagazineCover />
          </div>
        </div>
      </section>

      {/* ── ANCHOR NAV ─────────────────────────────────────────────────── */}
      <nav
        className="w-full overflow-x-auto"
        aria-label="Secciones"
        style={{ background: "var(--lx-canvas)", borderBottom: "1px solid var(--lx-border)", scrollbarWidth: "none" }}
      >
        <div className="mx-auto max-w-6xl px-4 flex">
          {c.navLabels.map((label, i) => (
            <a
              key={label}
              href={`#${NAV_ANCHORS[i]}`}
              className="px-3 py-3 text-xs font-semibold whitespace-nowrap transition hover:underline"
              style={{ color: "var(--lx-text-2)" }}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── CATEGORY CARDS ─────────────────────────────────────────────── */}
      <section id="ediciones" className="py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 text-center" style={{ color: "var(--lx-text)" }}>
            {c.cats.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {c.cats.items.map((cat) => (
              <div
                key={cat.name}
                className="flex flex-col gap-3 rounded-2xl p-6 border"
                style={{ background: "var(--lx-card)", borderColor: "var(--lx-border)", boxShadow: "0 2px 8px rgba(42,36,22,0.07)" }}
              >
                <span className="text-3xl" aria-hidden="true">{cat.icon}</span>
                <h3 className="text-base font-bold" style={{ color: "var(--lx-text)" }}>{cat.name}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--lx-text-2)", opacity: 0.85 }}>{cat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS STRIP ─────────────────────────────────────────────── */}
      <section
        id="beneficios"
        className="py-14 px-4 sm:px-6"
        style={{ background: "var(--lx-canvas)", borderTop: "1px solid var(--lx-border)", borderBottom: "1px solid var(--lx-border)" }}
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold mb-8 text-center" style={{ color: "var(--lx-text)" }}>
            {c.benefits.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {c.benefits.items.map((b) => (
              <div
                key={b.title}
                className="flex flex-col gap-2 rounded-xl p-5 border"
                style={{ background: "var(--lx-card)", borderColor: "var(--lx-border)" }}
              >
                <span className="text-2xl" aria-hidden="true">{b.icon}</span>
                <p className="text-sm font-bold" style={{ color: "var(--lx-text)" }}>{b.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--lx-muted)" }}>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MÁS QUE UN ANUNCIO ─────────────────────────────────────────── */}
      <section id="nosotros" className="py-16 px-4 sm:px-6" style={{ background: "var(--lx-section)" }}>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center" style={{ color: "var(--lx-text)" }}>
            {c.more.title}
          </h2>
          <ul className="flex flex-col gap-4">
            {c.more.items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0" style={{ color: "var(--lx-olive)" }} aria-hidden="true">✦</span>
                <span className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--lx-text-2)" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── EMAIL SIGNUP ───────────────────────────────────────────────── */}
      <section id="anunciate" className="py-16 px-4 sm:px-6" style={{ background: "var(--lx-text)" }}>
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "#FFFDF7" }}>
            {c.signup.title}
          </h2>
          <p className="text-sm mb-8" style={{ color: "rgba(255,253,247,0.7)" }}>
            {c.signup.sub}
          </p>
          <form action="/contacto" method="get" className="flex flex-col sm:flex-row gap-3">
            <input type="hidden" name="lang" value={lang} />
            <input
              type="email"
              name="prefillMessage"
              placeholder={c.signup.placeholder}
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                background: "rgba(255,253,247,0.10)",
                color: "#FFFDF7",
                border: "1px solid rgba(255,253,247,0.22)",
              }}
              autoComplete="email"
            />
            <button
              type="submit"
              className="rounded-xl px-6 py-3 text-sm font-bold transition flex-shrink-0"
              style={{ background: "var(--lx-cta-primary-bg)", color: "var(--lx-cta-primary-fg)" }}
            >
              {c.signup.cta}
            </button>
          </form>
        </div>
      </section>

      {/* ── CONTACT SECTION ────────────────────────────────────────────── */}
      <section id="contacto" className="py-16 px-4 sm:px-6" style={{ background: "var(--lx-olive)" }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: "#FFFDF7" }}>
            {c.contact.title}
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,253,247,0.85)" }}>
            {c.contact.body}
          </p>
          <Link
            href={`/contacto?lang=${lang}`}
            className="inline-block rounded-xl px-8 py-4 text-sm font-bold transition"
            style={{ background: "#FFFDF7", color: "var(--lx-olive)" }}
          >
            {c.contact.cta}
          </Link>
        </div>
      </section>

      {/* ── PAGE FOOTER STRIP ──────────────────────────────────────────── */}
      <section
        className="py-8 px-4 sm:px-6 text-center"
        style={{ background: "#1F241C", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="text-sm font-semibold mb-2" style={{ color: "rgba(255,253,247,0.88)" }}>
          {c.footer.tagline}
        </p>
        <p className="text-xs italic mb-3" style={{ color: "rgba(255,253,247,0.50)" }}>
          {c.slogan}
        </p>
        <p className="text-[10px]" style={{ color: "rgba(255,253,247,0.28)" }}>
          © {year} Leonix Media · Leonix Global LLC · Todos los derechos reservados
        </p>
      </section>

    </main>
  );
}
