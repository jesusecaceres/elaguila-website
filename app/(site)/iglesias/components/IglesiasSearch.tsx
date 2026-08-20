import { IGLESIAS_NEED_CATALOG } from "@/app/lib/iglesias/taxonomy";
import type { IglesiasBrowseState } from "@/app/lib/iglesias/queryParams";
import type { IglesiasCopy } from "@/app/lib/iglesias/copy";

const fieldClass =
  "min-h-12 w-full rounded-xl border border-[#D6C7AD] bg-white px-3.5 text-sm text-[#1F241C] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition focus:border-[#7A1E2C] focus:ring-2 focus:ring-[#7A1E2C]/20";
const selectClass = `${fieldClass} appearance-none bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-10 [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22 fill=%22none%22%3E%3Cpath d=%22M1 1.5L6 6.5L11 1.5%22 stroke=%22%235C5346%22 stroke-width=%221.6%22 stroke-linecap=%22round%22/%3E%3C/svg%3E')]`;

export function IglesiasSearch({
  copy,
  lang,
  browse,
}: {
  copy: IglesiasCopy;
  lang: "es" | "en";
  browse: IglesiasBrowseState;
}) {
  const landingNeeds = IGLESIAS_NEED_CATALOG.filter((n) => n.landingTile);
  const cityZip = browse.city || browse.zip;
  const hasFilters = Boolean(browse.q || browse.city || browse.zip || browse.need || browse.language);

  return (
    <section id="buscar" className="scroll-mt-24" aria-labelledby="iglesias-search-heading">
      <div className="overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] shadow-[0_20px_50px_-36px_rgba(31,36,28,0.4)]">
        <div className="border-b border-[#C9A84A]/25 bg-[#FAF6EE] px-5 py-5 sm:px-7">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#7A1E2C]">{copy.laneChurchEyebrow}</p>
          <h2 id="iglesias-search-heading" className="mt-1 font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
            {copy.searchHeading}
          </h2>
        </div>
        <form action="/iglesias" method="get" className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
          <input type="hidden" name="lang" value={lang} />
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-[#5C5346]">{copy.searchName}</span>
            <input name="q" defaultValue={browse.q} className={fieldClass} />
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-[#5C5346]">{copy.searchCity}</span>
            <input name="city" defaultValue={cityZip} className={fieldClass} />
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-[#5C5346]">{copy.searchNeed}</span>
            <select name="need" defaultValue={browse.need ?? ""} className={selectClass}>
              <option value="">{copy.searchNeedAll}</option>
              {landingNeeds.map((n) => (
                <option key={n.key} value={n.key}>
                  {lang === "en" ? n.labelEn : n.labelEs}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-[#5C5346]">{copy.searchLanguage}</span>
            <select name="language" defaultValue={browse.language ?? ""} className={selectClass}>
              <option value="">{copy.searchLangAll}</option>
              <option value="es">{copy.langEs}</option>
              <option value="en">{copy.langEn}</option>
              <option value="bilingual">{copy.langBilingual}</option>
            </select>
          </label>
          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row lg:col-span-4">
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#7A1E2C] px-6 text-sm font-semibold text-white hover:bg-[#6B1A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]"
            >
              {copy.searchSubmit}
            </button>
            {hasFilters ? (
              <a
                href={`/iglesias?lang=${lang}#buscar`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#D6C7AD] bg-white px-6 text-sm font-semibold text-[#3D3428] hover:bg-[#FAF6EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]"
              >
                {copy.searchClear}
              </a>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
