import Image from "next/image";
import Link from "next/link";

type Lang = "es" | "en";
type SearchParams = Record<string, string | string[] | undefined>;

function getLang(searchParams: SearchParams): Lang {
  const v = searchParams?.lang;
  const s = Array.isArray(v) ? v[0] : v;
  return s === "en" ? "en" : "es";
}

function getOne(sp: SearchParams, key: string): string | undefined {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const lang = getLang(sp);
  const placeType = getOne(sp, "placeType");

  const base = new URLSearchParams();
  base.set("lang", lang);
  if (placeType) base.set("placeType", placeType);

  const lite = new URLSearchParams(base);
  lite.set("plan", "lite");

  const premium = new URLSearchParams(base);
  premium.set("plan", "premium");

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="LEONIX"
            width={120}
            height={120}
            className="mx-auto"
            priority
          />
          <h1 className="mt-7 text-3xl md:text-4xl font-bold text-yellow-400">
            {lang === "es" ? "Paquetes para restaurantes" : "Restaurant packages"}
          </h1>
          <p className="mt-3 text-sm md:text-base text-gray-300">
            {lang === "es"
              ? "Elige el nivel de presencia que necesitas. Aquí mostramos beneficios — precios se ven dentro de tu cuenta."
              : "Choose the presence level you need. We show benefits here — pricing is shown inside your account."}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/clasificados/restaurantes?lang=${lang}`}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              {lang === "es" ? "← Volver" : "← Back"}
            </Link>
            <Link
              href={`/clasificados/lista?cat=restaurantes&lang=${lang}`}
              className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition"
            >
              {lang === "es" ? "Ver restaurantes" : "Browse restaurants"}
            </Link>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-gray-300">
                  {lang === "es" ? "Recomendado para empezar" : "Best to start"}
                </div>
                <div className="mt-1 text-lg font-bold text-white">
                  {lang === "es" ? "Business Lite" : "Business Lite"}
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-gray-300">
                {lang === "es" ? "Presencia sólida" : "Solid presence"}
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li>• {lang === "es" ? "Perfil público con fotos y botones rápidos" : "Public profile with photos + fast action buttons"}</li>
              <li>• {lang === "es" ? "Más visibilidad que listados personales" : "Higher visibility than personal listings"}</li>
              <li>• {lang === "es" ? "Insignia de negocio (sin etiquetas de pago)" : "Business badge (no “paid” labels)"}</li>
              <li>• {lang === "es" ? "Analítica básica (vistas / acciones)" : "Basic analytics (views / actions)"}</li>
            </ul>

            <div className="mt-6">
              <Link
                href={`/clasificados/restaurantes/publicar?${lite.toString()}`}
                className="inline-flex w-full items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-5 py-3 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition"
              >
                {lang === "es" ? "Elegir Lite y continuar" : "Choose Lite & continue"}
              </Link>
            </div>

            <div className="mt-3 text-xs text-gray-400">
              {lang === "es"
                ? "Ideal si quieres llamadas y direcciones rápido."
                : "Ideal if you want calls and directions fast."}
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-yellow-200">
                  {lang === "es" ? "Máxima conversión" : "Maximum conversion"}
                </div>
                <div className="mt-1 text-lg font-bold text-yellow-100">
                  {lang === "es" ? "Business Premium" : "Business Premium"}
                </div>
              </div>
              <div className="rounded-full border border-yellow-400/30 bg-black/30 px-3 py-1 text-xs text-yellow-200">
                {lang === "es" ? "Prioridad" : "Priority"}
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-gray-200">
              <li>• {lang === "es" ? "Todo lo de Lite" : "Everything in Lite"}</li>
              <li>• {lang === "es" ? "Mejor ranking y presencia más premium" : "Higher ranking + more premium presence"}</li>
              <li>• {lang === "es" ? "Herramientas de contacto/lead (según disponibilidad)" : "Lead/contact tools (when available)"}</li>
              <li>• {lang === "es" ? "Perfil mejorado para cerrar más ventas" : "Enhanced profile to close more sales"}</li>
            </ul>

            <div className="mt-6">
              <Link
                href={`/clasificados/restaurantes/publicar?${premium.toString()}`}
                className="inline-flex w-full items-center justify-center rounded-xl border border-yellow-400/40 bg-yellow-500/15 px-5 py-3 text-sm font-semibold text-yellow-100 hover:bg-yellow-500/20 transition"
              >
                {lang === "es" ? "Elegir Premium y continuar" : "Choose Premium & continue"}
              </Link>
            </div>

            <div className="mt-3 text-xs text-yellow-100/80">
              {lang === "es"
                ? "Para negocios que quieren dominar su zona."
                : "For businesses that want to own their area."}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">
            {lang === "es" ? "Nota importante" : "Important note"}
          </div>
          <p className="mt-2 text-sm text-gray-300">
            {lang === "es"
              ? "Los cupones y sorteos son beneficios del magazine impreso, no de membresías digitales."
              : "Coupons and sweepstakes are print magazine benefits, not digital membership perks."}
          </p>
        </div>
      </div>
    </div>
  );
}
