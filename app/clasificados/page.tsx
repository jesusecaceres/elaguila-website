"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import newLogo from "../../public/logo.png";

import { SAMPLE_LISTINGS } from "../data/classifieds/sampleListings";

type Lang = "es" | "en";

type CategoryKey =
  | "en-venta"
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

        sectionBrowse: "Explorar por categoría",
        sectionFeatured: "Destacados por categoría",
        sectionFeaturedHint:
          "Una vista previa de anuncios destacados. Explora todo en la lista completa.",

        viewMore: "Ver más",

        cat: {
          rentas: { label: "Rentas", hint: "Casas, cuartos y propiedades." },
          "en-venta": { label: "En Venta", hint: "Compra y vende local." },
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
          "Beneficios principales. Los precios se muestran dentro de tu cuenta según tu categoría.",

        freeTitle: "Gratis",
        freeBullets: [
          "Publicación básica para la comunidad",
          "Duración corta (ideal para anuncios rápidos)",
          "Siempre visible y buscable",
        ] as const,

        proTitle: "LEONIX Pro (Personal)",
        proBullets: [
          "Más duración y mejor presentación",
          "Más fotos y mejor descripción",
          "1 “asistencia de visibilidad” por anuncio (ventana corta)",
          "Analíticas básicas (vistas/guardados)",
          "Reglas anti-spam (sin lenguaje de negocio, sin inventario)",
        ] as const,

        trustLine:
          "Un espacio confiable, familiar y comunitario. Los anuncios gratuitos siempre permanecen visibles en la búsqueda.",

        routePost: "/clasificados/publicar",
        routeList: "/clasificados/lista",
        routeMemberships: "/clasificados/membresias",
        routeLogin: "/clasificados/login",
      },
      en: {
        pageTitle: "Classifieds",
        subtitle: "The marketplace we build together, for our community.",

        authSignIn: "Sign in",
        authCreate: "Create account",

        ctaPost: "Post listing",
        ctaView: "View listings",
        ctaMemberships: "Memberships",

        sectionBrowse: "Browse by category",
        sectionFeatured: "Featured by category",
        sectionFeaturedHint:
          "A preview of featured listings. Browse everything in the full results.",

        viewMore: "View more",

        cat: {
          rentas: { label: "Rentals", hint: "Homes, rooms, and properties." },
          "en-venta": { label: "For Sale", hint: "Buy and sell locally." },
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
          "Key benefits. Prices are shown inside your account based on your category.",

        freeTitle: "Free",
        freeBullets: [
          "Basic community posting",
          "Short duration (great for quick posts)",
          "Always visible & searchable",
        ] as const,

        proTitle: "LEONIX Pro (Personal)",
        proBullets: [
          "Longer duration and better presentation",
          "More photos and better description",
          "1 short “visibility assist” per listing",
          "Basic analytics (views/saves)",
          "Anti-spam rules (no business language, no inventory behavior)",
        ] as const,

        trustLine:
          "A trusted, family-safe, community-first marketplace. Free listings always remain visible in search.",

        routePost: "/clasificados/publicar",
        routeList: "/clasificados/lista",
        routeMemberships: "/clasificados/membresias",
        routeLogin: "/clasificados/login",
      },
    } as const;

    return ui[lang];
  }, [lang]);

  const withLang = (path: string) => {
    const joiner = path.includes("?") ? "&" : "?";
    return `${path}${joiner}lang=${lang}`;
  };

  // ✅ NEW: route category tiles to their dedicated category pages (wrappers)
  const withCategoryRoute = (cat: CategoryKey) => {
    return withLang(`/clasificados/${cat}`);
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

  // Avoid hydration mismatch: detect mobile after mount
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
      empleos: isMobile ? big3Mobile : big3Desktop,
      servicios: isMobile ? otherMobile : otherDesktop,
      travel: isMobile ? otherMobile : otherDesktop,
      autos: isMobile ? otherMobile : otherDesktop,
      clases: isMobile ? 2 : 4,
      comunidad: isMobile ? 2 : 4,
    } as const;
  }, [isMobile]);

  const featuredByCategory = useMemo(() => {
    const out: Record<CategoryKey, Listing[]> = {
      rentas: [],
      "en-venta": [],
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
      const limit = (limits as any)[cat] as number;
// Fair mix: businesses get priority visibility, but personal listings must appear early too
const mixed: Listing[] = [];
let bi = 0;
let pi = 0;

// Pattern: B, P, B, P... (keeps businesses strong but prevents a wall of only business)
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
          "block rounded-2xl border bg-black/25 backdrop-blur transition hover:bg-black/30",
          isBusiness ? "border-yellow-400/25" : "border-white/10"
        )}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-bold text-gray-100 leading-snug line-clamp-2">
                {item.title[lang]}
              </div>
              <div className="mt-1 text-sm text-gray-200 font-semibold">
                {item.priceLabel[lang]}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {item.city} • {item.postedAgo[lang]}
              </div>
            </div>

            <span
              className={cx(
                "shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border",
                isBusiness
                  ? "border-yellow-400/40 text-yellow-200 bg-yellow-400/10"
                  : "border-white/10 text-gray-200 bg-white/5"
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

          <div className="mt-3 text-sm text-gray-200 line-clamp-2">
            {item.blurb[lang]}
          </div>
        </div>
      </a>
    );
  };

  const CategoryTile = ({ cat }: { cat: CategoryKey }) => {
    const meta = (t.cat as any)[cat] as { label: string; hint: string };

    return (
      <a
        // ✅ CHANGED: from lista params to dedicated category page route
        href={withCategoryRoute(cat)}
        className={cx(
          "group block rounded-2xl border border-yellow-600/20 bg-black/25 backdrop-blur",
          "hover:bg-black/30 transition"
        )}
      >
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-bold text-gray-100">{meta.label}</div>
              <div className="mt-1 text-sm text-gray-400">{meta.hint}</div>
            </div>
            <div className="shrink-0 text-gray-400 group-hover:text-gray-200 transition">
              →
            </div>
          </div>
        </div>
      </a>
    );
  };

  // ✅ FIX: accept readonly arrays (tuples) and mutable arrays
  const PlanCard = ({
    title,
    bullets,
    accent,
  }: {
    title: string;
    bullets: readonly string[];
    accent?: "gold";
  }) => {
    return (
      <div
        className={cx(
          "rounded-2xl border bg-black/25 backdrop-blur p-6",
          accent === "gold" ? "border-yellow-400/25" : "border-white/10"
        )}
      >
        <div
          className={cx(
            "text-xl font-bold",
            accent === "gold" ? "text-yellow-200" : "text-gray-100"
          )}
        >
          {title}
        </div>
        <ul className="mt-4 space-y-2 text-sm text-gray-300">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-yellow-400/70 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white pb-28 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.12),transparent_55%)]">
      <Navbar />

      {/* HERO (keep strong, cohesive) */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <div className="relative text-center mb-14">
          <div className="flex flex-wrap justify-center sm:justify-end gap-3 mb-6 sm:mb-0 sm:absolute sm:right-0 sm:top-0">
            <a
              href={withLang(t.routeLogin)}
              className="px-4 py-2 text-sm rounded-full border border-yellow-600/20 bg-black/25 text-gray-100 font-semibold hover:bg-black/30 transition"
            >
              {t.authSignIn}
            </a>
            <a
              href={withLang(t.routeLogin)}
              className="px-4 py-2 text-sm rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-200 font-semibold hover:bg-yellow-400/15 transition"
            >
              {t.authCreate}
            </a>
          </div>

          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" />

          <h1 className="text-6xl md:text-7xl font-bold text-yellow-400">
            {t.pageTitle}
          </h1>
          <p className="mt-5 text-gray-300 max-w-3xl mx-auto text-lg md:text-xl">
            {t.subtitle}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={withLang(t.routePost)}
              className="px-5 py-2.5 text-sm rounded-full bg-yellow-400 text-black font-semibold hover:opacity-95 transition"
            >
              {t.ctaPost}
            </a>

            <a
              href={withListParams()}
              className="px-5 py-2.5 text-sm rounded-full border border-yellow-600/20 bg-black/25 text-gray-100 font-semibold hover:bg-black/30 transition"
            >
              {t.ctaView}
            </a>

            <a
              href={withLang(t.routeMemberships)}
              className="px-5 py-2.5 text-sm rounded-full border border-yellow-600/20 bg-black/25 text-gray-100 font-semibold hover:bg-black/30 transition"
            >
              {t.ctaMemberships}
            </a>
          </div>

          <div className="mt-8 text-sm text-gray-400 max-w-3xl mx-auto">
            {t.trustLine}
          </div>
        </div>
      </section>

      {/* CATEGORY ENTRY (premium tiles; replaces old pills) */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl md:text-4xl font-bold text-yellow-200">
            {t.sectionBrowse}
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORY_ORDER.map((k) => (
            <CategoryTile key={k} cat={k} />
          ))}
        </div>
      </section>

      {/* FEATURED BY CATEGORY */}
      <section className="max-w-6xl mx-auto px-6 mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-200">
              {t.sectionFeatured}
            </h2>
            <p className="mt-2 text-sm text-gray-400 max-w-3xl">
              {t.sectionFeaturedHint}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-10">
          {CATEGORY_ORDER.map((cat) => {
            const meta = (t.cat as any)[cat] as { label: string; hint: string };
            const items = featuredByCategory[cat] || [];
            if (!items.length) return null;

            return (
              <div
                key={cat}
                className="border border-yellow-600/20 bg-black/20 rounded-2xl p-6"
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-xl font-bold text-gray-100">
                      {meta.label}
                    </div>
                    <div className="mt-1 text-sm text-gray-400">{meta.hint}</div>
                  </div>

                  <a
                    // ✅ CHANGED: from lista params to dedicated category page route
                    href={withCategoryRoute(cat)}
                    className="px-4 py-2 text-sm rounded-full border border-yellow-600/20 bg-black/25 text-gray-100 font-semibold hover:bg-black/30 transition"
                  >
                    {t.viewMore} →
                  </a>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={cx(
                        idx % 3 === 1
                          ? "lg:translate-y-2"
                          : idx % 3 === 2
                          ? "lg:translate-y-1"
                          : ""
                      )}
                    >
                      <ListingCardCompact item={item} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MEMBERSHIPS (benefits only, no prices) */}
      <section className="max-w-6xl mx-auto px-6 mt-16">
        <div className="border border-yellow-600/20 rounded-2xl p-8 bg-black/35">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-yellow-200">
                {t.membershipsTitle}
              </h2>
              <p className="mt-2 text-sm text-gray-400 max-w-3xl">
                {t.membershipsSubtitle}
              </p>
            </div>

            <a
              href={withLang(t.routeMemberships)}
              className="px-5 py-2.5 text-sm rounded-full bg-yellow-400 text-black font-semibold hover:opacity-95 transition"
            >
              {t.ctaMemberships} →
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlanCard title={t.freeTitle} bullets={t.freeBullets} />
            <PlanCard title={t.proTitle} bullets={t.proBullets} accent="gold" />
          </div>
        </div>
      </section>
    </div>
  );
}
