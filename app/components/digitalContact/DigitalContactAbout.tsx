import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import type { DigitalContactLang, DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";
import { bioParagraphLines, parseBilingualBio } from "@/app/lib/digitalContact/digitalContactBilingualText";

type Props = {
  profile: DigitalContactProfile;
  lang: DigitalContactLang;
  copy: DigitalContactCopy;
};

/**
 * Gate 4 — premium "Meet {name}" section. Reads the real, admin-populated biography;
 * renders nothing when no bio exists yet rather than showing placeholder/resume-style copy.
 */
export function DigitalContactAbout({ profile, lang, copy }: Props) {
  const bilingual = parseBilingualBio(profile.bio);
  const paragraph = lang === "en" ? bilingual.en ?? bilingual.es : bilingual.es ?? bilingual.en;
  const lines = bioParagraphLines(paragraph);
  if (lines.length === 0) return null;

  const [lead, ...rest] = lines;
  const displayName = profile.preferredName || profile.fullName;

  return (
    <section aria-labelledby="dc-about-title" className="mx-auto w-full max-w-2xl px-5 pt-12 sm:px-6 sm:pt-14">
      <div className="rounded-3xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-sm sm:p-8">
        <h2 id="dc-about-title" className="text-center font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
          {copy.aboutTitlePrefix} {displayName}
        </h2>
        <div className="mx-auto mt-5 max-w-xl space-y-3.5">
          <p className="text-center text-base font-semibold italic leading-relaxed text-[var(--dc-primary)] sm:text-lg">
            {lead}
          </p>
          {rest.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed text-[#3D3428] sm:text-base">
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
