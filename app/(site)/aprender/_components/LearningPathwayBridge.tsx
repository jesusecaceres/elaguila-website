import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import type { LearningJourneyKey, LearningLandingCopy } from "../learningCopy";
import type { LearningPathwayCopy } from "../learningPathwayCopy";
import { LEARNING_ANCHORS, LEARNING_JOURNEY_KEYS, LEARNING_NEXT_JOURNEY, buildJourneyHref, landingHref } from "../learningJourneys";
import { JOURNEY_ACCENT, JourneyVignette } from "./learningGlyphs";
import { LEARNING_BTN_PRIMARY, LEARNING_CONTAINER, LEARNING_EYEBROW, LEARNING_LINK, LEARNING_SECTION } from "./learningUi";

/**
 * Gate G1 — bridge to the next journey (Idea → Empezando → Negocio). One school: the continuity
 * line says plainly that lessons are shared and nothing restarts. The last journey points back to
 * the three doors instead of inventing a fourth path.
 */
export function LearningPathwayBridge({
  landing,
  copy,
  routeLang,
  journey,
}: {
  landing: LearningLandingCopy;
  copy: LearningPathwayCopy;
  routeLang: SupportedLang;
  journey: LearningJourneyKey;
}) {
  const c = copy.bridge;
  const next = LEARNING_NEXT_JOURNEY[journey];
  const item = c.next[journey];
  const others = LEARNING_JOURNEY_KEYS.filter((k) => k !== journey && k !== next);
  return (
    <section id={LEARNING_ANCHORS.bridge} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 py-12 sm:py-14`} aria-labelledby="aprender-bridge-title">
      <div className={LEARNING_CONTAINER}>
        <div className={`grid overflow-hidden rounded-2xl border-2 bg-[#FFFDF7] shadow-[0_14px_36px_-22px_rgba(31,36,28,0.3)] md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] ${JOURNEY_ACCENT[next ?? journey].border}`}>
          <JourneyVignette journey={next ?? journey} className="block h-auto max-h-44 w-full md:h-full md:max-h-none" />
          <div className="p-5 sm:p-7">
            <p className={LEARNING_EYEBROW}>{c.eyebrow}</p>
            <h2 id="aprender-bridge-title" className={`mt-1 font-serif text-2xl font-bold leading-snug ${JOURNEY_ACCENT[next ?? journey].ink}`}>
              {item.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{item.body}</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]">{c.continuity}</p>
            <Link href={next ? buildJourneyHref(next, routeLang) : landingHref(routeLang, LEARNING_ANCHORS.journeys)} className={`mt-5 ${LEARNING_BTN_PRIMARY}`}>
              {item.cta}
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#5C5346]">
          <span className="font-semibold">{c.switchLabel}</span>
          {others.map((k) => (
            <Link key={k} href={buildJourneyHref(k, routeLang)} className={LEARNING_LINK}>
              {landing.journeys.items[k].title}
            </Link>
          ))}
          {next ? (
            <Link href={landingHref(routeLang, LEARNING_ANCHORS.journeys)} className={LEARNING_LINK}>
              {c.allPaths}
            </Link>
          ) : null}
        </p>
      </div>
    </section>
  );
}
