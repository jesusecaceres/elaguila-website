/**
 * LEO-ADMIN-OS-FINAL.2 item 7 — Capability Panel Runtime Truth.
 *
 * Replaces LeoCapabilityStrip's hardcoded Available / Not-connected-yet lists with
 * states derived from the same diagnostics the page already computes elsewhere
 * (project config, Google Workspace truth, Supabase/TTS/AI/push config presence).
 * A capability is never marked CONNECTED merely because code exists — it requires
 * a live, checkable configuration signal.
 */
import "server-only";

import { isLeoAiCredentialPresent } from "@/app/leo/_lib/leoAiConfigPresence";
import { isLeoTtsConfigured } from "@/app/leo/_lib/leoTtsConfig";
import type { LeoGoogleWorkspaceCapabilityTruth } from "@/app/leo/_lib/leoGoogleWorkspaceCapabilityTruth";
import type { LeoProjectConfigDiagnostic } from "@/app/leo/_lib/leoTypes";

export type LeoCapabilityRuntimeState =
  | "CONNECTED"
  | "AVAILABLE"
  | "PARTIAL"
  | "NOT_CONNECTED"
  | "BLOCKED_EXTERNAL"
  | "DISABLED_BY_OWNER_GATE";

export type LeoCapabilityRuntimeEntry = {
  key: string;
  label: string;
  state: LeoCapabilityRuntimeState;
  detail: string;
};

export type LeoCapabilityRuntimeInput = {
  supabaseConfigured: boolean;
  google: LeoGoogleWorkspaceCapabilityTruth;
  project: LeoProjectConfigDiagnostic;
  webPushConfigured: boolean;
};

export function getLeoCapabilityRuntimeTruth(input: LeoCapabilityRuntimeInput): LeoCapabilityRuntimeEntry[] {
  const { supabaseConfigured, google, project, webPushConfigured } = input;
  const aiConfigured = isLeoAiCredentialPresent();
  const ttsConfigured = isLeoTtsConfigured();

  const githubState: LeoCapabilityRuntimeState = project.github.projectIntelligenceConfigured
    ? "CONNECTED"
    : project.github.connectorConnected
      ? "PARTIAL"
      : "NOT_CONNECTED";
  const vercelState: LeoCapabilityRuntimeState = project.vercel.projectIntelligenceConfigured
    ? "CONNECTED"
    : project.vercel.connectorConnected
      ? "PARTIAL"
      : "NOT_CONNECTED";

  const gmailSendScopeState: LeoCapabilityRuntimeState =
    google.gmailSendScopeHealth === "HEALTHY"
      ? "CONNECTED"
      : google.gmailSendScopeHealth === "UNPROVEN"
        ? "PARTIAL"
        : "NOT_CONNECTED";

  const gmailWriteFlagState: LeoCapabilityRuntimeState = !google.writeFlagEnabled
    ? "DISABLED_BY_OWNER_GATE"
    : google.gmailSendScopeProven
      ? "CONNECTED"
      : "PARTIAL";

  return [
    {
      key: "conversation_persistence",
      label: "Conversation persistence",
      state: supabaseConfigured ? "PARTIAL" : "NOT_CONNECTED",
      detail: supabaseConfigured
        ? "Supabase is configured; durable history requires signing in via /admin/login/auth (real per-person login), not the shared bootstrap password."
        : "Supabase admin client is not configured.",
    },
    {
      key: "commitments",
      label: "Commitments",
      state: supabaseConfigured ? "AVAILABLE" : "NOT_CONNECTED",
      detail: supabaseConfigured
        ? "leo_commitments repository is reachable."
        : "Supabase admin client is not configured.",
    },
    {
      key: "openai_reasoning",
      label: "OpenAI reasoning",
      state: aiConfigured ? "CONNECTED" : "NOT_CONNECTED",
      detail: aiConfigured ? "AI credential present." : "OPENAI_API_KEY is not configured.",
    },
    {
      key: "neural_tts",
      label: "Neural TTS",
      state: ttsConfigured ? "CONNECTED" : "NOT_CONNECTED",
      detail: ttsConfigured
        ? "Neural voice configured; browser speech synthesis remains the fallback."
        : "Neural TTS is not configured — browser speech synthesis fallback only.",
    },
    {
      key: "google_workspace",
      label: "Google Workspace",
      state: google.workspaceConfigured ? "CONNECTED" : "NOT_CONNECTED",
      detail: google.summary,
    },
    {
      key: "gmail_read",
      label: "Gmail read",
      state: google.gmailReadConfigured ? "CONNECTED" : "NOT_CONNECTED",
      detail: google.gmailReadConfigured ? "Gmail read credentials present." : "Google Workspace is not configured.",
    },
    {
      key: "calendar_read",
      label: "Calendar read",
      state: google.calendarReadConfigured ? "CONNECTED" : "NOT_CONNECTED",
      detail: google.calendarReadConfigured
        ? "Calendar read credentials present."
        : "Google Workspace is not configured.",
    },
    {
      key: "gmail_send_scope_proof",
      label: "Gmail send-scope proof",
      state: gmailSendScopeState,
      detail:
        gmailSendScopeState === "CONNECTED"
          ? "Live tokeninfo scope check confirmed send scope."
          : gmailSendScopeState === "PARTIAL"
            ? "Send scope not yet proven by a live check."
            : "Google Workspace is not configured.",
    },
    {
      key: "gmail_write_flag",
      label: "Gmail write flag",
      state: gmailWriteFlagState,
      detail:
        gmailWriteFlagState === "DISABLED_BY_OWNER_GATE"
          ? "LEO_GMAIL_REPLY_WRITE_ENABLED is off — owner has not enabled Gmail send."
          : gmailWriteFlagState === "CONNECTED"
            ? "Write flag on and send scope proven — reply execution available."
            : "Write flag on, but send scope not yet proven.",
    },
    {
      key: "github_runtime",
      label: "GitHub runtime",
      state: githubState,
      detail:
        githubState === "CONNECTED"
          ? "Connector connected; project intelligence mapping ready."
          : githubState === "PARTIAL"
            ? "Connector connected; project intelligence mapping incomplete."
            : "GitHub connector is not configured.",
    },
    {
      key: "vercel_runtime",
      label: "Vercel runtime",
      state: vercelState,
      detail:
        vercelState === "CONNECTED"
          ? "Connector connected; team/project mapping ready."
          : vercelState === "PARTIAL"
            ? "Connector connected; team/project ids not configured."
            : "Vercel connector is not configured.",
    },
    {
      key: "business_concierge",
      label: "Business Concierge",
      state: supabaseConfigured ? "PARTIAL" : "NOT_CONNECTED",
      detail: supabaseConfigured
        ? "Read-only pipeline intelligence connected to businesses/business_follow_ups. Concierge product execution remains coming soon."
        : "Supabase admin client is not configured.",
    },
    {
      key: "background_monitoring",
      label: "Background monitoring",
      state: "BLOCKED_EXTERNAL",
      detail:
        "leo_watch_runs persistence and /api/leo/watch/run exist, but no scheduler (vercel.json cron or equivalent) is wired anywhere in this repo yet — a one-time Production infra decision is required.",
    },
    {
      key: "alerts_push_identity",
      label: "Alerts / push identity readiness",
      state: webPushConfigured ? "PARTIAL" : "NOT_CONNECTED",
      detail: webPushConfigured
        ? "Web Push VAPID is configured; the owner still must opt in on /admin/leo."
        : "Web Push VAPID keys are not configured.",
    },
  ];
}
