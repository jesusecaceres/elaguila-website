import type { Metadata } from "next";
import Link from "next/link";

type Lang = "es" | "en";

const REST_PUBLICAR_ESTABLECIDO = "/publicar/restaurantes";
const COMIDA_LOCAL_PUBLICAR = "/publicar/comida-local";

const COPY = {
  es: {
    title: "Publicar en Restaurantes",
    body: "Elige el tipo de negocio de comida que quieres publicar en Leonix.",
    card1Kicker: "Establecimiento",
    card1Title: "Restaurante establecido",
    card1Body:
      "Para restaurantes, cafés, panaderías, food trucks establecidos y negocios con perfil completo.",
    card1Cta: "Publicar restaurante",
    card2Kicker: "Comida Local",
    card2Title: "Puesto, pop-up o vendedor móvil",
    card2Body: "Para puestos, pop-ups, comida casera, vendedores móviles y fines de semana.",
    card2Cta: "Publicar Comida Local",
  },
  en: {
    title: "Publish in Restaurants",
    body: "Choose the type of food business you want to publish on Leonix.",
    card1Kicker: "Establishment",
    card1Title: "Established restaurant",
    card1Body:
      "For restaurants, cafés, bakeries, established food trucks, and businesses with full profiles.",
    card1Cta: "Publish restaurant",
    card2Kicker: "Local Food",
    card2Title: "Stand, pop-up, or mobile vendor",
    card2Body: "For stands, pop-ups, homemade food, mobile vendors, and weekend sellers.",
    card2Cta: "Publish Local Food",
  },
} as const;

export const metadata: Metadata = {
  title: "Publicar Restaurantes | Leonix Clasificados",
  description: "Elige entre restaurante establecido o Comida Local.",
};

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function RestaurantesPublicarSelectorPage(props: PageProps) {
  const sp = props.searchParams ? await props.searchParams : {};
  const lang: Lang = sp.lang === "en" ? "en" : "es";
  const t = COPY[lang];

  const withLang = (path: string) => {
    const joiner = path.includes("?") ? "&" : "?";
    return `${path}${joiner}lang=${lang}`;
  };

  return (
    <main className="min-h-screen bg-[#F6F0E2] px-4 pb-20 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-extrabold text-[#1E1810]">{t.title}</h1>
        <p className="mt-2 text-sm text-[#5C5346]/88">{t.body}</p>
        <div className="mt-8 space-y-4">
          <Link
            href={withLang(REST_PUBLICAR_ESTABLECIDO)}
            className="block rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-5 shadow-sm transition hover:border-[#C9B46A]/50"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.card1Kicker}</p>
            <p className="mt-1 text-lg font-bold text-[#1E1810]">{t.card1Title}</p>
            <p className="mt-1 text-sm text-[#5C5346]/85">{t.card1Body}</p>
            <p className="mt-3 text-sm font-bold text-[#7A1E2C]">{t.card1Cta}</p>
          </Link>
          <Link
            href={withLang(COMIDA_LOCAL_PUBLICAR)}
            className="block rounded-2xl border border-[#C9B46A]/45 bg-gradient-to-br from-[#FFF6E7] to-[#FFFCF7] p-5 shadow-md transition hover:border-[#B8954A]"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.card2Kicker}</p>
            <p className="mt-1 text-lg font-bold text-[#1E1810]">{t.card2Title}</p>
            <p className="mt-1 text-sm text-[#5C5346]/85">{t.card2Body}</p>
            <p className="mt-3 text-sm font-bold text-[#7A1E2C]">{t.card2Cta}</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
