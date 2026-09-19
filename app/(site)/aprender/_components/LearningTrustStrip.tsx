import type { LearningLandingCopy } from "../learningCopy";
import { TRUST_GLYPHS } from "./learningGlyphs";
import { LEARNING_CONTAINER } from "./learningUi";

/**
 * Gate G1 — compact trust strip: the four approved trust marks (bilingual · practical · at your
 * pace · no cost) on one line under the journey doors. Text carries the meaning; glyphs are decorative.
 */
export function LearningTrustStrip({ copy }: { copy: LearningLandingCopy }) {
  const hero = copy.hero;
  return (
    <section className="border-t border-[#D6C7AD]/70 bg-[#FFFDF7]/60 py-5" aria-label={hero.trustLabel}>
      <div className={LEARNING_CONTAINER}>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm font-semibold text-[#2A4536] sm:flex sm:flex-wrap sm:justify-center sm:gap-x-10">
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
    </section>
  );
}
