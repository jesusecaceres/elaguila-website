import type { RecursosLang } from "@/app/lib/recursos/types";
import type { PublicResourceWithSpanishTrust } from "@/app/lib/recursos/server/communityResourcesPublicQueries";
import { ResourceCard } from "./ResourceCard";

const COPY: Record<RecursosLang, { emptyTitle: string; emptyBody: string }> = {
  es: {
    emptyTitle: "No encontramos recursos con esos filtros",
    emptyBody: "Intenta con otra categoría o una palabra clave diferente. El directorio verificado sigue creciendo.",
  },
  en: {
    emptyTitle: "No resources match those filters",
    emptyBody: "Try a different category or keyword. The verified directory keeps growing.",
  },
};

/** Shared grid used by both the category route and the general results route — same data, same rules. */
export function ResourceResultsGrid({ resources, lang }: { resources: PublicResourceWithSpanishTrust[]; lang: RecursosLang }) {
  const t = COPY[lang];

  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#D6C7AD] bg-[#FFFDF7]/60 p-8 text-center">
        <p className="font-serif text-lg font-bold text-[#2A4536]">{t.emptyTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{t.emptyBody}</p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((r) => (
        <li key={r.slug} className="flex h-full">
          <ResourceCard resource={r} lang={lang} />
        </li>
      ))}
    </ul>
  );
}
