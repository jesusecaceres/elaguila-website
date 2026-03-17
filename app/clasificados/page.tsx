"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import newLogo from "../../public/logo.png";

import { SAMPLE_LISTINGS } from "../data/classifieds/sampleListings";
import RecentlyViewedSection from "./components/RecentlyViewedSection";

type Lang = "es" | "en";

type CategoryKey =
  | "en-venta"
  | "bienes-raices"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad"
  | "restaurantes"
  | "travel";

type SellerType = "personal" | "business";

type Listing = {
  id: string;
  category: CategoryKey;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  blurb: { es: string; en: string };
  hasImage: boolean;
  sellerType: SellerType;
};

const CATEGORY_ORDER: CategoryKey[] = [
  "rentas",
  "en-venta",
  "bienes-raices",
  "empleos",
  "servicios",
  "restaurantes",
  "travel",
  "autos",
  "clases",
  "comunidad",
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ClasificadosPage() {
  const params = useSearchParams();
  const lang = (params?.get("lang") === "en" ? "en" : "es") as Lang;

  const t = useMemo(() => {
    const ui = {
      es: {
        pageTitle: "Clasificados",
        subtitle: "El mercado que construimos juntos, para nuestra comunidad.",

        authSignIn: "Iniciar sesión",
        authCreate: "Crear cuenta",

        ctaPost: "Publicar anuncio",
        ctaView: "Ver anuncios",
        ctaMemberships: "Membresías",
        ctaSeeOptions: "Ver opciones y precios",

        sectionBrowse: "Explorar por categoría",
        sectionFeatured: "Destacados por categoría",
        sectionFeaturedHint:
          "Una vista previa de anuncios destacados. Explora todo en la lista completa.",

        viewMore: "Ver más",

        cat: {
          rentas: { label: "Rentas", hint: "Casas, cuartos y propiedades." },
          "en-venta": { label: "En venta", hint: "Compra y vende local." },
          "bienes-raices": { label: "Bienes Raíces", hint: "Venta de propiedades e inmuebles." },
          empleos: { label: "Empleos", hint: "Oportunidades cerca de ti." },
          servicios: {
            label: "Servicios",
            hint: "Profesionales y negocios confiables.",
          },
          autos: { label: "Autos", hint: "Autos y oferta de dealers." },
          clases: { label: "Clases", hint: "Aprende y comparte en comunidad." },
          comunidad: {
            label: "Comunidad",
            hint: "Actividades y anuncios comunitarios.",
          },
          restaurantes: {
            label: "Restaurantes",
            hint: "Opciones locales, menús y reseñas.",
          },
          travel: {
            label: "Viajes",
            hint: "Ofertas, agentes y rentas de carros.",
          },
        },

        membershipsTitle: "Membresías",
        membershipsSubtitle:
          "Opciones claras para personas y negocios. Elige la que mejor se adapta a cómo publicas y vendes.",

        personalHeading: "Personal",
        negociosHeading: "Negocios",

        freeTitle: "Gratis",
        freeBullets: [
          "7 días por anuncio; menos fotos; sin video",
          "Límite bajo de republicaciones",
          "Ideal para anuncios ocasionales",
        ] as const,

        proTitle: "LEONIX Pro",
        proBullets: [
          "Por anuncio: $9.99 (en venta), $24.99 (rentas/empleos)",
          "30 días por anuncio; más fotos y video",
          "Vistas, guardados, compartidos; 1 asistencia de visibilidad",
          "Formas de contacto (llamar o texto)",
        ] as const,

        standardTitle: "Standard",
        standardPrice: "$49 al mes",
        standardBullets: [
          "Perfil profesional para tu negocio",
          "Presencia por categoría",
          "Solo imágenes (sin video); contacto por llamada",
          "1 asistencia de visibilidad por anuncio activo / 30 días",
        ] as const,

        plusTitle: "Plus",
        plusPrice: "$125 al mes",
        plusBullets: [
          "Perfil premium para vender mejor",
          "Más formas de contacto (mensaje, email, videollamada, cotización)",
          "Mayor visibilidad y prioridad",
          "2 asistencias de visibilidad por anuncio activo / 30 días",
        ] as const,

        printTitle: "¿Quieres más exposición en revista?",
        printBody:
          "Los paquetes de revista y perfil premium se manejan por separado para proteger el valor de la edición impresa.",
        printCta: "Solicita el Media Kit",

        trustLine:
          "Un espacio confiable, familiar y comunitario. Los anuncios gratis siempre permanecen visibles en la búsqueda.",

        routePost: "/clasificados/publicar",
        routeList: "/clasificados/lista",
        routeMemberships: "/clasificados/membresias",
        routeLogin: "/clasificados/login",
        routeContacto: "/contacto",
      },
      en: {
        pageTitle: "Classifieds",
        subtitle: "The marketplace we build together, for our community.",

        authSignIn: "Sign in",
        authCreate: "Create account",

        ctaPost: "Post listing",
        ctaView: "View listings",
        ctaMemberships: "Memberships",
        ctaSeeOptions: "See options & pricing",

        sectionBrowse: "Browse by category",
        sectionFeatured: "Featured by category",
        sectionFeaturedHint:
          "A preview of featured listings. Browse everything in the full results.",

        viewMore: "View more",

        cat: {
          rentas: { label: "Rentals", hint: "Homes, rooms, and properties." },
          "en-venta": { label: "For sale", hint: "Buy and sell locally." },
          "bienes-raices": { label: "Real Estate", hint: "Properties and real estate for sale." },
          empleos: { label: "Jobs", hint: "Opportunities near you." },
          servicios: { label: "Services", hint: "Trusted pros and businesses." },
          autos: { label: "Autos", hint: "Cars and dealer inventory." },
          clases: { label: "Classes", hint: "Learn and share with community." },
          comunidad: { label: "Community", hint: "Activities and community posts." },
          restaurantes: {
            label: "Restaurants",
            hint: "Local spots, menus, and reviews.",
          },
          travel: { label: "Travel", hint: "Deals, agents, and car rentals." },
        },

        membershipsTitle: "Memberships",
        membershipsSubtitle:
          "Clear options for personal sellers and businesses. Choose the one that fits how you post and sell.",

        personalHeading: "Personal",
        negociosHeading: "Business",

        freeTitle: "Gratis",
        freeBullets: [
          "7 days per listing; fewer photos; no video",
          "Low repost limit",
          "Best for occasional posts",
        ] as const,

        proTitle: "LEONIX Pro",
        proBullets: [
          "Per listing: $9.99 (for sale), $24.99 (rentals/jobs)",
          "30 days per listing; more photos and video",
          "Views, saves, shares; 1 visibility assist",
          "Contact options (call or text)",
        ] as const,

        standardTitle: "Standard",
        standardPrice: "$49/month",
        standardBullets: [
          "Professional business profile",
          "Category presence",
          "Images only (no video); contact by call",
          "1 visibility assist per active listing / 30 days",
        ] as const,

        plusTitle: "Plus",
        plusPrice: "$125/month",
        plusBullets: [
          "Premium profile built to convert",
          "More contact options (message, email, video call, quote)",
          "More visibility and priority",
          "2 visibility assists per active listing / 30 days",
        ] as const,

        printTitle: "Want more exposure in print?",
        printBody:
          "Magazine packages and premium profile opportunities are handled separately to protect the value of print.",
        printCta: "Request the Media Kit",

        trustLine:
          "A trusted, family-safe, community-first marketplace. Free listings always remain visible in search.",

        routePost: "/clasificados/publicar",
        routeList: "/clasificados/lista",
        routeMemberships: "/clasificados/membresias",
        routeLogin: "/clasificados/login",
        routeContacto: "/contacto",
      },
    } as const;

    return ui[lang];
  }, [lang]);

  const withLang = (path: string) => {
    const [base, hash] = path.split("#");
    const joiner = base.includes("?") ? "&" : "?";
    const withParam = `${base}${joiner}lang=${lang}`;
    return hash ? `${withParam}#${hash}` : withParam;
  };

  const postEntryHref = `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(`/clasificados/publicar/en-venta?lang=${lang}`)}`;

  const withCategoryRoute = (cat: CategoryKey) => {
    return withLang(`/clasificados/lista?cat=${cat}`);
  };

  const withListParams = (cat?: CategoryKey) => {
    const base = t.routeList;
    const sp = new URLSearchParams();
    sp.set("lang", lang);
    if (cat) sp.set("cat", cat);
    return `${base}?${sp.toString()}`;
  };

  const sampleListings: Listing[] = useMemo(
    () => SAMPLE_LISTINGS as unknown as Listing[],
    []
  );

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener?.("change", set);
    return () => mq.removeEventListener?.("change", set);
  }, []);

  const limits = useMemo(() => {
    const big3Desktop = 10;
    const otherDesktop = 6;
    const big3Mobile = 4;
    const otherMobile = 3;

    return {
      rentas: isMobile ? big3Mobile : big3Desktop,
      "en-venta": isMobile ? big3Mobile : big3Desktop,
      "bienes-raices": isMobile ? otherMobile : otherDesktop,
      empleos: isMobile ? big3Mobile : big3Desktop,
      servicios: isMobile ? otherMobile : otherDesktop,
      travel: isMobile ? otherMobile : otherDesktop,
      autos: isMobile ? otherMobile : otherDesktop,
      clases: isMobile ? 2 : 4,
      comunidad: isMobile ? 2 : 4,
      restaurantes: isMobile ? otherMobile : otherDesktop,
    } as const;
  }, [isMobile]);

  const featuredByCategory = useMemo(() => {
    const out: Record<CategoryKey, Listing[]> = {
      rentas: [],
      "en-venta": [],
      "bienes-raices": [],
      empleos: [],
      servicios: [],
      travel: [],
      autos: [],
      clases: [],
      comunidad: [],
      restaurantes: [],
    };

    for (const cat of Object.keys(out) as CategoryKey[]) {
      const all = sampleListings.filter((l) => l.category === cat);
      const business = all.filter((x) => x.sellerType === "business");
      const personal = all.filter((x) => x.sellerType === "personal");
      const limit = (limits as Record<string, number>)[cat] as number;
      const mixed: Listing[] = [];
      let bi = 0;
      let pi = 0;

      while (mixed.length < limit && (bi < business.length || pi < personal.length)) {
        if (bi < business.length) mixed.push(business[bi++]);
        if (mixed.length >= limit) break;
        if (pi < personal.length) mixed.push(personal[pi++]);
      }

      out[cat] = mixed.slice(0, limit);
    }

    return out;
  }, [limits, sampleListings]);

  const ListingCardCompact = ({ item }: { item: Listing }) => {
    const href = `/clasificados/anuncio/${item.id}?lang=${lang}`;
    const isBusiness = item.sellerType === "business";

    return (
      <a
        href={href}
        className={cx(
          "block rounded-2xl border bg-[#F5F5F5] backdrop-blur transition hover:bg-[#F5F5F5]",
          isBusiness ? "border-yellow-500/25" : "border-black/10"
        )}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-bold text-[#111111] leading-snug line-clamp-2">
                {item.title[lang]}
              </div>
              <div className="mt-1 text-sm text-[#111111] font-semibold">
                {item.priceLabel[lang]}
              </div>
              <div className="mt-1 text-xs text-[#111111]">
                {item.city} · {item.postedAgo[lang]}
              </div>
            </div>

            <span
              className={cx(
                "shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border",
                isBusiness
                  ? "border-[#C9B46A]/55 text-[#111111] bg-[#111111]/10"
                  : "border-black/10 text-[#111111] bg-[#F5F5F5]"
              )}
            >
              {isBusiness
                ? lang === "es"
                  ? "Negocio"
                  : "Business"
                : lang === "es"
                  ? "Personal"
                  : "Personal"}
            </span>
          </div>

          <div className="mt-3 text-sm text-[#111111] line-clamp-2">
            {item.blurb[lang]}
          </div>
        </div>
      </a>
    );
  };

  const CategoryTile = ({ cat }: { cat: CategoryKey }) => {
    const meta = (t.cat as Record<string, { label: string; hint: string }>)[cat];

    return (
      <a
        href={withCategoryRoute(cat)}
        className={cx(
          "group block rounded-2xl border border-[#C9B46A]/70 bg-[#F5F5F5] backdrop-blur",
          "hover:bg-[#F5F5F5] transition"
        )}
      >
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-bold text-[#111111]">{meta.label}</div>
              <div className="mt-1 text-sm text-[#111111]">{meta.hint}</div>
            </div>
            <span className="shrink-0 text-[#111111] group-hover:text-[#111111] transition" aria-hidden>
              →
            </span>
          </div>
        </div>
      </a>
    );
  };

  const PlanCard = ({
    title,
    price,
    bullets,
    accent,
  }: {
    title: string;
    price?: string;
    bullets: readonly string[];
    accent?: "gold" | "strong";
  }) => {
    return (
      <div
        className={cx(
          "rounded-2xl border bg-[#F5F5F5] backdrop-blur p-6",
          accent === "gold" && "border-yellow-500/25",
          accent === "strong" && "border-yellow-500/40 bg-[#F8F6F0]"
        )}
      >
        <div className="text-xl font-bold text-[#111111]">{title}</div>
        {price ? (
          <div className="mt-1 text-sm font-semibold text-[#111111]">{price}</div>
        ) : null}
        <ul className="mt-4 space-y-2 text-sm text-[#111111]">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#111111]/70 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111] pb-28 bg-[radial-gradient(ellipse_at_top,rgba(169,140,42,0.10),transparent_60%)]">
      <Navbar />

      <section className="max-w-screen-2xl mx-auto px-6 pt-28">
        <div className="relative text-center mb-14">
          <div className="flex flex-wrap justify-center sm:justify-end gap-3 mb-6 sm:mb-0 sm:absolute sm:right-0 sm:top-0">
            <a
              href={withLang(t.routeLogin)}
              className="px-4 py-2 text-sm rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold hover:bg-[#F5F5F5] transition"
            >
              {t.authSignIn}
            </a>
            <a
              href={withLang(t.routeLogin)}
              className="px-4 py-2 text-sm rounded-full border border-[#C9B46A]/70 bg-[#111111]/10 text-[#111111] font-semibold hover:bg-[#111111]/12 transition"
            >
              {t.authCreate}
            </a>
          </div>

          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" />

          <h1 className="text-6xl md:text-7xl font-bold text-[#111111]">
            {t.pageTitle}
          </h1>
          <p className="mt-5 text-[#111111] max-w-3xl mx-auto text-lg md:text-xl">
            {t.subtitle}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={postEntryHref}
              className="px-5 py-2.5 text-sm rounded-full bg-[#111111] text-[#F5F5F5] font-semibold hover:opacity-95 transition"
            >
              {t.ctaPost}
            </a>

            <Link
              href={withListParams()}
              className="px-5 py-2.5 text-sm rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold hover:bg-[#F5F5F5] transition"
              aria-label={t.ctaView}
            >
              {t.ctaView}
            </Link>

            <Link
              href={withLang(t.routeMemberships)}
              className="px-5 py-2.5 text-sm rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold hover:bg-[#F5F5F5] transition"
              aria-label={t.ctaMemberships}
            >
              {t.ctaMemberships}
            </Link>
          </div>

          <div className="mt-8 text-sm text-[#111111] max-w-3xl mx-auto">
            {t.trustLine}
          </div>
        </div>
      </section>

      <section className="max-w-screen-2xl mx-auto px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">
            {t.sectionBrowse}
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORY_ORDER.map((k) => (
            <CategoryTile key={k} cat={k} />
          ))}
        </div>
      </section>

      <section className="max-w-screen-2xl mx-auto px-6 mt-12">
        <RecentlyViewedSection lang={lang} />
      </section>

      <section id="memberships" className="max-w-screen-2xl mx-auto px-6 mt-16">
        <div className="border border-[#C9B46A]/70 rounded-2xl p-8 bg-[#EFEFEF]">
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">
              {t.membershipsTitle}
            </h2>
            <p className="mt-2 text-sm text-[#111111] max-w-3xl">
              {t.membershipsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#111111]/70 mb-3">
                {t.personalHeading}
              </p>
              <div className="space-y-4">
                <PlanCard title={t.freeTitle} bullets={t.freeBullets} />
                <PlanCard title={t.proTitle} bullets={t.proBullets} accent="gold" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#111111]/70 mb-3">
                {t.negociosHeading}
              </p>
              <div className="space-y-4">
                <PlanCard
                  title={t.standardTitle}
                  price={t.standardPrice}
                  bullets={t.standardBullets}
                  accent="strong"
                />
                <PlanCard
                  title={t.plusTitle}
                  price={t.plusPrice}
                  bullets={t.plusBullets}
                  accent="strong"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#C9B46A]/30 bg-[#F5F5F5] p-5">
            <h3 className="text-base font-semibold text-[#111111]">{t.printTitle}</h3>
            <p className="mt-2 text-sm text-[#111111]">{t.printBody}</p>
            <a
              href={withLang(t.routeContacto)}
              className="mt-3 inline-flex items-center rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF] transition"
            >
              {t.printCta}
            </a>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              href={withLang(t.routeMemberships)}
              className="inline-flex items-center rounded-full bg-[#111111] text-[#F5F5F5] font-semibold px-5 py-2.5 text-sm hover:opacity-95 transition"
            >
              {t.ctaSeeOptions}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
