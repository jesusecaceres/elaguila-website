import Image from "next/image";
import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";
import { splitBilingualTitle } from "@/app/lib/digitalContact/digitalContactBilingualText";

type Props = {
  profile: DigitalContactProfile;
  copy: DigitalContactCopy;
};

/**
 * Decorative, theme-tinted skyline silhouette — pure CSS/SVG shapes (no photography, no
 * AI imagery). Renders only when the executive has no `coverPath` yet, so every profile
 * looks premium and finished on day one; swapping in a real cover photo later requires
 * no component changes.
 */
function HeroSkylineBackdrop() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 120"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-[0.14] sm:h-28"
      fill="currentColor"
    >
      <rect x="0" y="55" width="34" height="65" />
      <rect x="38" y="30" width="26" height="90" />
      <rect x="68" y="68" width="30" height="52" />
      <rect x="102" y="18" width="22" height="102" />
      <rect x="128" y="46" width="34" height="74" />
      <rect x="166" y="60" width="24" height="60" />
      <rect x="194" y="8" width="20" height="112" />
      <rect x="218" y="42" width="30" height="78" />
      <rect x="252" y="64" width="26" height="56" />
      <rect x="282" y="26" width="22" height="94" />
      <rect x="308" y="50" width="32" height="70" />
      <rect x="344" y="70" width="24" height="50" />
      <rect x="372" y="36" width="28" height="84" />
    </svg>
  );
}

/**
 * Executive hero content — official Leonix banner + crest, name, bilingual title, mission,
 * minimal identity chrome.
 * Photo architecture: falls back to the Leonix crest when `photoPath` is absent (never a placeholder).
 * Cover architecture: falls back to a theme-tinted skyline silhouette over the existing gradient
 * system when `coverPath` is absent — never a fake AI portrait or stock photo.
 *
 * Renders no background of its own — `DigitalContactPageClient` wraps this together with the
 * Executive Card inside one continuous gradient so the brand-to-cream fade only completes
 * after the card, never a hard stop mid-hero. All brand color here comes from the
 * `--dc-*` Executive Theme variables set at the page root — this component is theme-agnostic
 * and renders correctly for any future executive profile.
 *
 * Reading order follows a rule-of-thirds flow: Leonix mark → executive avatar → name → title →
 * mission → company, each step given just enough room to breathe without empty burgundy gaps.
 */
export function DigitalContactHero({ profile, copy }: Props) {
  const { primary: titlePrimary, secondary: titleSecondary } = splitBilingualTitle(profile.title);

  return (
    <header className="relative mx-auto flex max-w-2xl flex-col items-center overflow-hidden px-5 pb-5 pt-6 text-center sm:px-6 sm:pt-8">
      {profile.coverPath ? (
        <>
          <Image
            src={profile.coverPath}
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 100vw, 672px"
            className="object-cover opacity-25"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        </>
      ) : (
        <div className="text-[var(--dc-accent)]">
          <HeroSkylineBackdrop />
        </div>
      )}

      <div className="relative h-12 w-full max-w-[220px] sm:h-[4rem] sm:max-w-[270px]">
        <Image
          src="/title_banner_leonix.png"
          alt="Leonix Media"
          fill
          priority
          sizes="(max-width: 640px) 220px, 270px"
          className="object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
        />
      </div>

      <p className="relative mt-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--dc-accent)]">
        {copy.heroKicker}
      </p>

      <div className="relative mt-4 h-32 w-32 shrink-0 sm:mt-5 sm:h-36 sm:w-36">
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
            sizes="144px"
            className={profile.photoPath ? "object-cover" : "object-contain p-2.5"}
            priority
          />
        </div>
      </div>

      <h1 className="relative mt-4 text-balance font-serif text-[1.85rem] font-bold leading-[1.08] tracking-tight text-[#FFFDF7] sm:text-4xl">
        {profile.fullName}
      </h1>

      <div className="relative mt-2 flex flex-col items-center gap-0.5">
        <p className="text-[1.05rem] font-semibold leading-snug text-[#F3E7D3] sm:text-lg">{titlePrimary}</p>
        {titleSecondary ? (
          <p className="text-sm font-medium leading-snug text-[#F3E7D3]/80 sm:text-[0.95rem]">{titleSecondary}</p>
        ) : null}
      </div>

      <p className="relative mt-1.5 text-sm font-medium tracking-wide text-[var(--dc-accent)] sm:text-[0.95rem]">
        {profile.company}
      </p>

      <div className="relative mt-4 flex flex-col items-center gap-0.5 border-t border-[var(--dc-accent-border)] pt-4 sm:mt-5">
        <p className="text-[13px] font-semibold italic leading-snug text-[#FFFDF7]/95 sm:text-sm">{copy.missionEn}</p>
        <p className="text-[13px] font-semibold italic leading-snug text-[#FFFDF7]/70 sm:text-sm">{copy.missionEs}</p>
      </div>

      <p className="relative mt-5 max-w-sm text-sm leading-relaxed text-[#F8F4EA]/85">{copy.savePrompt}</p>
    </header>
  );
}
