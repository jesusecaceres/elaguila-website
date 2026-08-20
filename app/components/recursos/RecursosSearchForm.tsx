import { RECURSOS_RESULTS_PATH } from "@/app/lib/recursos/recursosUrls";
import type { RecursosLang } from "@/app/lib/recursos/types";

const COPY: Record<RecursosLang, { placeholder: string; button: string; label: string }> = {
  es: { placeholder: "¿Qué necesitas? Ej. comida, renta, salud mental...", button: "Buscar", label: "Buscar recursos" },
  en: { placeholder: "What do you need? E.g. food, rent, mental health...", button: "Search", label: "Search resources" },
};

/**
 * Real, working search — plain GET form, no client JS required. Submits straight into the
 * results route (`resultados`), which does the actual eligible-only fetch + filter.
 */
export function RecursosSearchForm({ lang, defaultQuery }: { lang: RecursosLang; defaultQuery?: string }) {
  const t = COPY[lang];
  return (
    <form action={RECURSOS_RESULTS_PATH} method="GET" className="mt-6 flex flex-col gap-2.5 sm:flex-row" role="search">
      <label className="sr-only" htmlFor="recursos-q">
        {t.label}
      </label>
      <input type="hidden" name="lang" value={lang} />
      <input
        id="recursos-q"
        type="search"
        name="q"
        defaultValue={defaultQuery ?? ""}
        placeholder={t.placeholder}
        className="min-h-[3rem] flex-1 rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-4 text-sm text-[#3D3428] placeholder:text-[#3D3428]/50 focus:border-[#C9A84A] focus:outline-none"
      />
      <button
        type="submit"
        className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-lg bg-[#7A1E2C] px-8 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
      >
        {t.button}
      </button>
    </form>
  );
}
