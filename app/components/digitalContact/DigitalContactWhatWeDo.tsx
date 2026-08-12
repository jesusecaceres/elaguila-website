import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";

type Props = {
  copy: DigitalContactCopy;
};

/** Gate 3 — premium bilingual "What We Do" statement. Fixed Leonix Media messaging, toggled with the page's lang switch like every other prose section. */
export function DigitalContactWhatWeDo({ copy }: Props) {
  return (
    <section aria-labelledby="dc-what-we-do-title" className="mx-auto w-full max-w-2xl px-5 pt-12 sm:px-6 sm:pt-14">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A7B28]">{copy.whatWeDoKicker}</p>
        <h2 id="dc-what-we-do-title" className="mt-1 font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
          {copy.whatWeDoTitle}
        </h2>
      </div>

      <div className="mx-auto mt-6 rounded-3xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-sm sm:p-8">
        <p className="text-center text-sm leading-relaxed text-[#3D3428] sm:text-base">{copy.whatWeDoBody}</p>

        <div className="mx-auto mt-6 max-w-sm border-t border-[#E8DCC5] pt-5 text-center">
          <p className="text-sm font-medium leading-relaxed text-[#8A8172] line-through decoration-1">
            {copy.whatWeDoClosing1}
          </p>
          <p className="mt-1.5 font-serif text-lg font-bold leading-snug text-[var(--dc-primary)] sm:text-xl">
            {copy.whatWeDoClosing2}
          </p>
        </div>
      </div>
    </section>
  );
}
