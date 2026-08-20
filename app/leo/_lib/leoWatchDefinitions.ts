/**
 * LEO-16 canonical watch definitions — stable kinds, cadence, and policy metadata.
 */
import type { LeoWatchKind, LeoWatchSeverity } from "@/app/leo/_lib/leoTypes";

export type LeoWatchDefinition = {
  kind: LeoWatchKind;
  label: string;
  /** Recommended baseline cadence in milliseconds. */
  defaultCadenceMs: number;
  /** Minimum allowed cadence — no faster than hourly unless spec exception. */
  minimumCadenceMs: number;
  notificationEligible: boolean;
  /** Quiet-hours behavior hint for policy layer. */
  quietHoursBehavior: "defer" | "allow_critical" | "no_push";
  severityThreshold: LeoWatchSeverity;
  canonicalService: string;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const LEO_WATCH_DEFINITIONS: Record<LeoWatchKind, LeoWatchDefinition> = {
  MORNING_BRIEF: {
    kind: "MORNING_BRIEF",
    label: "Morning brief",
    defaultCadenceMs: DAY_MS,
    minimumCadenceMs: DAY_MS,
    notificationEligible: true,
    quietHoursBehavior: "defer",
    severityThreshold: "NORMAL",
    canonicalService: "leoMorningBriefService",
  },
  CLIENT_CARE: {
    kind: "CLIENT_CARE",
    label: "Client care",
    defaultCadenceMs: HOUR_MS,
    minimumCadenceMs: HOUR_MS,
    notificationEligible: true,
    quietHoursBehavior: "allow_critical",
    severityThreshold: "HIGH",
    canonicalService: "leoClientCareService",
  },
  COMMUNICATION: {
    kind: "COMMUNICATION",
    label: "Communication",
    defaultCadenceMs: HOUR_MS,
    minimumCadenceMs: HOUR_MS,
    notificationEligible: true,
    quietHoursBehavior: "defer",
    severityThreshold: "HIGH",
    canonicalService: "leoCommunicationIntelligenceService",
  },
  COMMITMENTS: {
    kind: "COMMITMENTS",
    label: "Commitments",
    defaultCadenceMs: HOUR_MS,
    minimumCadenceMs: HOUR_MS,
    notificationEligible: true,
    quietHoursBehavior: "defer",
    severityThreshold: "HIGH",
    canonicalService: "leoCommitmentService",
  },
  ACTION_RECEIPTS: {
    kind: "ACTION_RECEIPTS",
    label: "Action receipts",
    defaultCadenceMs: HOUR_MS,
    minimumCadenceMs: HOUR_MS,
    notificationEligible: true,
    quietHoursBehavior: "defer",
    severityThreshold: "HIGH",
    canonicalService: "leoToolReceiptService",
  },
  ATTENTION: {
    kind: "ATTENTION",
    label: "Attention",
    defaultCadenceMs: HOUR_MS,
    minimumCadenceMs: HOUR_MS,
    notificationEligible: true,
    quietHoursBehavior: "allow_critical",
    severityThreshold: "HIGH",
    canonicalService: "leoAttentionService",
  },
  PROJECT_HEALTH: {
    kind: "PROJECT_HEALTH",
    label: "Project health",
    defaultCadenceMs: 3 * HOUR_MS,
    minimumCadenceMs: HOUR_MS,
    notificationEligible: true,
    quietHoursBehavior: "defer",
    severityThreshold: "HIGH",
    canonicalService: "leoProjectIntelligenceService",
  },
  SYSTEM_HEALTH: {
    kind: "SYSTEM_HEALTH",
    label: "System health",
    defaultCadenceMs: HOUR_MS,
    minimumCadenceMs: HOUR_MS,
    notificationEligible: true,
    quietHoursBehavior: "allow_critical",
    severityThreshold: "CRITICAL",
    canonicalService: "leoSystemHealth",
  },
};

export const LEO_WATCH_KINDS = Object.keys(LEO_WATCH_DEFINITIONS) as LeoWatchKind[];

export function getLeoWatchDefinition(kind: LeoWatchKind): LeoWatchDefinition {
  return LEO_WATCH_DEFINITIONS[kind];
}

/** Morning brief notification window (local hours, inclusive start, exclusive end). */
export const LEO_MORNING_BRIEF_WINDOW = {
  startHour: 5,
  endHour: 11,
} as const;

/** Default quiet hours when timezone is known — conservative. */
export const LEO_DEFAULT_QUIET_HOURS = {
  startHour: 22,
  endHour: 7,
} as const;
