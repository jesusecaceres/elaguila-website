import type { Metadata } from "next";
import Link from "next/link";
import { normalizeLang } from "@/app/lib/language";
import { leonixPageTitle } from "@/app/lib/leonixBrand";
import { getIglesiasCopy } from "@/app/lib/iglesias/copy";
import { parseIglesiasBrowseState } from "@/app/lib/iglesias/queryParams";
import { listPublicChurches } from "@/app/lib/iglesias/churchQueries";
import { IglesiasPageShell } from "../components/IglesiasPageShell";
import { IglesiasSearch } from "../components/IglesiasSearch";
import { IglesiasDiscovery } from "../components/IglesiasDiscovery";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang) === "en" ? "en" : "es";
  const title = lang === "en" ? "Find a church" : "Encontrar una iglesia";
  const description =
    lang === "en"
      ? "Search real, reviewed churches near you by need, language, or city. No sample listings, no paid ranking."
      : "Busca iglesias reales y revisadas cerca de ti por necesidad, idioma o ciudad. Sin iglesias de ejemplo ni ranking pagado.";
  return {
    title,
    description,
    alternates: { canonical: "/iglesias/directorio" },
    robots: { index: true, follow: true },
    openGraph: { title: leonixPageTitle(title), description },
  };
}

export default async function IglesiasDirectorioPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await props.searchParams) ?? {};
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") usp.set(k, v);
    else if (Array.isArray(v) && v[0]) usp.set(k, v[0]);
  }
  const lang = normalizeLang(usp.get("lang")) === "en" ? "en" : "es";
  const browse = parseIglesiasBrowseState(usp);
  const copy = getIglesiasCopy(lang);
  const churches = await listPublicChurches(browse, lang);
  const hasFilters = Boolean(browse.q || browse.city || browse.zip || browse.need || browse.language);
  const churchHref = `/iglesias/registrar?lang=${lang}`;
  const iglesiasHref = `/iglesias?lang=${lang}`;

  return (
    <IglesiasPageShell>
      <div className="mx-auto max-w-[88rem] overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
        <Link href={iglesiasHref} className="text-sm font-semibold text-[#7A1E2C] underline-offset-2 hover:underline">
          ← {lang === "en" ? "Back to Churches" : "Volver a Iglesias"}
        </Link>

        <header className="mt-5 max-w-2xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#7A1E2C]">{copy.laneChurchEyebrow}</p>
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-[#1F241C] sm:text-4xl">
            {copy.discoveryTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#3D3428] sm:text-base">{copy.laneChurchSupport}</p>
        </header>

        <div className="mt-8 space-y-8">
          <IglesiasSearch
            copy={copy}
            lang={lang}
            browse={browse}
            actionHref="/iglesias/directorio"
            clearHref={`/iglesias/directorio?lang=${lang}`}
          />
          <IglesiasDiscovery copy={copy} lang={lang} churches={churches} hasFilters={hasFilters} churchHref={churchHref} />
        </div>
      </div>
    </IglesiasPageShell>
  );
}
