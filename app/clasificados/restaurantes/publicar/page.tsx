import Image from "next/image";
import Link from "next/link";

import RestaurantPublishForm from "./RestaurantPublishForm";

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
            {lang === "es" ? "Anuncia tu restaurante" : "List your restaurant"}
          </h1>
          <p className="mt-3 text-sm md:text-base text-gray-300">
            {lang === "es"
              ? "Te guiamos paso a paso. En menos de 2 minutos puedes estar en línea."
              : "We’ll guide you step by step. You can be live in under 2 minutes."}
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

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RestaurantPublishForm lang={lang} />
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-yellow-200">
                {lang === "es" ? "¿Qué se publica?" : "What gets published?"}
              </div>
              <p className="mt-2 text-sm text-gray-300">
                {lang === "es"
                  ? "Un perfil con tus datos básicos, fotos y botones de contacto (llamar, texto, dirección, web)."
                  : "A profile with your basics, photos, and fast contact buttons (call, text, directions, website)."}
              </p>
              <p className="mt-3 text-xs text-gray-400">
                {lang === "es"
                  ? "LEONIX AI revisa duplicados y spam en silencio para proteger la comunidad."
                  : "LEONIX AI quietly checks duplicates and spam to protect the community."}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/5 p-5">
              <div className="text-sm font-semibold text-yellow-200">
                {lang === "es" ? "Tip rápido" : "Quick tip"}
              </div>
              <p className="mt-2 text-sm text-gray-300">
                {lang === "es"
                  ? "Una buena foto de tu platillo principal + tu horario aumenta llamadas."
                  : "A great photo of your signature dish + your hours increases calls."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-white">
                {lang === "es" ? "¿Ya tienes un anuncio?" : "Already have a listing?"}
              </div>
              <p className="mt-2 text-sm text-gray-300">
                {lang === "es"
                  ? "Adminístralo desde tu panel (si está disponible en tu cuenta)."
                  : "Manage it from your dashboard (if available in your account)."}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
