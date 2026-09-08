import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { getPublishedLessonByKey, listAllPublishedResources } from "@/app/lib/business/learning/repository";
import { langFromSearchParams, learningCopy } from "../../learningCopy";
import { LessonProgressButton } from "../../_components/LessonProgressButton";

export const dynamic = "force-dynamic";

/** TODAY-1 — one published lesson's full bilingual body + related resources. A planned/draft/archived lesson always 404s. */
export default async function LearningLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonKey: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lessonKey } = await params;
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

  const lesson = await getPublishedLessonByKey(lessonKey);
  if (!lesson) notFound();

  const allResources = await listAllPublishedResources();
  const relatedResources = allResources.filter((r) => r.lessonId === lesson.id);

  const body = lang === "es" ? lesson.bodyEs : lesson.bodyEn;

  return (
    <main className="mx-auto w-full max-w-2xl min-w-0 space-y-5 px-4 py-6 sm:px-6">
      <Link href={`/aprender?${q}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#7A1E2C]">← {t.backToHome}</Link>

      <header className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight text-[#1E1810]">{lang === "es" ? lesson.titleEs : lesson.titleEn}</h1>
        <p className="text-sm leading-relaxed text-[#5C5346]">{lang === "es" ? lesson.summaryEs : lesson.summaryEn}</p>
        <p className="text-[11px] text-[#9A9184]">{t.levelLabel[lesson.level]} · {lesson.estimatedMinutes} {t.minutesLabel}</p>
      </header>

      <LessonProgressButton lessonKey={lesson.lessonKey} lang={lang} />

      <article className="whitespace-pre-line break-words rounded-2xl border border-[#E8DFD0] bg-white p-4 text-sm leading-relaxed text-[#3D3428] sm:p-6">
        {body}
      </article>

      {relatedResources.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#1E1810]">{t.relatedResourcesTitle}</h2>
          <ul className="space-y-3">
            {relatedResources.map((r) => (
              <li key={r.id} className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9A9184]">
                  {r.resourceType === "checklist" ? t.checklistLabel : t.templateLabel}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-[#1E1810]">{lang === "es" ? r.titleEs : r.titleEn}</p>
                <p className="mt-1 whitespace-pre-line break-words text-xs leading-relaxed text-[#5C5346]">{lang === "es" ? r.bodyEs : r.bodyEn}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
