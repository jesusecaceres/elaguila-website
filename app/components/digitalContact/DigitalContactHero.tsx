import Image from "next/image";
import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";

type Props = {
  profile: DigitalContactProfile;
  copy: DigitalContactCopy;
};

/**
 * Executive hero — official Leonix banner + crest, name, title, minimal trust chips.
 * Photo architecture: falls back to the Leonix crest when `photoPath` is absent (never a placeholder).
 */
export function DigitalContactHero({ profile, copy }: Props) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-[#7A1E2C] via-[#6B1A26] to-[#F8F4EA] pb-10 pt-8 sm:pb-14 sm:pt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(201,168,74,0.18),transparent_60%)]"
      />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-5 text-center sm:px-6">
        <div className="relative h-16 w-full max-w-[280px] sm:h-20 sm:max-w-[340px]">
          <Image
            src="/title_banner_leonix.png"
            alt="Leonix Media"
            fill
            priority
            sizes="(max-width: 640px) 280px, 340px"
            className="object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
          />
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#E8DCC5]">{copy.heroKicker}</p>

        <div className="relative mt-5 h-28 w-28 shrink-0 sm:h-32 sm:w-32">
          <div className="absolute inset-0 rounded-full bg-[#FFFDF7] shadow-[0_8px_30px_-6px_rgba(0,0,0,0.45)]" />
          <div className="absolute inset-[3px] overflow-hidden rounded-full border border-[#C9A84A]/60">
            <Image
              src={profile.photoPath ?? "/logo-clean.png"}
              alt={profile.fullName}
              fill
              sizes="128px"
              className={profile.photoPath ? "object-cover" : "object-contain p-2"}
              priority
            />
          </div>
        </div>

        <h1 className="mt-5 font-serif text-3xl font-bold tracking-tight text-[#FFFDF7] sm:text-4xl">
          {profile.fullName}
        </h1>
        <p className="mt-1.5 text-base font-semibold text-[#E8DCC5] sm:text-lg">{profile.title}</p>
        <p className="text-sm font-medium text-[#C9A84A] sm:text-[0.95rem]">{profile.company}</p>

        {profile.trustChips.length > 0 ? (
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label={copy.heroKicker}>
            {profile.trustChips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-[#C9A84A]/50 bg-[#FFFDF7]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#FFFDF7] backdrop-blur-sm"
              >
                {chip}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#F8F4EA]/90">{copy.savePrompt}</p>
      </div>
    </header>
  );
}
