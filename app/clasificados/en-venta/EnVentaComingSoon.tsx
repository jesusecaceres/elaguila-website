"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar";

type Lang = "es" | "en";

export type EnVentaComingSoonVariant = "hub" | "publish" | "lista" | "detail" | "pro";

const COPY: Record<
  EnVentaComingSoonVariant,
  { es: { title: string; body: string; back: string }; en: { title: string; body: string; back: string } }
> = {
  hub: {
    es: {
      title: "En Venta — Próximamente",
      body: "Esta sección se está reconstruyendo. Vuelve pronto para comprar y vender en tu comunidad.",
      back: "Volver a Clasificados",
    },
    en: {
      title: "For Sale — Coming soon",
      body: "This section is being rebuilt. Check back soon to buy and sell in your community.",
      back: "Back to Classifieds",
    },
  },
  publish: {
    es: {
      title: "Publicar en En Venta — Próximamente",
      body: "Estamos preparando una nueva experiencia de publicación. Por ahora no es posible crear anuncios en esta categoría.",
      back: "Ir a Clasificados",
    },
    en: {
      title: "Post in For Sale — Coming soon",
      body: "We’re preparing a new posting experience. You can’t create listings in this category yet.",
      back: "Go to Classifieds",
    },
  },
  lista: {
    es: {
      title: "Resultados En Venta — Próximamente",
      body: "La búsqueda y los resultados de En Venta volverán cuando terminemos la nueva versión.",
      back: "Explorar otras categorías",
    },
    en: {
      title: "For Sale results — Coming soon",
      body: "Search and listings for For Sale will return when the new version is ready.",
      back: "Browse other categories",
    },
  },
  detail: {
    es: {
      title: "Este anuncio no está disponible",
      body: "En Venta está en reconstrucción. Este contenido no se puede mostrar por ahora.",
      back: "Ver Clasificados",
    },
    en: {
      title: "This listing isn’t available",
      body: "For Sale is being rebuilt. This content can’t be shown right now.",
      back: "View Classifieds",
    },
  },
  pro: {
    es: {
      title: "LEONIX Pro — En Venta",
      body: "Las membresías Pro para En Venta volverán con la nueva experiencia.",
      back: "Volver",
    },
    en: {
      title: "LEONIX Pro — For Sale",
      body: "Pro memberships for For Sale will return with the new experience.",
      back: "Back",
    },
  },
};

export function EnVentaComingSoon(props: {
  lang: Lang;
  variant: EnVentaComingSoonVariant;
  showNavbar?: boolean;
  /** e.g. back link for pro flow */
  backHref?: string;
}) {
  const { lang, variant, showNavbar = true, backHref } = props;
  const t = COPY[variant][lang];
  const defaultBack =
    variant === "pro" && backHref
      ? backHref
      : `/clasificados?lang=${lang}`;

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111] pb-20 bg-[radial-gradient(ellipse_at_top,rgba(169,140,42,0.10),transparent_60%)]">
      {showNavbar ? <Navbar /> : null}
      <main className="mx-auto max-w-lg px-5 pt-24 sm:pt-28">
        <div className="rounded-2xl border border-[#C9B46A]/35 bg-[#F5F5F5] p-6 shadow-sm ring-1 ring-[#C9B46A]/15">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a7228]">
            {lang === "es" ? "Próximamente" : "Coming soon"}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#111111]">{t.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#111111]/85">{t.body}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={defaultBack}
              className="inline-flex justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-[#F5F5F5] hover:opacity-95"
            >
              {t.back}
            </Link>
            <Link
              href={`/clasificados/lista?lang=${lang}`}
              className="inline-flex justify-center rounded-xl border border-[#C9B46A]/50 bg-white px-5 py-3 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF]"
            >
              {lang === "es" ? "Buscar anuncios" : "Search listings"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
