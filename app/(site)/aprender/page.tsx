import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { listAllPublishedResources, listPublishedLessons } from "@/app/lib/business/learning/repository";
import { normalizeLang } from "@/app/lib/language";
import { buildPublicPillarMetadata } from "@/app/lib/leonix/publicPillarSeo";
import { contentLangFromRouteLang, learningCopy, learningLandingCopy } from "./learningCopy";
import { buildJourneyHref, journeyFromSearchParams, resolveAllJourneys } from "./learningJourneys";
import { LearningAccessClose } from "./_components/LearningAccessClose";
import { LearningHero } from "./_components/LearningHero";
import { LearningJourneyCards } from "./_components/LearningJourneyCards";
import { LearningStartHelper } from "./_components/LearningStartHelper";
import { LearningToolsRow } from "./_components/LearningToolsRow";
import { LearningTrustStrip } from "./_components/LearningTrustStrip";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(props: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const sp = await props.searchParams;
  const raw = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  return buildPublicPillarMetadata("aprender", normalizeLang(raw));
}

/**
 * Gate G1 — the Learning Center front door. A short checkpoint, not the whole school:
 * hero → "¿Dónde estás hoy?" three doors → trust strip → "No sé por dónde empezar" helper →
 * compact tools row → access close. The curriculum itself lives on the pathway pages
 * (`/aprender/ruta/{journey}`). Legacy Phase-1 links (`/aprender?journey=idea`) redirect there.
 *
 * Truth rules (locked): only published lessons count; the journey mapping is code-owned and
 * validated against the published catalog at render; a journey with no published lesson renders
 * "En preparación". Server component: reads the catalog through the service-role repository
 * (never an anon grant) and keeps the `business_learning_center` flag gate with its truthful
 * coming-soon state. Content strings from the database render exactly as stored.
 */
export default async function LearningCenterHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const rawLang = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const routeLang = normalizeLang(rawLang);

  const legacyJourney = journeyFromSearchParams(sp);
  if (legacyJourney) redirect(buildJourneyHref(legacyJourney, routeLang));

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

  const [lessons, resources] = await Promise.all([listPublishedLessons(), listAllPublishedResources()]);

  const journeys = resolveAllJourneys(lessons);
  const glossaryCount = resources.filter((r) => r.resourceType === "glossary_term").length;
  const resourceCount = resources.filter((r) => r.resourceType === "checklist" || r.resourceType === "template").length;

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
          <LearningJourneyCards copy={copy} chrome={chrome} routeLang={routeLang} journeys={journeys} />
          <LearningTrustStrip copy={copy} />
          <LearningStartHelper copy={copy} chrome={chrome} lang={lang} routeLang={routeLang} firstLesson={journeys.idea[0] ?? null} />
          <LearningToolsRow copy={copy} routeLang={routeLang} glossaryCount={glossaryCount} resourceCount={resourceCount} />
          <LearningAccessClose copy={copy} />
        </div>
      </main>
    </>
  );
}
