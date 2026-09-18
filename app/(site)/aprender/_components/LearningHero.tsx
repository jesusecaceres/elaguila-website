import { FiArrowDown, FiHelpCircle } from "react-icons/fi";
import type { LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS } from "../learningJourneys";
import { HeroRoadmapVignette } from "./learningGlyphs";
import { LEARNING_BTN_OUTLINE, LEARNING_BTN_PRIMARY, LEARNING_CONTAINER, LEARNING_EYEBROW_BURGUNDY } from "./learningUi";

/**
 * Gate L1B / G1 — compact flagship hero. Server component, no motion: critical text is in the
 * first paint and never starts at opacity 0. The landing is a checkpoint, so the hero stays short:
 * both CTAs lead to the doors (or to the "not sure" helper) and the trust marks live in their own
 * strip below the journey cards. On phones the vignette collapses to a short strip so the journey
 * cards arrive within the first screen and a half.
 */
export function LearningHero({ copy }: { copy: LearningLandingCopy }) {
  const hero = copy.hero;
  return (
    <section className="relative" aria-labelledby="aprender-hero-title">
      {/* Top padding clears the fixed site header (≈49 px on phones, ≈57 px on desktop) with margin to spare. */}
      <div className={`${LEARNING_CONTAINER} pb-8 pt-20 sm:pt-24 lg:pb-10 lg:pt-[5.5rem]`}>
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
          <div>
            <p className={LEARNING_EYEBROW_BURGUNDY}>{hero.eyebrow}</p>
            <h1
              id="aprender-hero-title"
              className="mt-3 max-w-xl font-serif text-[2.25rem] font-bold leading-[1.08] tracking-tight text-[#2A4536] sm:text-5xl lg:text-[3.25rem]"
            >
              {hero.title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#3D3428] sm:text-lg">{hero.support}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={`#${LEARNING_ANCHORS.journeys}`} className={LEARNING_BTN_PRIMARY}>
                {hero.ctaPrimary}
                <FiArrowDown className="h-4 w-4" aria-hidden />
              </a>
              <a href={`#${LEARNING_ANCHORS.helper}`} className={LEARNING_BTN_OUTLINE}>
                <FiHelpCircle className="h-4 w-4" aria-hidden />
                {hero.ctaSecondary}
              </a>
            </div>
          </div>

          <figure className="min-w-0">
            <HeroRoadmapVignette className="mx-auto h-auto w-full max-h-36 lg:max-h-72" />
            <figcaption className="mt-2 flex items-center justify-between text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#556B3E]">
              {hero.vignetteStages.map((stage, i) => (
                <span key={stage} className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C9A84A]" aria-hidden />
                  {stage}
                  {i < hero.vignetteStages.length - 1 ? <span className="sr-only">→</span> : null}
                </span>
              ))}
              <span className="sr-only">{hero.vignetteLabel}</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
