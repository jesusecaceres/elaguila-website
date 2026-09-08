"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { getDigitalContactProfile } from "@/app/lib/digitalContact/digitalContactRegistry";
import type { DigitalContactLang, DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";
import {
  resolveExecutivePublicAvailability,
  type ExecutivePublicAvailabilityView,
} from "@/app/lib/digitalContact/resolveExecutivePublicAvailability";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";

type Props = {
  profile: DigitalContactProfile;
  lang: DigitalContactLang;
  copy: DigitalContactCopy;
};

function statusLine(view: ExecutivePublicAvailabilityView, copy: DigitalContactCopy): string | null {
  switch (view.publicAvailabilityState) {
    case "available":
      return copy.availAvailable;
    case "busy":
      return copy.availBusy;
    case "away":
      return copy.availAway;
    case "absent":
      return view.publicAbsenceMessage || copy.availAbsentFallback;
    case "within_hours":
      return view.showWorkingHours ? copy.availWithinHours : null;
    case "outside_hours":
      return view.showWorkingHours ? copy.availOutsideHours : null;
    default:
      return null;
  }
}

/**
 * Compact executive routing context from the central ECP resolver.
 * Renders nothing when state is unknown/inactive — preserves pre-Build-03 contact UX.
 */
export function DigitalContactAvailabilityNote({ profile, lang, copy }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const view = useMemo(() => {
    if (!now) return null;
    try {
      return resolveExecutivePublicAvailability({
        profile,
        now,
        lang,
        lookupProfile: getDigitalContactProfile,
      });
    } catch {
      return null;
    }
  }, [profile, now, lang]);

  if (!view) return null;

  const line = statusLine(view, copy);
  const backup =
    view.backupSlug &&
    (view.publicAvailabilityState === "absent" ||
      view.publicAvailabilityState === "busy" ||
      view.publicAvailabilityState === "away")
      ? getDigitalContactProfile(view.backupSlug)
      : null;

  if (!line && !backup) return null;

  const backupHref = backup ? `/contact/${encodeURIComponent(backup.slug)}?lang=${lang}` : null;

  return (
    <section
      aria-label={copy.availContactHoursLabel}
      className="mx-auto w-full max-w-2xl px-5 pt-6 sm:px-6"
      aria-live="polite"
    >
      <div className="rounded-2xl border border-[#D6C7AD]/80 bg-[#FFFDF7] px-4 py-3.5 text-center shadow-sm sm:px-5">
        {line ? <p className="text-sm font-semibold leading-snug text-[#1F241C]">{line}</p> : null}
        {backup && backupHref ? (
          <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">
            {copy.availBackupCta}{" "}
            <Link
              href={backupHref}
              onClick={() =>
                trackDigitalContactEvent(profile.slug, "showcase_click", {
                  action: "backup_profile_click",
                  backupSlug: backup.slug,
                })
              }
              className="font-bold text-[var(--dc-button-primary)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dc-accent)] focus-visible:ring-offset-2"
            >
              {backup.preferredName || backup.fullName}
            </Link>
            .
          </p>
        ) : null}
      </div>
    </section>
  );
}
