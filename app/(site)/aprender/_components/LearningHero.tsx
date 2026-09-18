import { FiArrowDown, FiArrowRight } from "react-icons/fi";
import type { LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS } from "../learningJourneys";
import { HeroRoadmapVignette, TRUST_GLYPHS } from "./learningGlyphs";
import { LEARNING_BTN_OUTLINE, LEARNING_BTN_PRIMARY, LEARNING_CONTAINER, LEARNING_EYEBROW_BURGUNDY } from "./learningUi";

/**
 * Gate L1B — flagship hero. Server component, no motion: critical text is in the first paint and
 * never starts at opacity 0. Desktop stays around 55vh; on phones the vignette collapses to a
 * short strip so the journey cards arrive within the first screen and a half.
 */
export function LearningHero({ copy }: { copy: LearningLandingCopy }) {
  const hero = copy.hero;
  return (
    <section className="relative" aria-labelledby="aprender-hero-title">
      {/* Top padding clears the fixed site header (≈49 px on phones, ≈57 px on desktop) with margin to spare. */}
      <div className={`${LEARNING_CONTAINER} pb-10 pt-20 sm:pt-24 lg:pb-12 lg:pt-[5.5rem]`}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
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
              <a href={`#${LEARNING_ANCHORS.topics}`} className={LEARNING_BTN_OUTLINE}>
                {hero.ctaSecondary}
                <FiArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-sm font-semibold text-[#2A4536] sm:flex sm:flex-wrap sm:gap-x-7" aria-label={hero.eyebrow}>
              {hero.trust.map((label, i) => {
                const Glyph = TRUST_GLYPHS[i];
                return (
                  <li key={label} className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9A84A]/60 bg-[#FFFDF7] text-[#7A1E2C]" aria-hidden>
                      <Glyph className="h-4 w-4" />
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>
          </div>

          <figure className="min-w-0">
            <HeroRoadmapVignette className="mx-auto h-auto w-full max-h-36 lg:max-h-none" />
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
