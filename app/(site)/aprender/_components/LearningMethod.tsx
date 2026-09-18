import type { LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS } from "../learningJourneys";
import { METHOD_GLYPHS } from "./learningGlyphs";
import { LEARNING_CONTAINER, LEARNING_EYEBROW, LEARNING_H2, LEARNING_INTRO, LEARNING_SECTION } from "./learningUi";

/**
 * Gate L1H — "Así se aprende en Leonix": five-step learn-by-doing model. Horizontal from `lg`,
 * vertical below (a connector rail carries the sequence in both layouts).
 */
export function LearningMethod({ copy }: { copy: LearningLandingCopy }) {
  const c = copy.method;
  return (
    <section id={LEARNING_ANCHORS.method} className={`${LEARNING_SECTION} border-t border-[#D6C7AD]/70 bg-[#FFFDF7]/60 py-12 sm:py-14`} aria-labelledby="aprender-method-title">
      <div className={LEARNING_CONTAINER}>
        <p className={LEARNING_EYEBROW}>{c.eyebrow}</p>
        <h2 id="aprender-method-title" className={LEARNING_H2}>
          {c.title}
        </h2>
        <p className={LEARNING_INTRO}>{c.intro}</p>

        <ol className="relative mt-10 grid gap-6 lg:grid-cols-5 lg:gap-4">
          <div className="pointer-events-none absolute left-[1.375rem] top-2 h-[calc(100%-1rem)] w-0.5 bg-[#2A4536]/30 lg:left-0 lg:top-[1.375rem] lg:h-0.5 lg:w-full" aria-hidden />
          {c.steps.map((step, i) => {
            const Glyph = METHOD_GLYPHS[i];
            return (
              <li key={step.title} className="relative flex gap-4 lg:flex-col lg:gap-3">
                <span className="relative z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] text-[#2A4536]" aria-hidden>
                  <Glyph className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-0.5 font-serif text-xl font-bold leading-tight text-[#2A4536]">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#3D3428]">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
