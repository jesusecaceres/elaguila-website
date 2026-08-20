import { PRIMARY_CATEGORIES } from "@/app/lib/recursos/categories";
import type { PrimaryCategorySlug, RecursosLang, UrgencyLevel } from "@/app/lib/recursos/types";
import { URGENCY_LEVELS } from "@/app/lib/recursos/urgency";

const COPY: Record<RecursosLang, { q: string; qLabel: string; urgency: string; allUrgency: string; category: string; allCategory: string; submit: string }> = {
  es: {
    q: "Palabra clave",
    qLabel: "Buscar recursos",
    urgency: "Urgencia",
    allUrgency: "Cualquier urgencia",
    category: "Categoría",
    allCategory: "Todas las categorías",
    submit: "Buscar",
  },
  en: {
    q: "Keyword",
    qLabel: "Search resources",
    urgency: "Urgency",
    allUrgency: "Any urgency",
    category: "Category",
    allCategory: "All categories",
    submit: "Search",
  },
};

/**
 * V1 filters only — keyword, category (optional, when not locked by route), urgency. Plain GET
 * form, server-rendered, no client JS required. Reused by both `/recursos-comunitarios/[category]`
 * (category locked, hidden field) and `/recursos-comunitarios/resultados` (category selectable).
 */
export function RecursosFilterForm({
  lang,
  actionPath,
  defaultQuery,
  defaultUrgency,
  lockedCategory,
  showCategorySelect,
  defaultCategory,
}: {
  lang: RecursosLang;
  actionPath: string;
  defaultQuery?: string;
  defaultUrgency?: UrgencyLevel | "";
  lockedCategory?: PrimaryCategorySlug;
  showCategorySelect?: boolean;
  defaultCategory?: PrimaryCategorySlug | "";
}) {
  const t = COPY[lang];
  const selectClass =
    "min-h-[2.75rem] rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-3 text-sm text-[#3D3428] focus:border-[#C9A84A] focus:outline-none";

  return (
    <form action={actionPath} method="GET" role="search" className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
      <input type="hidden" name="lang" value={lang} />
      {lockedCategory ? <input type="hidden" name="category" value={lockedCategory} /> : null}

      <label className="sr-only" htmlFor="recursos-filter-q">
        {t.qLabel}
      </label>
      <input
        id="recursos-filter-q"
        type="search"
        name="q"
        defaultValue={defaultQuery ?? ""}
        placeholder={t.q}
        className="min-h-[2.75rem] flex-1 rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-4 text-sm text-[#3D3428] placeholder:text-[#3D3428]/50 focus:border-[#C9A84A] focus:outline-none"
      />

      {showCategorySelect ? (
        <>
          <label className="sr-only" htmlFor="recursos-filter-category">
            {t.category}
          </label>
          <select id="recursos-filter-category" name="category" defaultValue={defaultCategory ?? ""} className={selectClass}>
            <option value="">{t.allCategory}</option>
            {PRIMARY_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {lang === "en" ? c.labelEn : c.labelEs}
              </option>
            ))}
          </select>
        </>
      ) : null}

      <label className="sr-only" htmlFor="recursos-filter-urgency">
        {t.urgency}
      </label>
      <select id="recursos-filter-urgency" name="urgency" defaultValue={defaultUrgency ?? ""} className={selectClass}>
        <option value="">{t.allUrgency}</option>
        {URGENCY_LEVELS.map((u) => (
          <option key={u.level} value={u.level}>
            {lang === "en" ? u.labelEn : u.labelEs}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-lg bg-[#7A1E2C] px-6 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
      >
        {t.submit}
      </button>
    </form>
  );
}
