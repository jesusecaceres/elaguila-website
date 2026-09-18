import Link from "next/link";
import { FiArrowLeft, FiArrowRight, FiClock } from "react-icons/fi";
import type { SupportedLang } from "@/app/lib/language";
import type { LearningLesson } from "@/app/lib/business/learning/types";
import type { LearningJourneyKey, LearningLandingCopy } from "../learningCopy";
import type { LearningPathwayCopy } from "../learningPathwayCopy";
import { LEARNING_ANCHORS, landingHref, lessonHref, totalMinutes } from "../learningJourneys";
import { JOURNEY_ACCENT, JourneyVignette } from "./learningGlyphs";
import { LEARNING_BTN_OUTLINE, LEARNING_BTN_PRIMARY, LEARNING_CONTAINER, LEARNING_EYEBROW_BURGUNDY, LEARNING_LINK, lessonsCountLabel } from "./learningUi";

/**
 * Gate G1 — pathway hero. Reuses the approved journey vignette, accent and copy (title, empathy,
 * outcome) from the landing door, adds the journey goal, and offers the first published lesson.
 * Server component, no motion. Counts/minutes come only from published lessons.
 */
export function LearningPathwayHero({
  landing,
  copy,
  chrome,
  routeLang,
  journey,
  lessons,
}: {
  landing: LearningLandingCopy;
  copy: LearningPathwayCopy;
  chrome: { lessonSingular: string; lessonPlural: string; minutesLabel: string };
  routeLang: SupportedLang;
  journey: LearningJourneyKey;
  lessons: LearningLesson[];
}) {
  const item = landing.journeys.items[journey];
  const accent = JOURNEY_ACCENT[journey];
  const first = lessons[0] ?? null;
  return (
    <section className="relative" aria-labelledby="aprender-pathway-title">
      {/* Top padding clears the fixed site header, same as the landing hero. */}
      <div className={`${LEARNING_CONTAINER} pb-10 pt-20 sm:pt-24 lg:pb-12 lg:pt-[5.5rem]`}>
        <Link href={landingHref(routeLang, LEARNING_ANCHORS.journeys)} className={LEARNING_LINK}>
          <FiArrowLeft className="h-4 w-4" aria-hidden />
          {copy.hero.back}
        </Link>

        <div className="mt-3 grid items-center gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-14">
          <div>
            <p className={LEARNING_EYEBROW_BURGUNDY}>{copy.hero.eyebrow}</p>
            <h1 id="aprender-pathway-title" className={`mt-3 font-serif text-[2.25rem] font-bold leading-[1.08] tracking-tight sm:text-5xl ${accent.ink}`}>
              {item.title}
            </h1>
            <p className="mt-3 max-w-xl font-serif text-xl italic leading-snug text-[#3D3428]">{item.empathy}</p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#3D3428]">{copy.hero.goals[journey]}</p>

            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {first ? (
                <Link href={lessonHref(first.lessonKey, routeLang, journey)} className={LEARNING_BTN_PRIMARY}>
                  {copy.hero.startFirst}
                  <FiArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
              <a href={`#${LEARNING_ANCHORS.spine}`} className={LEARNING_BTN_OUTLINE}>
                {copy.spine.title}
              </a>
              <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${accent.chip}`}>
                {lessons.length > 0 ? (
                  <>
                    <span>{lessonsCountLabel(lessons.length, chrome.lessonSingular, chrome.lessonPlural)}</span>
                    <span aria-hidden>·</span>
                    <FiClock className="h-3.5 w-3.5" aria-hidden />
                    <span>
                      {totalMinutes(lessons)} {chrome.minutesLabel}
                    </span>
                  </>
                ) : (
                  <span>{copy.spine.inPreparation}</span>
                )}
              </p>
            </div>
          </div>

          <figure className={`min-w-0 overflow-hidden rounded-2xl border-2 ${accent.border}`}>
            <JourneyVignette journey={journey} className="block h-auto max-h-40 w-full lg:max-h-none" />
          </figure>
        </div>
      </div>
    </section>
  );
}
