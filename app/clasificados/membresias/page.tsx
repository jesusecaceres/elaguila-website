"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";

type Lang = "es" | "en";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function MembresiasPage() {
  const params = useSearchParams();
  const lang: Lang = params?.get("lang") === "en" ? "en" : "es";

  const withLang = (path: string) => {
    const joiner = path.includes("?") ? "&" : "?";
    return `${path}${joiner}lang=${lang}`;
  };

  const t = useMemo(
    () => ({
      es: {
        title: "Membresías",
        subtitle:
          "Opciones claras para vendedores personales, negocios y marcas que quieren crecer con LEONIX.",

        personalHeading: "Personal",
        freeTitle: "Gratis",
        freeWho: "Para quien publica de vez en cuando.",
        freeBullets: [
          "Publicación básica para la comunidad",
          "Siempre visible y buscable",
          "Ideal para anuncios ocasionales",
        ],
        freeTrust: "Los anuncios gratis siempre siguen visibles en búsqueda.",

        proTitle: "LEONIX Pro",
        proWho: "Para quien quiere más alcance y mejor presentación.",
        proBullets: [
          "Más duración y mejor presentación",
          "Más fotos y mejor descripción",
          "1 asistencia de visibilidad",
          "Analíticas básicas",
        ],

        negociosHeading: "Negocios",
        standardTitle: "Standard",
        standardPrice: "$49/semana",
        standardWho: "Para negocios que quieren presencia profesional clara y constante.",
        standardBullets: [
          "Perfil profesional para tu negocio",
          "Presencia por categoría",
          "Analíticas básicas",
          "1 asistencia de visibilidad",
        ],

        plusTitle: "Plus",
        plusPrice: "$125/semana",
        plusWho: "Para negocios que quieren vender más con mejor visibilidad y herramientas de contacto.",
        plusBullets: [
          "Perfil premium para vender mejor",
          "Más herramientas de contacto",
          "Mayor visibilidad y prioridad",
          "2 asistencias de visibilidad",
        ],

        printHeading: "Revista + exposición premium",
        printBody:
          "La edición impresa y ciertas oportunidades premium se manejan por separado. Si quieres conocer opciones, solicita el Media Kit.",
        printCta: "Solicita el Media Kit",

        ctaPost: "Publicar anuncio",
        ctaListings: "Ver anuncios",
        ctaAccount: "Entrar a mi cuenta",

        routePost: "/clasificados/publicar",
        routeList: "/clasificados/lista",
        routeCuenta: "/clasificados/cuenta",
        routeContacto: "/contacto",
      },
      en: {
        title: "Memberships",
        subtitle:
          "Clear options for personal sellers, businesses, and brands ready to grow with LEONIX.",

        personalHeading: "Personal",
        freeTitle: "Gratis",
        freeWho: "For those who post occasionally.",
        freeBullets: [
          "Basic community posting",
          "Always visible and searchable",
          "Best for occasional posts",
        ],
        freeTrust: "Free listings always remain visible in search.",

        proTitle: "LEONIX Pro",
        proWho: "For those who want more reach and better presentation.",
        proBullets: [
          "Longer duration and better presentation",
          "More photos and better description",
          "1 visibility assist",
          "Basic analytics",
        ],

        negociosHeading: "Business",
        standardTitle: "Standard",
        standardPrice: "$49/week",
        standardWho: "For businesses that want a clear, professional presence.",
        standardBullets: [
          "Professional business profile",
          "Category presence",
          "Basic analytics",
          "1 visibility assist",
        ],

        plusTitle: "Plus",
        plusPrice: "$125/week",
        plusWho: "For businesses that want stronger visibility and better conversion tools.",
        plusBullets: [
          "Premium profile built to convert",
          "More contact tools",
          "More visibility and priority",
          "2 visibility assists",
        ],

        printHeading: "Print + premium exposure",
        printBody:
          "Print and certain premium opportunities are handled separately. If you'd like options, request the Media Kit.",
        printCta: "Request the Media Kit",

        ctaPost: "Post listing",
        ctaListings: "View listings",
        ctaAccount: "Go to my account",

        routePost: "/clasificados/publicar",
        routeList: "/clasificados/lista",
        routeCuenta: "/clasificados/cuenta",
        routeContacto: "/contacto",
      },
    }),
    [lang]
  );

  const L = t[lang];

  const PlanCard = ({
    title,
    price,
    who,
    bullets,
    trust,
    accent,
  }: {
    title: string;
    price?: string;
    who: string;
    bullets: string[];
    trust?: string;
    accent?: "gold" | "strong";
  }) => (
    <div
      className={cx(
        "rounded-2xl border bg-[#F5F5F5] p-6",
        accent === "gold" && "border-yellow-500/25",
        accent === "strong" && "border-yellow-500/40 bg-[#F8F6F0]"
      )}
    >
      <div className="text-xl font-bold text-[#111111]">{title}</div>
      {price ? <div className="mt-1 text-sm font-semibold text-[#111111]">{price}</div> : null}
      <p className="mt-2 text-sm text-[#111111]/80">{who}</p>
      <ul className="mt-4 space-y-2 text-sm text-[#111111]">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#111111]/70 shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {trust ? (
        <p className="mt-4 text-xs text-[#111111]/60 border-t border-[#111111]/10 pt-3">{trust}</p>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111] pb-28 bg-[radial-gradient(ellipse_at_top,rgba(169,140,42,0.10),transparent_60%)]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-28">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#111111]">{L.title}</h1>
          <p className="mt-3 text-[#111111] text-lg max-w-2xl mx-auto">{L.subtitle}</p>
        </header>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-[#111111] mb-4">{L.personalHeading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlanCard
              title={L.freeTitle}
              who={L.freeWho}
              bullets={L.freeBullets}
              trust={L.freeTrust}
            />
            <PlanCard
              title={L.proTitle}
              who={L.proWho}
              bullets={L.proBullets}
              accent="gold"
            />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-[#111111] mb-4">{L.negociosHeading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlanCard
              title={L.standardTitle}
              price={L.standardPrice}
              who={L.standardWho}
              bullets={L.standardBullets}
              accent="strong"
            />
            <PlanCard
              title={L.plusTitle}
              price={L.plusPrice}
              who={L.plusWho}
              bullets={L.plusBullets}
              accent="strong"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[#C9B46A]/40 bg-[#F5F5F5] p-6 mb-12">
          <h2 className="text-lg font-semibold text-[#111111]">{L.printHeading}</h2>
          <p className="mt-2 text-sm text-[#111111]">{L.printBody}</p>
          <Link
            href={withLang(L.routeContacto)}
            className="mt-4 inline-flex items-center rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF] transition"
          >
            {L.printCta}
          </Link>
        </section>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={withLang(L.routePost)}
            className="inline-flex items-center rounded-full bg-[#111111] text-[#F5F5F5] font-semibold px-5 py-2.5 text-sm hover:opacity-95 transition"
          >
            {L.ctaPost}
          </Link>
          <Link
            href={withLang(L.routeList)}
            className="inline-flex items-center rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold px-5 py-2.5 text-sm hover:bg-[#EFEFEF] transition"
          >
            {L.ctaListings}
          </Link>
          <Link
            href={withLang(L.routeCuenta)}
            className="inline-flex items-center rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold px-5 py-2.5 text-sm hover:bg-[#EFEFEF] transition"
          >
            {L.ctaAccount}
          </Link>
        </div>
      </main>
    </div>
  );
}
