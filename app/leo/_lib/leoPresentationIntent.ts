/**
 * LEO-22A — Typed presentation / visual-navigation intents.
 * Phrase matching lives here only. JSX must not parse navigation strings.
 * High-confidence imperative language only. Questions still go to conversation.
 * No execution, no Gmail send, no governed-action approval.
 */

import {
  isLeoWorkspaceId,
  type LeoWorkspaceId,
} from "@/app/leo/_lib/leoWorkspaceModel";

export const LEO_PRESENTATION_INTENT_KINDS = [
  "NAVIGATE",
  "PRESENT",
  "OPEN_VISIBLE_ITEM",
  "BACK",
  "FOCUS_CONVERSATION",
  "STOP_SPEECH",
  "READ_CONTEXT",
  "REPEAT_SPOKEN",
  "NONE",
] as const;

export type LeoPresentationIntentKind = (typeof LEO_PRESENTATION_INTENT_KINDS)[number];

export type LeoPresentationIntent =
  | { kind: "NAVIGATE"; workspace: LeoWorkspaceId }
  | { kind: "PRESENT"; workspace: LeoWorkspaceId }
  | { kind: "OPEN_VISIBLE_ITEM"; index?: number; verb: "open" | "read" }
  | { kind: "BACK" }
  | { kind: "FOCUS_CONVERSATION" }
  | { kind: "STOP_SPEECH" }
  | { kind: "READ_CONTEXT" }
  | { kind: "REPEAT_SPOKEN" }
  | { kind: "NONE" };

const QUESTION_PREFIX =
  /^(why|how|who|when|can you explain|could you explain|what is|what's|whats)\b/;

function normalize(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
}

type PhraseRule = {
  kind: Exclude<LeoPresentationIntentKind, "NONE" | "OPEN_VISIBLE_ITEM">;
  workspace?: LeoWorkspaceId;
  phrases: readonly string[];
};

const RULES: readonly PhraseRule[] = [
  {
    kind: "PRESENT",
    workspace: "REPORTS",
    phrases: ["take me to reports", "show me reports", "go to reports", "open reports"],
  },
  {
    kind: "PRESENT",
    workspace: "GMAIL",
    phrases: ["show me gmail", "take me to gmail", "go to gmail", "open email", "open gmail", "show me email"],
  },
  {
    kind: "PRESENT",
    workspace: "CALENDAR",
    phrases: [
      "show me my calendar",
      "go to calendar",
      "take me to calendar",
      "take me to my calendar",
      "open calendar",
      "show me calendar",
      "show me calendar",
    ],
  },
  {
    kind: "PRESENT",
    workspace: "ATTENTION",
    phrases: [
      "show me what needs attention",
      "show me what needs my attention",
      "take me to attention",
      "go to attention",
      "show me attention",
      "open attention",
    ],
  },
  {
    kind: "NAVIGATE",
    workspace: "HOME",
    phrases: [
      "take me to the dashboard",
      "go home",
      "go to home",
      "take me home",
      "show me the dashboard",
      "go to dashboard",
    ],
  },
  {
    kind: "PRESENT",
    workspace: "GOVERNED_ACTIONS",
    phrases: [
      "show me governed actions",
      "go to governed actions",
      "take me to governed actions",
      "open governed actions",
    ],
  },
  {
    kind: "PRESENT",
    workspace: "MEMORY",
    phrases: ["show me memory", "go to memory", "take me to memory", "open memory"],
  },
  {
    kind: "PRESENT",
    workspace: "SELF_INTELLIGENCE",
    phrases: [
      "show me self-intelligence",
      "show me self intelligence",
      "go to self-intelligence",
      "go to self intelligence",
      "take me to self-intelligence",
    ],
  },
  {
    kind: "PRESENT",
    workspace: "CLIENTS",
    phrases: ["show me clients", "go to clients", "take me to clients", "open clients", "show me client care"],
  },
  {
    kind: "PRESENT",
    workspace: "TECHNOLOGY",
    phrases: ["show me technology", "go to technology", "take me to technology", "show me system health"],
  },
  {
    kind: "PRESENT",
    workspace: "PROJECTS",
    phrases: ["show me projects", "go to projects", "take me to projects"],
  },
  {
    kind: "PRESENT",
    workspace: "REVENUE",
    phrases: ["show me revenue", "go to revenue", "take me to revenue"],
  },
  { kind: "BACK", phrases: ["go back", "take me back", "back", "take me back"] },
  {
    kind: "FOCUS_CONVERSATION",
    phrases: ["focus conversation", "back to conversation", "show conversation"],
  },
];

/**
 * Resolve owner text to a typed presentation intent.
 * Returns NONE unless the whole utterance is a high-confidence imperative.
 */
const ORDINAL: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
};

function parseVisibleItemIntent(text: string): LeoPresentationIntent | null {
  const numbered = /^(open|read)\s+(?:number\s+)?(\d+|one|two|three|four|five|six|seven|eight)$/.exec(text);
  if (!numbered) return null;
  const verb = numbered[1] === "read" ? "read" : "open";
  const raw = numbered[2] ?? "";
  const index = /^\d+$/.test(raw) ? Number(raw) : ORDINAL[raw];
  if (!index || index < 1) return null;
  return { kind: "OPEN_VISIBLE_ITEM", index, verb };
}

export function resolveLeoPresentationIntent(raw: string): LeoPresentationIntent {
  const text = normalize(raw);
  if (!text) return { kind: "NONE" };
  if (QUESTION_PREFIX.test(text)) return { kind: "NONE" };

  if (text === "stop" || text === "stop reading" || text === "quiet" || text === "pause") {
    return { kind: "STOP_SPEECH" };
  }
  if (text === "read that to me" || text === "read that" || text === "read this" || text === "read this to me") {
    return { kind: "READ_CONTEXT" };
  }
  if (text === "repeat that" || text === "repeat") {
    return { kind: "REPEAT_SPOKEN" };
  }

  const numbered = parseVisibleItemIntent(text);
  if (numbered) return numbered;

  if (text === "open that" || text === "open this" || text === "open this item") {
    return { kind: "OPEN_VISIBLE_ITEM", verb: "open" };
  }

  for (const rule of RULES) {
    if (rule.phrases.includes(text)) {
      if (rule.kind === "BACK") return { kind: "BACK" };
      if (rule.kind === "FOCUS_CONVERSATION") return { kind: "FOCUS_CONVERSATION" };
      if ((rule.kind === "NAVIGATE" || rule.kind === "PRESENT") && rule.workspace && isLeoWorkspaceId(rule.workspace)) {
        return { kind: rule.kind, workspace: rule.workspace };
      }
    }
  }
  return { kind: "NONE" };
}

export function leoPresentationIntentChangesWorkspace(intent: LeoPresentationIntent): boolean {
  return intent.kind === "NAVIGATE" || intent.kind === "PRESENT" || intent.kind === "BACK";
}

export function leoPresentationIntentIsLocalSpeechCommand(intent: LeoPresentationIntent): boolean {
  return (
    intent.kind === "STOP_SPEECH" ||
    intent.kind === "READ_CONTEXT" ||
    intent.kind === "REPEAT_SPOKEN" ||
    intent.kind === "OPEN_VISIBLE_ITEM"
  );
}
