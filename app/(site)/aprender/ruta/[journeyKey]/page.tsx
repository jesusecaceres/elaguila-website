import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { listActiveCategories, listAllPublishedResources, listPublishedLessons } from "@/app/lib/business/learning/repository";
import type { LearningResource } from "@/app/lib/business/learning/types";
import { normalizeLang } from "@/app/lib/language";
import { LEONIX_MEDIA_SITE_NAME, leonixPageTitle } from "@/app/lib/leonixBrand";
import { contentLangFromRouteLang, learningCopy, learningLandingCopy } from "../../learningCopy";
import {
  LEARNING_ANCHORS,
  LEARNING_ROUTES,
  isLearningJourneyKey,
  landingHref,
  resolveJourneyCheckpoints,
  resolveJourneyLessons,
  resolveTopicTiles,
} from "../../learningJourneys";
import { learningPathwayCopy } from "../../learningPathwayCopy";
import { LearningAccessClose } from "../../_components/LearningAccessClose";
import { LearningCheckpointSpine } from "../../_components/LearningCheckpointSpine";
import { LearningMethod } from "../../_components/LearningMethod";
import { LearningPathwayBridge } from "../../_components/LearningPathwayBridge";
import { LearningPathwayHero } from "../../_components/LearningPathwayHero";
import { LearningSearch } from "../../_components/LearningSearch";
import { LearningToolkit } from "../../_components/LearningToolkit";
import { LearningTopicTiles } from "../../_components/LearningTopicTiles";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
type PageProps = { params: Promise<{ journeyKey: string }>; searchParams: Promise<SearchParams> };

function routeLangFrom(sp: SearchParams) {
  return normalizeLang(Array.isArray(sp.lang) ? sp.lang[0] : sp.lang);
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ journeyKey }, sp] = await Promise.all([params, searchParams]);
  if (!isLearningJourneyKey(journeyKey)) return {};
  const lang = contentLangFromRouteLang(routeLangFrom(sp));
  const seo = learningPathwayCopy(lang).seo[journeyKey];
  const path = `${LEARNING_ROUTES.pathway}/${journeyKey}`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title: leonixPageTitle(seo.title),
      description: seo.description,
      url: path,
      siteName: LEONIX_MEDIA_SITE_NAME,
      type: "website",
      locale: lang === "en" ? "en_US" : "es_ES",
    },
  };
}

/**
 * Gate G1 — one pathway page for the three journeys (idea · empezando · negocio). The journeys
 * are ordered views through ONE school: the same published lessons, arranged on the canonical
 * 7-checkpoint spine with this journey's depth, urgency, framing and action. Composition:
 * journey hero → checkpoint spine → practical toolkit → learn-by-doing method → browse by topic
 * (secondary) → bridge to the next journey → access close.
 *
 * Same truth rules and flag gate as the landing: published-only service-role reads, "En
 * preparación" for empty checkpoints, no planned title ever rendered. Unknown keys 404.
 */
export default async function LearningPathwayPage({ params, searchParams }: PageProps) {
  const [{ journeyKey }, sp] = await Promise.all([params, searchParams]);
  if (!isLearningJourneyKey(journeyKey)) notFound();
  const journey = journeyKey;

  const routeLang = routeLangFrom(sp);
  const lang = contentLangFromRouteLang(routeLang);
  const chrome = learningCopy(lang);
  const landing = learningLandingCopy(lang);
  const copy = learningPathwayCopy(lang);

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

  const [categories, lessons, resources] = await Promise.all([listActiveCategories(), listPublishedLessons(), listAllPublishedResources()]);

  const journeyLessons = resolveJourneyLessons(journey, lessons);
  const checkpoints = resolveJourneyCheckpoints(journey, lessons);
  const tiles = resolveTopicTiles(categories, lessons);
  const glossaryCount = resources.filter((r) => r.resourceType === "glossary_term").length;
  const resourceCount = resources.filter((r) => r.resourceType === "checklist" || r.resourceType === "template").length;

  const resourcesByLessonId = new Map<string, LearningResource[]>();
  for (const r of resources) {
    if (!r.lessonId || r.resourceType === "glossary_term") continue;
    resourcesByLessonId.set(r.lessonId, [...(resourcesByLessonId.get(r.lessonId) ?? []), r]);
  }

  return (
    <main className="relative w-full overflow-x-hidden bg-[#FAF6EE] text-[#1F241C]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 110% 65% at 50% -5%, rgba(201, 168, 74, 0.12), transparent 52%), radial-gradient(ellipse 45% 35% at 100% 15%, rgba(255, 255, 255, 0.4), transparent 48%)",
        }}
        aria-hidden
      />
      <div className="relative z-10">
        <LearningPathwayHero landing={landing} copy={copy} chrome={chrome} routeLang={routeLang} journey={journey} lessons={journeyLessons} />
        <LearningCheckpointSpine copy={copy} chrome={chrome} lang={lang} routeLang={routeLang} journey={journey} checkpoints={checkpoints} resourcesByLessonId={resourcesByLessonId} />
        <LearningToolkit copy={landing} routeLang={routeLang} glossaryCount={glossaryCount} resourceCount={resourceCount} />
        <LearningMethod copy={landing} compact />
        <LearningTopicTiles copy={landing} chrome={chrome} lang={lang} routeLang={routeLang} tiles={tiles} search={<LearningSearch lang={lang} />} />
        <LearningPathwayBridge landing={landing} copy={copy} routeLang={routeLang} journey={journey} />
        <LearningAccessClose copy={landing} ctaHref={landingHref(routeLang, LEARNING_ANCHORS.journeys)} />
      </div>
    </main>
  );
}
