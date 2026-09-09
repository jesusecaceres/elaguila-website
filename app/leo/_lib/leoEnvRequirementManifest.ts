/**
 * LEO-ADMIN-OS-FINAL.2 item 13 — Env Requirement Manifest.
 *
 * One canonical, source-derived list of every LEO-relevant environment variable:
 * what capability it gates, whether it is required or optional, what Preview and
 * Production should expect, and how the system fails when it is absent. No secret
 * values are read or stored here — this module only names variables and cites the
 * source file that actually reads them.
 *
 * This intentionally is NOT a new runtime-config subsystem: it does not read
 * process.env itself. It is a static, human/verifier-readable index pointing at
 * the existing config modules (leoAiConfig.ts, leoGoogleWorkspaceConfig.ts,
 * leoTtsConfig.ts, leoProjectConfig.ts, webPushConfig.ts, supabase/server.ts,
 * adminAccessControl.ts) that already own the real process.env reads.
 */

export type LeoEnvRequirement = "REQUIRED" | "OPTIONAL";

export type LeoEnvExpectation =
  | "MUST_BE_SET"
  | "RECOMMENDED"
  | "OPTIONAL_DEFAULTS_APPLY"
  | "MUST_STAY_UNSET_UNLESS_OWNER_ENABLES"
  | "MUST_BE_SET_BEFORE_ANY_SCHEDULER_IS_ADDED";

export type LeoEnvManifestEntry = {
  variable: string;
  capability: string;
  requirement: LeoEnvRequirement;
  previewExpectation: LeoEnvExpectation;
  productionExpectation: LeoEnvExpectation;
  failureState: string;
  sourceFile: string;
};

export const LEO_ENV_REQUIREMENT_MANIFEST: readonly LeoEnvManifestEntry[] = [
  {
    variable: "NEXT_PUBLIC_SUPABASE_URL",
    capability: "Supabase persistence (all LEO tables)",
    requirement: "REQUIRED",
    previewExpectation: "MUST_BE_SET",
    productionExpectation: "MUST_BE_SET",
    failureState: "Every getAdminSupabase()-backed read/write reports NOT_CONNECTED/UNAVAILABLE — never a false empty state.",
    sourceFile: "app/lib/supabase/server.ts",
  },
  {
    variable: "SUPABASE_SERVICE_ROLE_KEY",
    capability: "Supabase persistence (service-role, bypasses RLS by design)",
    requirement: "REQUIRED",
    previewExpectation: "MUST_BE_SET",
    productionExpectation: "MUST_BE_SET",
    failureState: "Same as NEXT_PUBLIC_SUPABASE_URL — isSupabaseAdminConfigured() reports false.",
    sourceFile: "app/lib/supabase/server.ts",
  },
  {
    variable: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    capability: "Browser Supabase Auth (owner real-login flow)",
    requirement: "REQUIRED",
    previewExpectation: "MUST_BE_SET",
    productionExpectation: "MUST_BE_SET",
    failureState: "/admin/login/auth cannot verify per-person credentials; owner falls back to the bootstrap password path.",
    sourceFile: "app/lib/supabase/server.ts",
  },
  {
    variable: "OPENAI_API_KEY",
    capability: "OpenAI reasoning + neural TTS",
    requirement: "REQUIRED",
    previewExpectation: "MUST_BE_SET",
    productionExpectation: "MUST_BE_SET",
    failureState: "isLeoAiCredentialPresent()/isLeoTtsConfigured() report false; conversation falls back to deterministic-only, TTS falls back to browser speech synthesis.",
    sourceFile: "app/leo/_lib/leoAiConfig.ts",
  },
  {
    variable: "LEO_AI_MODEL",
    capability: "OpenAI reasoning model selection",
    requirement: "OPTIONAL",
    previewExpectation: "OPTIONAL_DEFAULTS_APPLY",
    productionExpectation: "OPTIONAL_DEFAULTS_APPLY",
    failureState: "Falls back to the built-in default model.",
    sourceFile: "app/leo/_lib/leoAiConfig.ts",
  },
  {
    variable: "OPENAI_MODERATION_MODEL",
    capability: "Input moderation for AI reasoning",
    requirement: "OPTIONAL",
    previewExpectation: "OPTIONAL_DEFAULTS_APPLY",
    productionExpectation: "OPTIONAL_DEFAULTS_APPLY",
    failureState: "Falls back to the built-in default moderation model.",
    sourceFile: "app/leo/_lib/leoAiConfig.ts",
  },
  {
    variable: "LEO_TTS_MODEL",
    capability: "Neural TTS model selection",
    requirement: "OPTIONAL",
    previewExpectation: "OPTIONAL_DEFAULTS_APPLY",
    productionExpectation: "OPTIONAL_DEFAULTS_APPLY",
    failureState: "Falls back to gpt-4o-mini-tts.",
    sourceFile: "app/leo/_lib/leoTtsConfig.ts",
  },
  {
    variable: "LEO_TTS_VOICE",
    capability: "Neural TTS voice preset",
    requirement: "OPTIONAL",
    previewExpectation: "OPTIONAL_DEFAULTS_APPLY",
    productionExpectation: "OPTIONAL_DEFAULTS_APPLY",
    failureState: "Falls back to the friendly/alloy default preset.",
    sourceFile: "app/leo/_lib/leoTtsConfig.ts",
  },
  {
    variable: "LEO_GOOGLE_CLIENT_ID",
    capability: "Google Workspace (Gmail/Calendar read)",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "isLeoGoogleWorkspaceConfigured() reports false; Gmail/Calendar intelligence reports NOT_CONFIGURED, never a fabricated empty inbox/calendar.",
    sourceFile: "app/leo/_lib/leoGoogleWorkspaceConfig.ts",
  },
  {
    variable: "LEO_GOOGLE_CLIENT_SECRET",
    capability: "Google Workspace (Gmail/Calendar read)",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "Same as LEO_GOOGLE_CLIENT_ID.",
    sourceFile: "app/leo/_lib/leoGoogleWorkspaceConfig.ts",
  },
  {
    variable: "LEO_GOOGLE_REFRESH_TOKEN",
    capability: "Google Workspace (Gmail/Calendar read)",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "Same as LEO_GOOGLE_CLIENT_ID.",
    sourceFile: "app/leo/_lib/leoGoogleWorkspaceConfig.ts",
  },
  {
    variable: "LEO_GOOGLE_ACCOUNT_EMAIL",
    capability: "Google Workspace (Gmail/Calendar read) — account identity",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "Same as LEO_GOOGLE_CLIENT_ID.",
    sourceFile: "app/leo/_lib/leoGoogleWorkspaceConfig.ts",
  },
  {
    variable: "LEO_GMAIL_REPLY_WRITE_ENABLED",
    capability: "Gmail reply send (RED, two-key gated)",
    requirement: "OPTIONAL",
    previewExpectation: "MUST_STAY_UNSET_UNLESS_OWNER_ENABLES",
    productionExpectation: "MUST_STAY_UNSET_UNLESS_OWNER_ENABLES",
    failureState: "Reply execution stays unavailable even with a proven send scope (two-key AND). This task never sets it.",
    sourceFile: "app/leo/_lib/leoGoogleWorkspaceConfig.ts",
  },
  {
    variable: "LEO_GITHUB_TOKEN",
    capability: "GitHub project intelligence",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "GitHub runtime capability reports NOT_CONNECTED.",
    sourceFile: "app/leo/_lib/leoProjectConfig.ts",
  },
  {
    variable: "LEO_VERCEL_TOKEN / VERCEL_TOKEN",
    capability: "Vercel deployment intelligence",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "Vercel runtime capability reports NOT_CONNECTED.",
    sourceFile: "app/leo/_lib/leoProjectConfig.ts",
  },
  {
    variable: "LEO_VERCEL_TEAM_ID / VERCEL_TEAM_ID",
    capability: "Vercel project mapping",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "Vercel connector connects but project-intelligence mapping stays incomplete (PARTIAL).",
    sourceFile: "app/leo/_lib/leoProjectConfig.ts",
  },
  {
    variable: "LEO_VERCEL_PROJECT_ID / VERCEL_PROJECT_ID",
    capability: "Vercel project mapping",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "Same as LEO_VERCEL_TEAM_ID.",
    sourceFile: "app/leo/_lib/leoProjectConfig.ts",
  },
  {
    variable: "WEB_PUSH_VAPID_PUBLIC_KEY",
    capability: "Owner push alert delivery",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "isWebPushConfigured() reports false; scheduled watches still record results, just without push delivery.",
    sourceFile: "app/lib/digitalContact/humanConnection/webPushConfig.ts",
  },
  {
    variable: "WEB_PUSH_VAPID_PRIVATE_KEY",
    capability: "Owner push alert delivery",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "Same as WEB_PUSH_VAPID_PUBLIC_KEY.",
    sourceFile: "app/lib/digitalContact/humanConnection/webPushConfig.ts",
  },
  {
    variable: "WEB_PUSH_SUBJECT",
    capability: "Owner push alert delivery (VAPID subject)",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "Same as WEB_PUSH_VAPID_PUBLIC_KEY.",
    sourceFile: "app/lib/digitalContact/humanConnection/webPushConfig.ts",
  },
  {
    variable: "LEO_CRON_SECRET",
    capability: "Background monitoring run authorization (/api/leo/watch/run)",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "MUST_BE_SET_BEFORE_ANY_SCHEDULER_IS_ADDED",
    failureState: "isLeoCronAuthorized() rejects unauthenticated calls; no scheduler exists in this repo yet regardless (BLOCKED_EXTERNAL — see item 14).",
    sourceFile: "app/leo/_lib/leoNotificationPolicy.ts",
  },
  {
    variable: "LEO_OWNER_AUTH_USER_ID",
    capability: "Scheduled-watch owner identity binding",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "Background watch runs have no owner identity to bind results to.",
    sourceFile: "app/leo/_lib/leoWatchService.ts",
  },
  {
    variable: "ADMIN_PASSWORD",
    capability: "Shared bootstrap admin login (/admin/login/submit)",
    requirement: "REQUIRED",
    previewExpectation: "MUST_BE_SET",
    productionExpectation: "MUST_BE_SET",
    failureState: "Bootstrap login is unavailable; only real per-person Supabase Auth login works.",
    sourceFile: "app/admin/login/submit/route.ts",
  },
  {
    variable: "ADMIN_OPERATOR_EMAIL",
    capability: "Admin roster identity resolution",
    requirement: "OPTIONAL",
    previewExpectation: "OPTIONAL_DEFAULTS_APPLY",
    productionExpectation: "OPTIONAL_DEFAULTS_APPLY",
    failureState: "Roster-based role resolution has no operator email to match; role checks fall back to their documented default behavior.",
    sourceFile: "app/admin/_lib/adminAccessControl.ts",
  },
  {
    variable: "ADMIN_ENFORCE_ROSTER_PERMISSIONS",
    capability: "Roster permission enforcement toggle",
    requirement: "OPTIONAL",
    previewExpectation: "RECOMMENDED",
    productionExpectation: "RECOMMENDED",
    failureState: "When unset/off, permission enforcement uses the module's documented fallback behavior instead of strict roster checks.",
    sourceFile: "app/admin/_lib/adminAccessControl.ts",
  },
] as const;

export function leoEnvManifestSummary(): { required: number; optional: number; total: number } {
  const required = LEO_ENV_REQUIREMENT_MANIFEST.filter((e) => e.requirement === "REQUIRED").length;
  return {
    required,
    optional: LEO_ENV_REQUIREMENT_MANIFEST.length - required,
    total: LEO_ENV_REQUIREMENT_MANIFEST.length,
  };
}
