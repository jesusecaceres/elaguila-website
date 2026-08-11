import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import type { DigitalContactProfile, DigitalContactSocialLink } from "@/app/lib/digitalContact/digitalContactTypes";
import { LEONIX_OFFICIAL_SOCIAL_LINKS } from "@/app/lib/digitalContact/digitalContactSocialLinks";

type Props = {
  profile: DigitalContactProfile;
  copy: DigitalContactCopy;
};

type PlatformId = DigitalContactSocialLink["id"];

function PlatformIcon({ id }: { id: PlatformId }) {
  const paths: Record<PlatformId, string> = {
    facebook: "M14 21v-7h2.4l.4-3H14V9c0-.9.2-1.5 1.6-1.5H17V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V11H8v3h2.6v7Z",
    instagram:
      "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5ZM17.2 6.3a.9.9 0 1 0 .9.9.9.9 0 0 0-.9-.9Z",
    tiktok:
      "M14 3h2.4c.3 1.7 1.4 3 3.1 3.4V9c-1.2 0-2.3-.4-3.1-1v6.4A5.6 5.6 0 1 1 11 8.9v2.6a3 3 0 1 0 2.4 2.9V3Z",
    youtube:
      "M21.6 8.2a2.9 2.9 0 0 0-2-2C17.9 5.7 12 5.7 12 5.7s-5.9 0-7.6.5a2.9 2.9 0 0 0-2 2A30 30 0 0 0 2 12a30 30 0 0 0 .4 3.8 2.9 2.9 0 0 0 2 2c1.7.5 7.6.5 7.6.5s5.9 0 7.6-.5a2.9 2.9 0 0 0 2-2A30 30 0 0 0 22 12a30 30 0 0 0-.4-3.8ZM10 15V9l5.2 3Z",
    x: "M4 4l7.3 8.7L4.4 20h2.3l6-6.8 4.6 6.8H21l-7.6-9.1L20 4h-2.3l-5.6 6.3L7.7 4Z",
    linkedin:
      "M6.9 8.5H4V19h2.9Zm-1.4-4A1.7 1.7 0 1 0 5.5 8 1.7 1.7 0 0 0 5.5 4.5ZM9 8.5V19h2.9v-5.6c0-1.5.6-2.5 1.9-2.5 1.2 0 1.7.9 1.7 2.5V19H18v-6.1c0-3-1.6-4.4-3.7-4.4a3.2 3.2 0 0 0-2.9 1.6V8.5Z",
    threads:
      "M12 3c-4.4 0-7.6 2.7-7.9 7-.3 4.6 2.6 8.4 6.7 8.9 3.5.4 6.6-1.2 7.7-4.3.6-1.6.4-3.3-.8-4.4-1-.9-2.4-1.1-3.7-.8.1-1-.3-1.9-1.3-2.3-1.1-.4-2.4 0-3 1",
  };

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d={paths[id]} />
    </svg>
  );
}

const ACTIVE_LABELS: Record<"facebook" | "instagram" | "tiktok" | "youtube", string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

/** Gate 6 names exactly these four platforms as premium cards — X/Twitter is intentionally out of scope here. */
const ACTIVE_ORDER: Array<"facebook" | "instagram" | "tiktok" | "youtube"> = [
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
];

/**
 * Gate 6 — premium social cards, not a tiny icon row. Facebook/Instagram/TikTok/YouTube
 * are Leonix Media's own official brand accounts (`LEONIX_OFFICIAL_SOCIAL_LINKS`), so
 * they always render; a profile's own `socials` entry (if ever set) takes precedence
 * per-platform. LinkedIn and Threads always render as muted "coming soon" placeholders,
 * so the section never looks empty while nothing is faked.
 */
export function DigitalContactSocialCards({ profile, copy }: Props) {
  const bySlug = new Map(profile.socials.map((s) => [s.id, s.url] as const));
  const urlFor = (id: (typeof ACTIVE_ORDER)[number]) => bySlug.get(id) || LEONIX_OFFICIAL_SOCIAL_LINKS[id];
  const activeCards = ACTIVE_ORDER.filter((id) => urlFor(id));

  return (
    <section aria-labelledby="dc-social-title" className="mx-auto w-full max-w-2xl px-5 pt-12 sm:px-6 sm:pt-14">
      <div className="text-center">
        <h2 id="dc-social-title" className="font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
          {copy.socialTitle}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#3D3428]">{copy.socialSubtitle}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {activeCards.map((id) => (
          <a
            key={id}
            href={urlFor(id)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--dc-accent)] hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dc-button-primary)] text-[#FFFCF7]">
              <PlatformIcon id={id} />
            </span>
            <span className="text-sm font-bold text-[#1F241C]">{ACTIVE_LABELS[id]}</span>
          </a>
        ))}

        {(["linkedin", "threads"] as const).map((id) => (
          <div
            key={id}
            aria-disabled
            className="flex items-center gap-3 rounded-2xl border border-dashed border-[#D6C7AD] bg-[#FBF7EF]/60 px-4 py-3.5 opacity-70"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8DCC5] text-[#8A8172]">
              <PlatformIcon id={id} />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-bold capitalize text-[#5F6258]">{id}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#9A7B28]">{copy.comingSoonLabel}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
