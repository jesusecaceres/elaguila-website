import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";

import { restaurants } from "../../data/restaurants";
import RestaurantCard from "../components/RestaurantCard";
import { AlertsPanel } from "./components/R3Widgets";
import DiscoveryClient from "./components/DiscoveryClient";

type Lang = "es" | "en";

type SearchParams = Record<string, string | string[] | undefined>;

function getLang(searchParams: SearchParams): Lang {
  const v = searchParams?.lang;
  const s = Array.isArray(v) ? v[0] : v;
  return s === "en" ? "en" : "es";
}

function first(sp: SearchParams, key: string): string {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function truthy(v: string) {
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const lang = getLang(sp);
  const initialDiscovery = {
    q: first(sp, "q"),
    city: first(sp, "city"),
    radiusMi: (Number(first(sp, "r")) || 25) as 10 | 25 | 40 | 50,
    cuisine: first(sp, "cuisine"),
    price: (first(sp, "price") as any) || "",
    savedOnly: truthy(first(sp, "saved")),
    openNow: truthy(first(sp, "open")),
    family: truthy(first(sp, "family")),
    diet: (first(sp, "diet") as any) || "",
  };

  const filtered = restaurants.filter((r) => {
    const q = initialDiscovery.q.toLowerCase();
    if (q) {
      const hay = [r.name, r.cuisine, r.city, r.address].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (initialDiscovery.city) {
      const city = (r.city || "").toLowerCase();
      if (!city) return false;
      if (!city.includes(initialDiscovery.city.toLowerCase())) return false;
    }
    if (initialDiscovery.cuisine) {
      const c = (r.cuisine || "").toLowerCase();
      if (!c.includes(initialDiscovery.cuisine.toLowerCase())) return false;
    }
    return true;
  });


  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-32 text-center">
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
            href={`#discovery`}
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


        <div id="discovery" className="mt-12 text-left scroll-mt-28">
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
              href={`#discovery`}
              className="text-sm font-semibold text-yellow-200 hover:text-yellow-100"
            >
              {lang === "es" ? "Buscar y filtrar →" : "Search & filters →"}
            </Link>
          </div>

          
          <div id="filters" className="mt-6 scroll-mt-28">
            <DiscoveryClient lang={lang} initial={initialDiscovery} />
          </div>

          <div id="alerts" className="mt-8 scroll-mt-28">
            <AlertsPanel lang={lang} />
          </div>

<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.length > 0 ? (
              filtered.map((r) => <RestaurantCard key={r.id} r={r} lang={lang} />)
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
                  href={`/clasificados#memberships?lang=${lang}`}
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  {lang === "es" ? "Ver beneficios" : "See benefits"}
                </Link>
              </div>
            </div>
          )}
        </div>
      {/* Mobile sticky actions */}
      <div className="sm:hidden fixed bottom-4 left-0 right-0 z-40 px-4">
        <div className="mx-auto max-w-md grid grid-cols-3 gap-3 rounded-2xl border border-yellow-600/30 bg-black/80 backdrop-blur px-3 py-3 shadow-lg">
          <a
            href="#discovery"
            aria-label="Discover restaurants"
            className="text-center text-sm font-semibold rounded-xl bg-yellow-600/20 border border-yellow-600/30 py-2 hover:bg-yellow-600/30"
          >
            {lang === "es" ? "Descubrir" : "Discover"}
          </a>
          <a
            href="#alerts"
            aria-label="Restaurant alerts"
            className="text-center text-sm font-semibold rounded-xl bg-yellow-600/20 border border-yellow-600/30 py-2 hover:bg-yellow-600/30"
          >
            {lang === "es" ? "Alertas" : "Alerts"}
          </a>
          <Link
            href={`/clasificados/restaurantes/publicar?lang=${lang}`}
            aria-label="Post a restaurant"
            className="text-center text-sm font-semibold rounded-xl bg-yellow-500 text-black py-2 hover:bg-yellow-400"
          >
            {lang === "es" ? "Publicar" : "Post"}
          </Link>
        </div>
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
      {/* Mobile sticky actions */}
      <div className="sm:hidden fixed bottom-4 left-0 right-0 z-40 px-4">
        <div className="mx-auto max-w-md grid grid-cols-3 gap-3 rounded-2xl border border-yellow-600/30 bg-black/80 backdrop-blur px-3 py-3 shadow-lg">
          <a
            href="#discovery"
            aria-label="Discover restaurants"
            className="text-center text-sm font-semibold rounded-xl bg-yellow-600/20 border border-yellow-600/30 py-2 hover:bg-yellow-600/30"
          >
            {lang === "es" ? "Descubrir" : "Discover"}
          </a>
          <a
            href="#alerts"
            aria-label="Restaurant alerts"
            className="text-center text-sm font-semibold rounded-xl bg-yellow-600/20 border border-yellow-600/30 py-2 hover:bg-yellow-600/30"
          >
            {lang === "es" ? "Alertas" : "Alerts"}
          </a>
          <Link
            href={`/clasificados/restaurantes/publicar?lang=${lang}`}
            aria-label="Post a restaurant"
            className="text-center text-sm font-semibold rounded-xl bg-yellow-500 text-black py-2 hover:bg-yellow-400"
          >
            {lang === "es" ? "Publicar" : "Post"}
          </Link>
        </div>
      </div>

      </div>
    </div>
  );
}
