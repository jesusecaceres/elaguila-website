/**
 * Leonix Executive Contact Platform — public availability resolver.
 *
 * Single source of derived availability truth for `/contact/{slug}`, `/visitanos`,
 * and future LEO / scheduling / video consumers.
 *
 * Does NOT own Leonix business office hours (see visitanosOfficeHours.ts).
 * Does NOT invent live "available now" without a fresh temporaryPresence signal.
 */

import { isWithinExecutiveWorkingHours } from "./digitalContactWorkingHours";
import type {
  DigitalContactLang,
  DigitalContactProfile,
  ExecutiveCapabilityFlags,
  ExecutivePublicAvailabilityPolicy,
  ExecutivePublicAvailabilityState,
  ExecutiveTemporaryStatus,
} from "./digitalContactTypes";

export type ExecutivePublicAvailabilityView = {
  slug: string;
  active: boolean;
  publicAvailabilityState: ExecutivePublicAvailabilityState;
  /** null when schedule missing or timezone/hours invalid */
  withinWorkingHours: boolean | null;
  absenceActive: boolean;
  temporaryStatus: ExecutiveTemporaryStatus | null;
  temporaryStatusFresh: boolean;
  /** Validated active backup slug only — one hop; never recursive. */
  backupSlug: string | null;
  showWorkingHours: boolean;
  showAvailability: boolean;
  capabilities: Required<ExecutiveCapabilityFlags>;
  /** Public-safe absence line for the requested lang, when absence is active. */
  publicAbsenceMessage: string | null;
};

export type ResolveExecutivePublicAvailabilityInput = {
  profile: DigitalContactProfile | null | undefined;
  now?: Date;
  lang?: DigitalContactLang;
  /**
   * Lookup for backup validation. Defaults to registry `getDigitalContactProfile`
   * when not provided (lazy require avoided — pass explicitly from call sites that
   * already import the registry, or inject fixtures in tests).
   */
  lookupProfile: (slug: string) => DigitalContactProfile | null;
};

function parseInstant(iso: string | undefined | null): Date | null {
  const raw = String(iso ?? "").trim();
  if (!raw) return null;
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return null;
  return new Date(t);
}

function effectivePolicy(
  profile: DigitalContactProfile,
): Required<Pick<ExecutivePublicAvailabilityPolicy, "showWorkingHours" | "showAvailability">> {
  const p = profile.publicAvailabilityPolicy;
  return {
    showWorkingHours: p?.showWorkingHours !== false && Boolean(profile.workingHours),
    showAvailability: p?.showAvailability === true,
  };
}

function effectiveCapabilities(profile: DigitalContactProfile): Required<ExecutiveCapabilityFlags> {
  return {
    allowScheduling: profile.capabilities?.allowScheduling === true,
    allowVideo: profile.capabilities?.allowVideo === true,
  };
}

function isAbsenceActive(profile: DigitalContactProfile, now: Date): boolean {
  const absence = profile.absence;
  if (!absence || absence.enabled !== true) return false;
  const start = parseInstant(absence.startAt);
  const end = parseInstant(absence.endAt);
  if (!start || !end) return false;
  if (!(end.getTime() > start.getTime())) return false;
  return now.getTime() >= start.getTime() && now.getTime() < end.getTime();
}

function readFreshTemporaryStatus(
  profile: DigitalContactProfile,
  now: Date,
): { status: ExecutiveTemporaryStatus; fresh: boolean } | null {
  const presence = profile.temporaryPresence;
  if (!presence) return null;
  const status = presence.status;
  if (status !== "available" && status !== "busy" && status !== "away") return null;
  const setAt = parseInstant(presence.setAt);
  const expiresAt = parseInstant(presence.expiresAt);
  if (!setAt || !expiresAt) return null;
  if (!(expiresAt.getTime() > setAt.getTime())) return null;
  const fresh = now.getTime() < expiresAt.getTime();
  return { status, fresh };
}

/**
 * Resolve one-hop backup. Rejects self, missing, and inactive (lookup returns null for inactive).
 * Does not follow backup's backup.
 */
export function resolveValidatedBackupSlug(
  profile: DigitalContactProfile,
  lookupProfile: (slug: string) => DigitalContactProfile | null,
  preferredSlug?: string | null,
): string | null {
  const raw = String(preferredSlug ?? profile.backupRepresentativeSlug ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return null;
  if (raw === profile.slug.trim().toLowerCase()) return null;
  const backup = lookupProfile(raw);
  if (!backup || !backup.active) return null;
  if (backup.slug.trim().toLowerCase() === profile.slug.trim().toLowerCase()) return null;
  return backup.slug;
}

function inactiveView(slug: string): ExecutivePublicAvailabilityView {
  return {
    slug,
    active: false,
    publicAvailabilityState: "inactive",
    withinWorkingHours: null,
    absenceActive: false,
    temporaryStatus: null,
    temporaryStatusFresh: false,
    backupSlug: null,
    showWorkingHours: false,
    showAvailability: false,
    capabilities: { allowScheduling: false, allowVideo: false },
    publicAbsenceMessage: null,
  };
}

/**
 * Central ECP public availability resolver.
 * Pass `now` for deterministic tests. Never trusts visitor device timezone for executive truth.
 */
export function resolveExecutivePublicAvailability(
  input: ResolveExecutivePublicAvailabilityInput,
): ExecutivePublicAvailabilityView {
  const now = input.now ?? new Date();
  const lang: DigitalContactLang = input.lang === "en" ? "en" : "es";
  const profile = input.profile;

  if (!profile || !profile.active) {
    return inactiveView(String(profile?.slug ?? "").trim() || "unknown");
  }

  const policy = effectivePolicy(profile);
  const capabilities = effectiveCapabilities(profile);
  const absenceActive = isAbsenceActive(profile, now);
  const temp = readFreshTemporaryStatus(profile, now);
  const temporaryStatusFresh = Boolean(temp?.fresh);
  const temporaryStatus = temporaryStatusFresh && temp ? temp.status : null;

  const absenceBackupPreferred =
    absenceActive && profile.absence?.backupRepresentativeSlug !== undefined
      ? profile.absence.backupRepresentativeSlug
      : profile.backupRepresentativeSlug;

  const backupSlug = resolveValidatedBackupSlug(profile, input.lookupProfile, absenceBackupPreferred);

  const publicAbsenceMessage =
    absenceActive && profile.absence?.publicMessage
      ? String(profile.absence.publicMessage[lang] ?? profile.absence.publicMessage.es ?? "").trim() ||
        null
      : null;

  const base = {
    slug: profile.slug,
    active: true,
    withinWorkingHours: null as boolean | null,
    absenceActive,
    temporaryStatus,
    temporaryStatusFresh,
    backupSlug,
    showWorkingHours: policy.showWorkingHours,
    showAvailability: policy.showAvailability,
    capabilities,
    publicAbsenceMessage,
  };

  if (absenceActive) {
    return { ...base, publicAvailabilityState: "absent", withinWorkingHours: isWithinExecutiveWorkingHours(profile.workingHours, now) };
  }

  const within = isWithinExecutiveWorkingHours(profile.workingHours, now);
  base.withinWorkingHours = within;

  if (within === null) {
    return { ...base, temporaryStatus: null, temporaryStatusFresh: false, publicAvailabilityState: "unknown_schedule" };
  }

  if (within === false) {
    // Fresh "available" never overrides outside hours.
    return {
      ...base,
      temporaryStatus: temporaryStatus === "available" ? null : temporaryStatus,
      temporaryStatusFresh: temporaryStatus === "available" ? false : temporaryStatusFresh,
      publicAvailabilityState: "outside_hours",
    };
  }

  // Inside working hours
  if (policy.showAvailability && temporaryStatus === "busy") {
    return { ...base, publicAvailabilityState: "busy" };
  }
  if (policy.showAvailability && temporaryStatus === "away") {
    return { ...base, publicAvailabilityState: "away" };
  }
  if (policy.showAvailability && temporaryStatus === "available") {
    return { ...base, publicAvailabilityState: "available" };
  }

  return {
    ...base,
    temporaryStatus: policy.showAvailability ? temporaryStatus : null,
    temporaryStatusFresh: policy.showAvailability ? temporaryStatusFresh : false,
    publicAvailabilityState: "within_hours",
  };
}
