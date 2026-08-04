import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { listActiveCategories, listPublishedLessons } from "@/app/lib/business/learning/repository";
import { langFromSearchParams, learningCopy } from "../learningCopy";

export const dynamic = "force-dynamic";

/** TODAY-1 — one category's published lessons. Server component, published-only, service-role reads. */
export default async function LearningCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryKey: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { categoryKey } = await params;
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

  const categories = await listActiveCategories();
  const category = categories.find((c) => c.categoryKey === categoryKey);
  if (!category) notFound();

  const allLessons = await listPublishedLessons();
  const lessons = allLessons.filter((l) => l.categoryId === category.id).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <main className="mx-auto w-full max-w-2xl min-w-0 space-y-5 px-4 py-6 sm:px-6">
      <Link href={`/aprender?${q}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#7A1E2C]">← {t.backToHome}</Link>

      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-[#1E1810]">{lang === "es" ? category.titleEs : category.titleEn}</h1>
        <p className="text-sm leading-relaxed text-[#5C5346]">{lang === "es" ? category.summaryEs : category.summaryEn}</p>
      </header>

      {lessons.length === 0 ? (
        <p className="text-sm text-[#7A7164]">{t.emptyCategory}</p>
      ) : (
        <ul className="space-y-3">
          {lessons.map((l) => (
            <li key={l.id}>
              <Link
                href={`/aprender/leccion/${l.lessonKey}?${q}`}
                className="block min-h-11 rounded-2xl border border-[#E8DFD0] bg-white p-4 shadow-[0_6px_20px_-12px_rgba(42,36,22,0.15)]"
              >
                <p className="break-words text-sm font-semibold text-[#1E1810]">{lang === "es" ? l.titleEs : l.titleEn}</p>
                <p className="mt-1 break-words text-xs text-[#5C5346]">{lang === "es" ? l.summaryEs : l.summaryEn}</p>
                <p className="mt-2 text-[11px] text-[#9A9184]">{t.levelLabel[l.level]} · {l.estimatedMinutes} {t.minutesLabel}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
