import Link from "next/link";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { listPublishedResourcesByType } from "@/app/lib/business/learning/repository";
import { langFromSearchParams, learningCopy } from "../learningCopy";

export const dynamic = "force-dynamic";

/** TODAY-1 — public glossary. Server component, published-only, service-role reads. */
export default async function LearningGlossaryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const lang = langFromSearchParams(sp);
  const t = learningCopy(lang);
  const q = `lang=${lang}`;

  const tier = await resolveLearningCenterFlagTier(null);
  if (tier !== "global") {
    return (
      <main className="mx-auto w-full max-w-2xl min-w-0 space-y-4 px-4 py-10 sm:px-6">
        <h1 className="text-xl font-bold text-[#1E1810]">{t.comingSoonTitle}</h1>
        <p className="text-sm text-[#5C5346]">{t.comingSoonBody}</p>
      </main>
    );
  }

  const terms = await listPublishedResourcesByType("glossary_term");

  return (
    <main className="mx-auto w-full max-w-2xl min-w-0 space-y-5 px-4 py-6 sm:px-6">
      <Link href={`/aprender?${q}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#7A1E2C]">← {t.backToHome}</Link>

      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-[#1E1810]">{t.glossaryTitle}</h1>
        <p className="text-sm text-[#5C5346]">{t.glossarySubtitle}</p>
      </header>

      <ul className="space-y-3">
        {terms.map((term) => (
          <li key={term.id} className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
            <p className="break-words text-sm font-semibold text-[#1E1810]">{lang === "es" ? term.titleEs : term.titleEn}</p>
            <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{lang === "es" ? term.bodyEs : term.bodyEn}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
