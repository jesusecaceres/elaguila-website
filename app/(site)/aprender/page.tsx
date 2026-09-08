import Link from "next/link";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { listActiveCategories, listPublishedLessons } from "@/app/lib/business/learning/repository";
import { groupLessonsByCategory } from "@/app/lib/business/learning/logic";
import { langFromSearchParams, learningCopy } from "./learningCopy";
import { LearningSearch } from "./_components/LearningSearch";

export const dynamic = "force-dynamic";

/**
 * TODAY-1 — public Learning Center home. Server component: reads categories/lessons directly
 * through the service-role repository (never an anon table grant). Gated on the
 * business_learning_center flag being fully "global" -- while disabled, a truthful coming-soon
 * state renders instead (no crash, no unpublished content).
 */
export default async function LearningCenterHomePage({
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

  const [categories, lessons] = await Promise.all([listActiveCategories(), listPublishedLessons()]);
  const grouped = groupLessonsByCategory(lessons);

  return (
    <main className="mx-auto w-full max-w-2xl min-w-0 space-y-6 px-4 py-6 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#9A9184]">{t.siteEyebrow}</p>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#1E1810]">{t.homeTitle}</h1>
          <div className="flex shrink-0 gap-1">
            <Link href="/aprender?lang=es" className={`inline-flex min-h-11 items-center rounded-lg px-2.5 text-xs font-semibold ${lang === "es" ? "bg-[#7A1E2C] text-white" : "border border-[#E8DFD0] text-[#3D3428]"}`}>{t.langToggleEs}</Link>
            <Link href="/aprender?lang=en" className={`inline-flex min-h-11 items-center rounded-lg px-2.5 text-xs font-semibold ${lang === "en" ? "bg-[#7A1E2C] text-white" : "border border-[#E8DFD0] text-[#3D3428]"}`}>{t.langToggleEn}</Link>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[#5C5346]">{t.homeSubtitle}</p>
      </header>

      <LearningSearch lang={lang} />

      <div className="flex flex-wrap gap-2">
        <Link href={`/aprender/glosario?${q}`} className="inline-flex min-h-11 items-center rounded-xl border border-[#E8DFD0] bg-white px-4 text-sm font-semibold text-[#3D3428]">{t.glossaryLink}</Link>
        <Link href={`/aprender/recursos?${q}`} className="inline-flex min-h-11 items-center rounded-xl border border-[#E8DFD0] bg-white px-4 text-sm font-semibold text-[#3D3428]">{t.resourcesLink}</Link>
        <Link href={`/dashboard/business-tools/idea-builder?${q}`} className="inline-flex min-h-11 items-center rounded-xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 text-sm font-semibold text-[#1E1810]">{t.ideaBuilderLink}</Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#1E1810]">{t.categoriesTitle}</h2>
        <ul className="space-y-3">
          {categories.map((c) => {
            const count = (grouped.get(c.id) ?? []).length;
            return (
              <li key={c.id}>
                <Link
                  href={`/aprender/${c.categoryKey}?${q}`}
                  className="block min-h-11 rounded-2xl border border-[#E8DFD0] bg-white p-4 shadow-[0_6px_20px_-12px_rgba(42,36,22,0.15)]"
                >
                  <p className="break-words text-sm font-semibold text-[#1E1810]">{lang === "es" ? c.titleEs : c.titleEn}</p>
                  <p className="mt-1 break-words text-xs text-[#5C5346]">{lang === "es" ? c.summaryEs : c.summaryEn}</p>
                  <p className="mt-2 text-[11px] text-[#9A9184]">{count} {lang === "es" ? "leccion(es)" : "lesson(s)"}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
