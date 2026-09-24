import type { Metadata } from "next";
import Link from "next/link";
import { normalizeLang } from "@/app/lib/language";
import { leonixPageTitle } from "@/app/lib/leonixBrand";
import { getPrayerUiCopy, prayerCategoryOptions } from "@/app/lib/iglesias/prayerCopy";
import { isPrayerCategoryKey, isPrayerLanguage, type PrayerCategoryKey, type PrayerLanguage } from "@/app/lib/iglesias/prayerTaxonomy";
import { listPublicPrayers } from "@/app/lib/iglesias/prayerQueries";
import { readPrayerOwnerFromCookies } from "@/app/lib/iglesias/prayerRequestContext";
import { IglesiasPageShell } from "../components/IglesiasPageShell";
import { IglesiasPrayerForm } from "../components/IglesiasPrayerForm";
import { IglesiasPrayerWallList } from "../components/IglesiasPrayerWallList";

export const dynamic = "force-dynamic";

type SearchParams = { lang?: string; category?: string; language?: string };

export async function generateMetadata(props: { searchParams?: Promise<SearchParams> }): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang) === "en" ? "en" : "es";
  const title = lang === "en" ? "Prayer Wall" : "Muro de Oración";
  const description =
    lang === "en"
      ? "Read real prayer requests from the community and pray with them. Ask for prayer publicly or privately."
      : "Lee peticiones reales de oración de la comunidad y ora con ellas. Pide oración en público o en privado.";
  return {
    title,
    description,
    alternates: { canonical: "/iglesias/oracion" },
    robots: { index: true, follow: true },
    openGraph: { title: leonixPageTitle(title), description },
  };
}

export default async function IglesiasOracionPage(props: { searchParams?: Promise<SearchParams> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang) === "en" ? "en" : "es";
  const copy = getPrayerUiCopy(lang);
  const categories = prayerCategoryOptions(lang);

  const categoryRaw = String(sp.category ?? "").toUpperCase();
  const category: PrayerCategoryKey | null = isPrayerCategoryKey(categoryRaw) ? categoryRaw : null;
  const languageRaw = String(sp.language ?? "").toLowerCase();
  const language: PrayerLanguage | null = isPrayerLanguage(languageRaw) ? languageRaw : null;

  const owner = await readPrayerOwnerFromCookies();
  const prayers = await listPublicPrayers({
    sessionHash: owner.sessionHash,
    userId: null,
    limit: 100,
    category,
    language,
  });

  const hasFilters = Boolean(category || language);
  const iglesiasHref = `/iglesias?lang=${lang}`;

  return (
    <IglesiasPageShell>
      <div className="mx-auto max-w-4xl overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
        <Link href={iglesiasHref} className="text-sm font-semibold text-[#7A1E2C] underline-offset-2 hover:underline">
          ← {lang === "en" ? "Back to Churches" : "Volver a Iglesias"}
        </Link>

        <header className="mt-5 max-w-2xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#7A1E2C]">{copy.wallPageEyebrow}</p>
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-[#1F241C] sm:text-4xl">
            {copy.wallPageTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#3D3428] sm:text-base">{copy.wallPageIntro}</p>
          <a
            href="#compartir"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#7A1E2C] px-6 text-sm font-semibold text-white hover:bg-[#6B1A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]"
          >
            {copy.shareRequestCta}
          </a>
        </header>

        <form
          action="/iglesias/oracion"
          method="get"
          className="mt-8 grid gap-3 rounded-2xl border border-[#D6C7AD]/80 bg-[#FFFDF7] p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end sm:p-5"
        >
          <input type="hidden" name="lang" value={lang} />
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-[#5C5346]">{copy.filterTopicLabel}</span>
            <select
              name="category"
              defaultValue={category ?? ""}
              className="min-h-11 w-full rounded-lg border border-[#D6C7AD] bg-white px-3 text-sm"
            >
              <option value="">{copy.filterAllTopics}</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-[#5C5346]">{copy.filterLanguageLabel}</span>
            <select
              name="language"
              defaultValue={language ?? ""}
              className="min-h-11 w-full rounded-lg border border-[#D6C7AD] bg-white px-3 text-sm"
            >
              <option value="">{copy.filterAllLanguages}</option>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1F241C] px-5 text-sm font-semibold text-white hover:bg-[#33392e]"
          >
            {copy.filterSubmit}
          </button>
          {hasFilters ? (
            <a
              href={`/iglesias/oracion?lang=${lang}`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D6C7AD] bg-white px-5 text-sm font-semibold text-[#3D3428] hover:bg-[#FAF6EE]"
            >
              {copy.filterClear}
            </a>
          ) : null}
        </form>

        <div className="mt-8">
          <IglesiasPrayerWallList prayers={prayers} lang={lang} />
        </div>

        <section id="compartir" className="mt-10 scroll-mt-24">
          <IglesiasPrayerForm lang={lang} />
        </section>
      </div>
    </IglesiasPageShell>
  );
}
