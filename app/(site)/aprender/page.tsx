import type { Metadata } from "next";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { listActiveCategories, listAllPublishedResources, listPublishedLessons } from "@/app/lib/business/learning/repository";
import { normalizeLang } from "@/app/lib/language";
import { buildPublicPillarMetadata } from "@/app/lib/leonix/publicPillarSeo";
import { contentLangFromRouteLang, learningCopy, learningLandingCopy } from "./learningCopy";
import {
  journeyFromSearchParams,
  resolveAllJourneys,
  resolveRoadmapStages,
  resolveStartHereLessons,
  resolveTopicTiles,
} from "./learningJourneys";
import { LearningAccessClose } from "./_components/LearningAccessClose";
import { LearningBusinessRoadmap } from "./_components/LearningBusinessRoadmap";
import { LearningHero } from "./_components/LearningHero";
import { LearningJourneyCards } from "./_components/LearningJourneyCards";
import { LearningMethod } from "./_components/LearningMethod";
import { LearningSearch } from "./_components/LearningSearch";
import { LearningStartHere } from "./_components/LearningStartHere";
import { LearningToolkit } from "./_components/LearningToolkit";
import { LearningTopicTiles } from "./_components/LearningTopicTiles";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(props: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const sp = await props.searchParams;
  const raw = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  return buildPublicPillarMetadata("aprender", normalizeLang(raw));
}

/**
 * Phase 1 — flagship public Learning Center landing (Gate L1). Server component: reads the
 * published catalog through the service-role repository (never an anon grant), keeps the
 * `business_learning_center` flag gate with its truthful coming-soon state, and composes
 * hero → journeys → roadmap → start here → topics → toolkit → method → access close.
 *
 * Truth rules (locked): only published lessons count; journey/roadmap/start-here mappings are
 * code-owned and validated against the published catalog at render; a stage/journey with no
 * published lesson renders "En preparación"; categories with zero published lessons are hidden.
 * Content strings from the database render exactly as stored.
 */
export default async function LearningCenterHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const rawLang = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const routeLang = normalizeLang(rawLang);
  const lang = contentLangFromRouteLang(routeLang);
  const chrome = learningCopy(lang);
  const copy = learningLandingCopy(lang);

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

  const journeys = resolveAllJourneys(lessons);
  const stages = resolveRoadmapStages(lessons);
  const startHere = resolveStartHereLessons(lessons);
  const tiles = resolveTopicTiles(categories, lessons);
  const categoriesById = new Map(categories.map((c) => [c.id, c] as const));
  const glossaryCount = resources.filter((r) => r.resourceType === "glossary_term").length;
  const resourceCount = resources.filter((r) => r.resourceType === "checklist" || r.resourceType === "template").length;
  const selectedJourney = journeyFromSearchParams(sp);

  return (
    <>
      <PublicPillarJsonLd id="aprender" lang={routeLang} />
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
          <LearningHero copy={copy} />
          <LearningJourneyCards copy={copy} chrome={chrome} lang={lang} routeLang={routeLang} journeys={journeys} selected={selectedJourney} />
          <LearningBusinessRoadmap copy={copy} chrome={chrome} lang={lang} routeLang={routeLang} stages={stages} />
          <LearningStartHere copy={copy} chrome={chrome} lang={lang} routeLang={routeLang} lessons={startHere} categoriesById={categoriesById} />
          <LearningTopicTiles copy={copy} chrome={chrome} lang={lang} routeLang={routeLang} tiles={tiles} search={<LearningSearch lang={lang} />} />
          <LearningToolkit copy={copy} routeLang={routeLang} glossaryCount={glossaryCount} resourceCount={resourceCount} />
          <LearningMethod copy={copy} />
          <LearningAccessClose copy={copy} />
        </div>
      </main>
    </>
  );
}
