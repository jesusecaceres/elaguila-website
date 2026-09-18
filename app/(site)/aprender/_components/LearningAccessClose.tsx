import { FiArrowUp } from "react-icons/fi";
import type { LearningLandingCopy } from "../learningCopy";
import { LEARNING_ANCHORS } from "../learningJourneys";
import { LEARNING_CONTAINER } from "./learningUi";

/**
 * Gate L1I — restrained access/trust close in the Leonix deep-green band style. No partner, no
 * sponsor, no human-help promise: only the access message and the professional boundary.
 */
export function LearningAccessClose({ copy }: { copy: LearningLandingCopy }) {
  const c = copy.close;
  return (
    <section className="py-12 sm:py-16" aria-labelledby="aprender-close-title">
      <div className={LEARNING_CONTAINER}>
        <div className="overflow-hidden rounded-2xl border border-[#2A4536]/20 bg-[#2A4536] p-6 shadow-[0_20px_48px_-24px_rgba(31,36,28,0.55)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#C9A84A]">{c.trustLine}</p>
              <h2 id="aprender-close-title" className="mt-3 max-w-2xl font-serif text-2xl font-bold leading-snug text-[#F8F4EA] sm:text-[1.9rem]">
                {c.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#EDE6D6] sm:text-base">{c.support}</p>
              <a
                href={`#${LEARNING_ANCHORS.journeys}`}
                className="mt-6 inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-full bg-[#7A1E2C] px-7 text-sm font-bold text-white transition hover:bg-[#5e1721] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A] sm:text-[0.9375rem]"
              >
                {c.cta}
                <FiArrowUp className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <p className="border-t border-[#C9A84A]/30 pt-6 text-sm leading-relaxed text-[#F8F4EA]/90 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">{c.boundary}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
