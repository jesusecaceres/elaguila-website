import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { getCodeOwnedLessonPackage, resolveLessonPackage } from "@/app/lib/business/learning/lessonPackage/registry";
import { applyLeonixLessonDoctrine } from "@/app/lib/business/learning/leonixDoctrine";
import { getPublishedLessonByKey, listAllPublishedResources, listPublishedLessons } from "@/app/lib/business/learning/repository";
import { normalizeLang } from "@/app/lib/language";
import { LEONIX_MEDIA_SITE_NAME, leonixPageTitle } from "@/app/lib/leonixBrand";
import { contentLangFromRouteLang, learningCopy, learningLandingCopy } from "../../learningCopy";
import { LEARNING_ROUTES, journeyFromSearchParams, resolveNextLesson } from "../../learningJourneys";
import { learningPathwayCopy } from "../../learningPathwayCopy";
import { lessonCopy } from "../../lessonCopy";
import { LessonRenderer, type LessonNextView } from "../../_components/lesson/LessonRenderer";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
type PageProps = { params: Promise<{ lessonKey: string }>; searchParams: Promise<SearchParams> };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ lessonKey }, sp] = await Promise.all([params, searchParams]);
  const tier = await resolveLearningCenterFlagTier(null);
  if (tier !== "global") return {};
  const stored = await getPublishedLessonByKey(lessonKey);
  const lesson = stored ? applyLeonixLessonDoctrine(stored) : null;
  if (!lesson) return {};
  const lang = contentLangFromRouteLang(normalizeLang(first(sp.lang)));
  const pkg = resolveLessonPackage(lesson);
  const title = pkg.meta.title[lang];
  const description = pkg.meta.outcome[lang];
  const path = `${LEARNING_ROUTES.home}/leccion/${lesson.lessonKey}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: leonixPageTitle(title), description, url: path, siteName: LEONIX_MEDIA_SITE_NAME, type: "article", locale: lang === "en" ? "en_US" : "es_ES" },
  };
}

/**
 * Gate G2 — one published lesson through the canonical lesson renderer. The database row stays the
 * publish-state truth (a planned/draft/archived lesson always 404s) and the stable identity; the
 * CONTENT comes from a LessonPackage: the authored package when one exists, otherwise the reduced
 * package the deterministic legacy adapter derives from the stored body. No lesson renders as a
 * single plain essay box any more.
 *
 * Optional `?journey=` (idea · empezando · negocio) drives breadcrumb, example variant and NEXT;
 * an unknown value is ignored and the lesson renders neutrally. `?audio=preview` shows the authored
 * listening script, clearly labelled, while no recording exists — never a fake player.
 */
export default async function LearningLessonPage({ params, searchParams }: PageProps) {
  const [{ lessonKey }, sp] = await Promise.all([params, searchParams]);
  const routeLang = normalizeLang(first(sp.lang));
  const lang = contentLangFromRouteLang(routeLang);
  const chrome = learningCopy(lang);

  const tier = await resolveLearningCenterFlagTier(null);
  if (tier !== "global") {
    return (
      <main className="mx-auto w-full max-w-2xl min-w-0 space-y-4 px-4 py-10 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A1E2C]">{chrome.siteEyebrow}</p>
        <h1 className="font-serif text-2xl font-bold text-[#2A4536]">{chrome.comingSoonTitle}</h1>
        <p className="text-sm text-[#5C5346]">{chrome.comingSoonBody}</p>
      </main>
    );
  }

  const stored = await getPublishedLessonByKey(lessonKey);
  const lesson = stored ? applyLeonixLessonDoctrine(stored) : null;
  if (!lesson) notFound();

  const [resources, publishedLessons] = await Promise.all([
    listAllPublishedResources(),
    listPublishedLessons().then((rows) => rows.map(applyLeonixLessonDoctrine)),
  ]);
  const relatedResourceKeys = resources.filter((r) => r.lessonId === lesson.id && r.resourceType !== "glossary_term").map((r) => r.resourceKey);
  const pkg = resolveLessonPackage(lesson, relatedResourceKeys);

  const journey = journeyFromSearchParams(sp);
  const preferred = pkg.next?.preferred?.[journey ?? "neutral"] ?? [];
  const nextResolved = resolveNextLesson({ lessonKey: lesson.lessonKey, journey, lessons: publishedLessons, preferred });
  let next: LessonNextView = null;
  if (nextResolved) {
    const n = nextResolved.lesson;
    const nextPkg = getCodeOwnedLessonPackage(n.lessonKey);
    next = {
      lessonKey: n.lessonKey,
      title: nextPkg ? nextPkg.meta.title[lang] : lang === "es" ? n.titleEs : n.titleEn,
      summary: lang === "es" ? n.summaryEs : n.summaryEn,
      minutes: n.estimatedMinutes,
    };
  }

  return (
    <LessonRenderer
      pkg={pkg}
      lang={lang}
      routeLang={routeLang}
      journey={journey}
      resources={resources}
      next={next}
      audioPreview={first(sp.audio) === "preview"}
      copy={lessonCopy(lang)}
      landing={learningLandingCopy(lang)}
      pathway={learningPathwayCopy(lang)}
      chrome={chrome}
    />
  );
}
