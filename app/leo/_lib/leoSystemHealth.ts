/**
 * LEO-16 system health — truthful dependency availability for owner surfaces.
 * Pure composition from load results; no network or server-only imports.
 */
import type {
  LeoSystemHealthComponent,
  LeoSystemHealthSnapshot,
  LeoSystemHealthState,
  LeoToolAvailability,
} from "@/app/leo/_lib/leoTypes";

export type LeoSystemHealthInput = {
  nowMs?: number;
  supabasePersistence?: LeoSystemHealthState;
  gmail?: LeoToolAvailability;
  calendar?: LeoToolAvailability;
  projectGithub?: LeoSystemHealthState;
  projectVercel?: LeoSystemHealthState;
  conversationPersistence?: LeoSystemHealthState;
  commitmentPersistence?: LeoSystemHealthState;
  receiptPersistence?: LeoSystemHealthState;
  watchPersistence?: LeoSystemHealthState;
  pushSubscriptionAvailable?: boolean;
  /** Explicit configuration probes supplied by server orchestration. */
  supabaseConfigured?: boolean;
  googleWorkspaceConfigured?: boolean;
  githubConfigured?: boolean;
  vercelConfigured?: boolean;
  webPushConfigured?: boolean;
  /** EXEC-REPORTS-02 — reporting adapter health. NOT_IMPLEMENTED is not a failure. */
  reportingAdapters?: Array<{
    domain: string;
    label: string;
    availability: string;
  }>;
};

function mapToolAvailability(a: LeoToolAvailability | undefined): LeoSystemHealthState {
  if (!a) return "UNKNOWN";
  if (a === "NOT_CONFIGURED") return "NOT_CONFIGURED";
  if (a === "AVAILABLE") return "HEALTHY";
  if (a === "PARTIAL") return "DEGRADED";
  return "UNAVAILABLE";
}

function overallFromComponents(states: LeoSystemHealthState[]): LeoSystemHealthState {
  if (states.every((s) => s === "HEALTHY" || s === "NOT_CONFIGURED")) return "HEALTHY";
  if (states.some((s) => s === "UNAVAILABLE")) return "DEGRADED";
  if (states.some((s) => s === "DEGRADED")) return "DEGRADED";
  if (states.every((s) => s === "NOT_CONFIGURED")) return "NOT_CONFIGURED";
  return "UNKNOWN";
}

export function buildLeoSystemHealthSnapshot(input: LeoSystemHealthInput = {}): LeoSystemHealthSnapshot {
  const nowMs = input.nowMs ?? Date.now();
  const components: LeoSystemHealthComponent[] = [];

  const supabaseState =
    input.supabasePersistence ??
    (input.supabaseConfigured === true ? "HEALTHY" : input.supabaseConfigured === false ? "NOT_CONFIGURED" : "UNKNOWN");
  components.push({
    key: "supabase",
    label: "Supabase persistence",
    state: supabaseState,
    ownerMessage:
      supabaseState === "UNAVAILABLE"
        ? "Leonix data storage is unavailable."
        : supabaseState === "NOT_CONFIGURED"
          ? "Leonix data storage is not configured."
          : null,
  });

  const googleConfigured = input.googleWorkspaceConfigured === true;
  const gmailState = mapToolAvailability(input.gmail);
  components.push({
    key: "gmail",
    label: "Gmail intelligence",
    state: googleConfigured ? gmailState : "NOT_CONFIGURED",
    ownerMessage:
      !googleConfigured
        ? "Gmail is not connected."
        : gmailState === "UNAVAILABLE"
          ? "Gmail intelligence is unavailable, so email-aware briefs may be incomplete."
          : gmailState === "DEGRADED"
            ? "Gmail intelligence is partial."
            : null,
  });

  const calendarState = mapToolAvailability(input.calendar);
  components.push({
    key: "calendar",
    label: "Calendar intelligence",
    state: googleConfigured ? calendarState : "NOT_CONFIGURED",
    ownerMessage:
      !googleConfigured
        ? "Calendar is not connected."
        : calendarState === "UNAVAILABLE"
          ? "Calendar intelligence is unavailable."
          : null,
  });

  components.push({
    key: "project_github",
    label: "Project intelligence (GitHub)",
    state: input.projectGithub ?? (input.githubConfigured ? "HEALTHY" : "NOT_CONFIGURED"),
    ownerMessage: null,
  });

  components.push({
    key: "project_vercel",
    label: "Project intelligence (Vercel)",
    state: input.projectVercel ?? (input.vercelConfigured ? "HEALTHY" : "NOT_CONFIGURED"),
    ownerMessage: null,
  });

  components.push({
    key: "conversation_persistence",
    label: "Conversation persistence",
    state: input.conversationPersistence ?? supabaseState,
    ownerMessage:
      (input.conversationPersistence ?? supabaseState) === "UNAVAILABLE"
        ? "Conversation persistence is unavailable."
        : null,
  });

  components.push({
    key: "commitment_persistence",
    label: "Commitment persistence",
    state: input.commitmentPersistence ?? supabaseState,
    ownerMessage: null,
  });

  components.push({
    key: "receipt_persistence",
    label: "Receipt persistence",
    state: input.receiptPersistence ?? supabaseState,
    ownerMessage: null,
  });

  components.push({
    key: "watch_persistence",
    label: "Watch persistence",
    state: input.watchPersistence ?? supabaseState,
    ownerMessage: null,
  });

  const pushAvailable = input.pushSubscriptionAvailable ?? input.webPushConfigured === true;
  components.push({
    key: "push_alerts",
    label: "Push alerts",
    state: pushAvailable ? "HEALTHY" : input.webPushConfigured === false ? "NOT_CONFIGURED" : "UNKNOWN",
    ownerMessage: pushAvailable ? null : "Push alerts are not configured on the server.",
  });

  for (const adapter of input.reportingAdapters ?? []) {
    if (adapter.availability === "NOT_IMPLEMENTED" || adapter.availability === "EMPTY") continue;
    let state: LeoSystemHealthState = "UNKNOWN";
    if (adapter.availability === "AVAILABLE") state = "HEALTHY";
    else if (adapter.availability === "PARTIAL") state = "DEGRADED";
    else if (adapter.availability === "UNAVAILABLE") state = "UNAVAILABLE";
    else continue;
    components.push({
      key: `reporting:${adapter.domain}`,
      label: `${adapter.label} reporting`,
      state,
      ownerMessage:
        state === "UNAVAILABLE"
          ? `${adapter.label} reporting is unavailable — not treated as healthy or zero.`
          : state === "DEGRADED"
            ? `${adapter.label} reporting is partial.`
            : null,
    });
  }

  const limitations: string[] = [];
  const degraded = components.filter((c) => c.state === "DEGRADED" || c.state === "UNAVAILABLE");
  if (degraded.length > 0) {
    limitations.push(`${degraded.length} system component(s) degraded or unavailable.`);
  }

  return {
    generatedAt: new Date(nowMs).toISOString(),
    overall: overallFromComponents(components.map((c) => c.state)),
    components,
    limitations,
  };
}

export function leoSystemHealthFingerprint(snapshot: LeoSystemHealthSnapshot): string {
  const parts = snapshot.components
    .filter((c) => c.state === "DEGRADED" || c.state === "UNAVAILABLE")
    .map((c) => `${c.key}:${c.state}`)
    .sort();
  return parts.length === 0 ? "SYSTEM_HEALTH:healthy" : `SYSTEM_HEALTH:${parts.join("|")}`;
}
