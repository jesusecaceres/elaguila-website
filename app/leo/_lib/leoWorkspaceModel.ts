/**
 * LEO-22A — Canonical visual workspace catalog.
 * Session-local presentation only. No authority. No provider writes.
 */

export const LEO_WORKSPACE_IDS = [
  "HOME",
  "ATTENTION",
  "GMAIL",
  "CALENDAR",
  "REPORTS",
  "CLIENTS",
  "PROJECTS",
  "TECHNOLOGY",
  "REVENUE",
  "GOVERNED_ACTIONS",
  "MEMORY",
  "SELF_INTELLIGENCE",
] as const;

export type LeoWorkspaceId = (typeof LEO_WORKSPACE_IDS)[number];

export type LeoWorkspaceDefinition = {
  id: LeoWorkspaceId;
  label: string;
  description: string;
  /** Existing panel / renderer identity when one exists. */
  renderer: "existing" | "conversation_backed_placeholder";
  panelHint: string;
};

export const LEO_WORKSPACE_CATALOG: readonly LeoWorkspaceDefinition[] = [
  {
    id: "HOME",
    label: "Home",
    description: "Executive overview",
    renderer: "existing",
    panelHint: "LeoMorningBriefPanel",
  },
  {
    id: "ATTENTION",
    label: "Attention",
    description: "What needs attention",
    renderer: "existing",
    panelHint: "LeoAttentionPanel",
  },
  {
    id: "GMAIL",
    label: "Gmail",
    description: "Conversation-backed email evidence",
    renderer: "conversation_backed_placeholder",
    panelHint: "gmail_evidence",
  },
  {
    id: "CALENDAR",
    label: "Calendar",
    description: "Conversation-backed calendar evidence",
    renderer: "conversation_backed_placeholder",
    panelHint: "calendar_evidence",
  },
  {
    id: "REPORTS",
    label: "Reports",
    description: "Leonix-wide executive reporting",
    renderer: "existing",
    panelHint: "LeoExecutiveReportsPanel",
  },
  {
    id: "CLIENTS",
    label: "Clients",
    description: "Client care",
    renderer: "existing",
    panelHint: "LeoClientCarePanel",
  },
  {
    id: "PROJECTS",
    label: "Projects",
    description: "Project evidence from conversation",
    renderer: "conversation_backed_placeholder",
    panelHint: "project_evidence",
  },
  {
    id: "TECHNOLOGY",
    label: "Technology",
    description: "System health",
    renderer: "existing",
    panelHint: "LeoSystemHealthCard",
  },
  {
    id: "REVENUE",
    label: "Revenue",
    description: "Conversation-backed revenue evidence",
    renderer: "conversation_backed_placeholder",
    panelHint: "revenue_evidence",
  },
  {
    id: "GOVERNED_ACTIONS",
    label: "Governed Actions",
    description: "Owner-governed proposals",
    renderer: "existing",
    panelHint: "LeoGovernedActionsPanel",
  },
  {
    id: "MEMORY",
    label: "Memory",
    description: "Living Leonix Book",
    renderer: "existing",
    panelHint: "LeoMemoryPanel",
  },
  {
    id: "SELF_INTELLIGENCE",
    label: "Self-Intelligence",
    description: "LEO self-intelligence",
    renderer: "existing",
    panelHint: "LeoSelfIntelligencePanel",
  },
] as const;

export const LEO_DEFAULT_WORKSPACE: LeoWorkspaceId = "HOME";

export function isLeoWorkspaceId(value: unknown): value is LeoWorkspaceId {
  return typeof value === "string" && (LEO_WORKSPACE_IDS as readonly string[]).includes(value);
}

export function getLeoWorkspaceDefinition(id: LeoWorkspaceId): LeoWorkspaceDefinition {
  const found = LEO_WORKSPACE_CATALOG.find((w) => w.id === id);
  return found ?? LEO_WORKSPACE_CATALOG[0]!;
}
