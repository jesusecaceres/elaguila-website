/**
 * LEO-16 notification policy — fingerprints, cooldowns, quiet hours, deduplication.
 * Pure — no DB/network.
 */
import { timingSafeEqual } from "node:crypto";

import {
  LEO_DEFAULT_QUIET_HOURS,
  LEO_MORNING_BRIEF_WINDOW,
} from "@/app/leo/_lib/leoWatchDefinitions";
import { resolveSafeLeoAlertPath } from "@/app/leo/_lib/leoWatchEngine";
import type { LeoWatchResult, LeoWatchSeverity } from "@/app/leo/_lib/leoTypes";

export type LeoNotificationPolicyInput = {
  nowMs: number;
  timezone: string;
  result: LeoWatchResult;
  /** Last delivery timestamp for this fingerprint (ms), if any. */
  lastNotifiedAtMs?: number | null;
  /** Whether owner has active push subscription. */
  hasSubscription: boolean;
};

export type LeoNotificationPolicyDecision = {
  shouldNotify: boolean;
  suppressionReason: string | null;
};

const COOLDOWN_MS: Record<LeoWatchSeverity, number> = {
  CRITICAL: 30 * 60 * 1000,
  HIGH: 2 * 60 * 60 * 1000,
  NORMAL: 6 * 60 * 60 * 1000,
  INFORMATIONAL: 24 * 60 * 60 * 1000,
};

function hourInTimezone(nowMs: number, timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).formatToParts(new Date(nowMs));
    const h = parts.find((p) => p.type === "hour")?.value;
    const n = h != null ? Number(h) : NaN;
    return Number.isFinite(n) ? n : new Date(nowMs).getUTCHours();
  } catch {
    return new Date(nowMs).getUTCHours();
  }
}

function isQuietHours(nowMs: number, timezone: string): boolean {
  const h = hourInTimezone(nowMs, timezone);
  const { startHour, endHour } = LEO_DEFAULT_QUIET_HOURS;
  if (startHour < endHour) {
    return h >= startHour || h < endHour;
  }
  return h >= startHour || h < endHour;
}

function isMorningBriefWindow(nowMs: number, timezone: string): boolean {
  const h = hourInTimezone(nowMs, timezone);
  return h >= LEO_MORNING_BRIEF_WINDOW.startHour && h < LEO_MORNING_BRIEF_WINDOW.endHour;
}

export function stableWatchFingerprint(parts: string[]): string {
  return parts.filter(Boolean).join(":");
}

export function applyLeoNotificationPolicy(input: LeoNotificationPolicyInput): LeoNotificationPolicyDecision {
  const { result, nowMs, timezone, lastNotifiedAtMs, hasSubscription } = input;

  if (!result.changed) {
    return { shouldNotify: false, suppressionReason: "unchanged_fingerprint" };
  }

  if (!result.shouldNotify) {
    return { shouldNotify: false, suppressionReason: result.suppressionReason ?? "watch_not_eligible" };
  }

  if (!hasSubscription) {
    return { shouldNotify: false, suppressionReason: "no_push_subscription" };
  }

  if (result.severity === "INFORMATIONAL") {
    return { shouldNotify: false, suppressionReason: "informational_no_push" };
  }

  if (result.kind === "MORNING_BRIEF" && !isMorningBriefWindow(nowMs, timezone)) {
    return { shouldNotify: false, suppressionReason: "outside_morning_brief_window" };
  }

  const quiet = isQuietHours(nowMs, timezone);
  if (quiet && !result.eligibleOutsideQuietHours) {
    return { shouldNotify: false, suppressionReason: "quiet_hours" };
  }

  if (lastNotifiedAtMs != null) {
    const elapsed = nowMs - lastNotifiedAtMs;
    const cooldown = COOLDOWN_MS[result.severity];
    if (elapsed < cooldown) {
      return { shouldNotify: false, suppressionReason: "cooldown" };
    }
  }

  return { shouldNotify: true, suppressionReason: null };
}

export function leoNotificationHumanLabel(category: LeoWatchResult["notificationCategory"]): string {
  switch (category) {
    case "critical":
      return "Critical";
    case "needs_you":
      return "Needs you";
    case "morning_brief":
      return "Morning brief";
    default:
      return "Watch";
  }
}

export function buildLeoAlertPushPayload(input: {
  result: LeoWatchResult;
  alertId: string;
  test?: boolean;
}): Record<string, unknown> {
  const label = leoNotificationHumanLabel(input.result.notificationCategory);
  const title = input.test ? `[TEST] ${label}` : label;
  const body = input.result.headline.slice(0, 180);
  return {
    type: "leo_alert",
    title,
    body,
    answerPath: resolveSafeLeoAlertPath(input.result.deepLink),
    alertId: input.alertId.slice(0, 80),
    severity: input.result.severity,
    test: Boolean(input.test),
  };
}

/** Cron secret authorization — constant-time compare. */
export function isLeoCronAuthorized(providedKey: string | null | undefined): boolean {
  const configured = process.env.LEO_CRON_SECRET?.trim();
  if (!configured) return false;
  const provided = String(providedKey ?? "").trim();
  if (!provided || provided.length !== configured.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, "utf8"), Buffer.from(configured, "utf8"));
  } catch {
    return false;
  }
}

export function applyPolicyToWatchResults(
  results: LeoWatchResult[],
  args: {
    nowMs: number;
    timezone: string;
    hasSubscription: boolean;
    lastNotifiedByFingerprint: Record<string, number>;
  },
): LeoWatchResult[] {
  return results.map((result) => {
    const decision = applyLeoNotificationPolicy({
      nowMs: args.nowMs,
      timezone: args.timezone,
      result,
      hasSubscription: args.hasSubscription,
      lastNotifiedAtMs: args.lastNotifiedByFingerprint[result.fingerprint] ?? null,
    });
    return {
      ...result,
      shouldNotify: decision.shouldNotify,
      suppressionReason: decision.suppressionReason,
    };
  });
}
