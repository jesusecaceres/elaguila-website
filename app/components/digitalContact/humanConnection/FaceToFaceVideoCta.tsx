"use client";

import { openExternalUrl } from "@/app/components/cta/ctaLaunchers";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";
import {
  getFaceToFaceCopy,
  providerOpensLabel,
  videoRoomHintForProvider,
} from "@/app/lib/digitalContact/humanConnection/faceToFaceCopy";
import type {
  FaceToFaceVideoOption,
  PreferredFaceToFaceResult,
} from "@/app/lib/digitalContact/humanConnection/resolvePreferredFaceToFaceConnection";
import type { DigitalContactLang } from "@/app/lib/digitalContact/digitalContactTypes";

type Props = {
  faceToFace: PreferredFaceToFaceResult;
  lang: DigitalContactLang;
  source?: string | null;
  /** Larger doorbell treatment for /visitanos primary. */
  variant?: "doorbell" | "compact";
};

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "h-7 w-7"} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h7A2.5 2.5 0 0 1 16 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 16.5v-9ZM17 9.5l3-2v9l-3-2v-5Z"
      />
    </svg>
  );
}

function launchOption(
  option: FaceToFaceVideoOption,
  slug: string,
  lang: DigitalContactLang,
  source: string | null | undefined,
) {
  trackDigitalContactEvent(slug, "face_to_face_cta_selected", {
    surface: "virtual_front_desk",
    lang,
    channel: option.provider,
    capability: option.capability,
    ...(source ? { source } : {}),
  });
  openExternalUrl(option.url);
}

/**
 * Dominant face-to-face video-room CTA. Hidden entirely when no approved destination.
 * Does not claim ringing, answering, or connected state.
 */
export function FaceToFaceVideoCta({ faceToFace, lang, source = null, variant = "doorbell" }: Props) {
  if (!faceToFace.primary) return null;
  const copy = getFaceToFaceCopy(lang);
  const primary = faceToFace.primary;
  const platformLabel = providerOpensLabel(primary.provider, lang);
  const roomLabel =
    primary.provider === "google_meet"
      ? "Google Meet"
      : primary.provider === "teams"
        ? "Microsoft Teams"
        : "FaceTime";

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => launchOption(primary, faceToFace.slug, lang, source)}
        aria-label={`${copy.videoRoomCta} — ${roomLabel}`}
        className={
          variant === "doorbell"
            ? "flex min-h-[72px] w-full flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--dc-button-primary)] px-5 py-4 text-[#FFFDF7] shadow-md transition hover:bg-[var(--dc-button-hover)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2"
            : "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--dc-button-primary)] px-4 py-3 text-sm font-bold text-[#FFFDF7] transition hover:bg-[var(--dc-button-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2"
        }
      >
        <span className="flex items-center gap-2.5">
          <VideoIcon className={variant === "doorbell" ? "h-7 w-7" : "h-5 w-5"} />
          <span className={variant === "doorbell" ? "text-lg font-bold tracking-tight sm:text-xl" : undefined}>
            {copy.videoRoomCta}
          </span>
        </span>
        {variant === "doorbell" ? (
          <span className="text-sm font-medium text-[#FFFDF7]/90">{roomLabel}</span>
        ) : null}
      </button>
      <p className="text-center text-xs leading-relaxed text-[#5F6258]">
        {videoRoomHintForProvider(primary.provider, lang)}
      </p>
      <p className="sr-only">{platformLabel}</p>

      {faceToFace.secondary.map((opt) => {
        const secondaryRoom =
          opt.provider === "google_meet"
            ? "Google Meet"
            : opt.provider === "teams"
              ? "Microsoft Teams"
              : "FaceTime";
        return (
          <button
            key={opt.provider}
            type="button"
            onClick={() => launchOption(opt, faceToFace.slug, lang, source)}
            aria-label={`${copy.videoRoomCta} — ${secondaryRoom}`}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#D6C7AD] bg-[#FBF7EF] px-4 py-2.5 text-sm font-bold text-[#1F241C] transition hover:border-[var(--dc-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)]"
          >
            <VideoIcon className="h-5 w-5" />
            <span>{providerOpensLabel(opt.provider, lang)}</span>
          </button>
        );
      })}
    </div>
  );
}
