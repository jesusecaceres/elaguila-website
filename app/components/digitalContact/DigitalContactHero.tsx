import Image from "next/image";
import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";

type Props = {
  profile: DigitalContactProfile;
  copy: DigitalContactCopy;
};

/**
 * Executive hero content — official Leonix banner + crest, name, title, minimal trust chips.
 * Photo architecture: falls back to the Leonix crest when `photoPath` is absent (never a placeholder).
 *
 * Renders no background of its own — `DigitalContactPageClient` wraps this together with the
 * Executive Card inside one continuous gradient so the brand-to-cream fade only completes
 * after the card, never a hard stop mid-hero (Gate 2). All brand color here comes from the
 * `--dc-*` Executive Theme variables set at the page root — this component is theme-agnostic
 * and renders correctly for any future executive profile.
 *
 * Reading order follows a rule-of-thirds flow: Leonix mark → executive avatar → name → title →
 * company → contact card, each step given just enough room to breathe without empty burgundy gaps.
 */
export function DigitalContactHero({ profile, copy }: Props) {
  return (
    <header className="relative mx-auto flex max-w-2xl flex-col items-center px-5 pb-4 pt-7 text-center sm:px-6 sm:pt-9">
      <div className="relative h-14 w-full max-w-[248px] sm:h-[4.5rem] sm:max-w-[300px]">
        <Image
          src="/title_banner_leonix.png"
          alt="Leonix Media"
          fill
          priority
          sizes="(max-width: 640px) 248px, 300px"
          className="object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
        />
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--dc-accent)] sm:mt-5">
        {copy.heroKicker}
      </p>

      <div className="relative mt-4 h-36 w-36 shrink-0 sm:mt-5 sm:h-40 sm:w-40">
        <div
          className="absolute -inset-1.5 rounded-full bg-[radial-gradient(circle,var(--dc-glow),transparent_72%)] opacity-70 blur-md"
          aria-hidden
        />
        <div className="absolute inset-0 rounded-full bg-[#FFFDF7] shadow-[0_10px_34px_-8px_rgba(0,0,0,0.5)]" />
        <div className="absolute inset-[3px] overflow-hidden rounded-full border border-[var(--dc-accent-border)]">
          <Image
            src={profile.photoPath ?? "/logo-clean.png"}
            alt={profile.fullName}
            fill
            sizes="160px"
            className={profile.photoPath ? "object-cover" : "object-contain p-2.5"}
            priority
          />
        </div>
      </div>

      <h1 className="mt-5 text-balance font-serif text-[1.85rem] font-bold leading-[1.08] tracking-tight text-[#FFFDF7] sm:text-4xl">
        {profile.fullName}
      </h1>
      <p className="mt-2 text-[1.05rem] font-semibold leading-snug text-[#F3E7D3] sm:text-lg">{profile.title}</p>
      <p className="mt-0.5 text-sm font-medium tracking-wide text-[var(--dc-accent)] sm:text-[0.95rem]">
        {profile.company}
      </p>

      {profile.trustChips.length > 0 ? (
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-5" aria-label={copy.heroKicker}>
          {profile.trustChips.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#FFFDF7] backdrop-blur-sm"
            >
              {chip}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#F8F4EA]/85 sm:mt-6">{copy.savePrompt}</p>
    </header>
  );
}
