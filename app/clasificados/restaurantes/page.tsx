import Image from "next/image";
import Link from "next/link";

import { restaurants } from "../../data/restaurants";
import RestaurantCard from "../components/RestaurantCard";
import { AlertsPanel } from "./components/R3Widgets";

type Lang = "es" | "en";

type SearchParams = Record<string, string | string[] | undefined>;

function getLang(searchParams: SearchParams): Lang {
  const v = searchParams?.lang;
  const s = Array.isArray(v) ? v[0] : v;
  return s === "en" ? "en" : "es";
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const lang = getLang(sp);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 text-center">
        <div className="mx-auto max-w-3xl">
          <Image
            src="/logo.png"
            alt="LEONIX"
            width={140}
            height={140}
            className="mx-auto"
            priority
          />
          <h1 className="mt-8 text-4xl md:text-5xl font-bold text-yellow-400">
            {lang === "es" ? "Restaurantes" : "Restaurants"}
          </h1>
          <p className="mt-3 text-base md:text-lg text-gray-300">
            {lang === "es"
              ? "Descubre lugares cercanos y conecta en segundos."
              : "Discover nearby spots and connect in seconds."}
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/clasificados/lista?cat=restaurantes&lang=${lang}`}
            className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-5 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition"
          >
            {lang === "es" ? "Ver restaurantes" : "Browse restaurants"}
          </Link>
          <Link
            href={`/clasificados/restaurantes/paquetes?lang=${lang}`}
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            {lang === "es" ? "Anuncia tu restaurante" : "List your restaurant"}
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white">
              {lang === "es" ? "Acción inmediata" : "Instant action"}
            </div>
            <div className="mt-1 text-sm text-gray-300">
              {lang === "es"
                ? "Llamar, texto o direcciones en un toque. Menos fricción, más clientes."
                : "Call, text, or get directions in one tap. Less friction, more customers."}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white">
              {lang === "es" ? "Confianza primero" : "Trust first"}
            </div>
            <div className="mt-1 text-sm text-gray-300">
              {lang === "es"
                ? "Verificados y apoyados se muestran con insignias claras — sin etiquetas de pago."
                : "Verified and supporter badges are clear — no “paid” labels."}
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-400/15 bg-black/30 p-5">
            <div className="text-sm font-semibold text-yellow-200">
              {lang === "es" ? "Cupones del magazine" : "Magazine coupons"}
            </div>
            <div className="mt-1 text-sm text-gray-300">
              {lang === "es"
                ? "Los cupones son exclusivos para anunciantes del magazine. Beneficios, no trucos."
                : "Coupons are exclusive to magazine advertisers. Benefits, not gimmicks."}
            </div>
          </div>
        </div>


        <div className="mt-12 text-left">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-yellow-300">
                {lang === "es" ? "Descubrimiento" : "Discovery"}
              </h2>
              <p className="mt-1 text-sm text-gray-300">
                {lang === "es"
                  ? "Llamar, texto, direcciones, sitio web y redes — sin fricción."
                  : "Call, text, directions, website, and social — friction-free."}
              </p>
            </div>

            <Link
              href={`/clasificados/lista?cat=restaurantes&lang=${lang}`}
              className="text-sm font-semibold text-yellow-200 hover:text-yellow-100"
            >
              {lang === "es" ? "Abrir filtros →" : "Open filters →"}
            </Link>
          </div>

          
          <div className="mt-8">
            <AlertsPanel lang={lang} />
          </div>

<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {restaurants.length > 0 ? (
              restaurants.map((r) => <RestaurantCard key={r.id} r={r} lang={lang} />)
            ) : (
              <>
                <Placeholder lang={lang} />
                <Placeholder lang={lang} />
                <Placeholder lang={lang} />
                <Placeholder lang={lang} />
              </>
            )}
          </div>

          {restaurants.length === 0 && (
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="text-base font-semibold text-white">
                {lang === "es" ? "Tu ciudad está lista." : "Your city is ready."}
              </div>
              <div className="mt-2 text-sm text-gray-300">
                {lang === "es"
                  ? "Lanza tu presencia aquí y recibe clientes con intent alto."
                  : "Launch your presence here and capture high-intent customers."}
              </div>
              <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`/clasificados/restaurantes/paquetes?lang=${lang}`}
                  className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-5 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition"
                >
                  {lang === "es" ? "Publicar restaurante" : "Post restaurant"}
                </Link>
                <Link
                  href={`/clasificados/membresias?lang=${lang}`}
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  {lang === "es" ? "Ver beneficios" : "See benefits"}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Placeholder({ lang }: { lang: Lang }) {
  return (
    <div className="rounded-2xl border border-yellow-400/15 bg-black/30 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-48 bg-white/10 rounded" />
        <div className="h-6 w-20 bg-white/5 rounded-full border border-white/10" />
      </div>
      <div className="mt-3 h-3 w-36 bg-white/10 rounded" />
      <div className="mt-2 h-3 w-52 bg-white/5 rounded" />

      <div className="mt-6 grid grid-cols-2 gap-2">
        <div className="h-9 bg-white/5 rounded-xl border border-white/10" />
        <div className="h-9 bg-white/5 rounded-xl border border-white/10" />
        <div className="h-9 bg-white/5 rounded-xl border border-white/10" />
        <div className="h-9 bg-white/5 rounded-xl border border-white/10" />
      </div>

      <div className="mt-6 h-3 w-44 bg-white/10 rounded" />
      <div className="mt-2 h-3 w-40 bg-white/5 rounded" />

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-white">
          {lang === "es" ? "Tu negocio puede estar aquí" : "Your business can be here"}
        </div>
        <div className="mt-2 h-3 w-52 bg-white/10 rounded" />
      </div>
    </div>
  );
}