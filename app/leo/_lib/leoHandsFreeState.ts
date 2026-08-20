/**
 * LEO-14.10 — canonical foreground Hands-Free state machine.
 * Mode only: no second conversation engine, no action executor, no wake word.
 */

import type { LeoConversationAnswer, LeoConversationMode } from "@/app/leo/_lib/leoTypes";

export type LeoHandsFreeState =
  | "IDLE"
  | "LISTENING"
  | "TRANSCRIBING"
  | "THINKING"
  | "SPEAKING"
  | "WAITING_FOR_NEXT_TURN"
  | "PAUSED"
  | "ENDED"
  | "ERROR";

export type LeoHandsFreeEvent =
  | "START"
  | "LISTEN"
  | "RECOGNITION_START"
  | "FINAL_TRANSCRIPT"
  | "NO_SPEECH"
  | "SUBMIT"
  | "ANSWER_READY"
  | "SPEECH_START"
  | "SPEECH_END"
  | "SPEECH_ERROR"
  | "STOP_LISTENING"
  | "STOP_SPEAKING"
  | "PAUSE"
  | "RESUME"
  | "END"
  | "ERROR"
  | "VISIBILITY_HIDDEN"
  | "OFFLINE";

export const LEO_CONVERSATION_MODES: readonly LeoConversationMode[] = [
  "TEXT",
  "HANDS_FREE",
  "LOW_ATTENTION",
];

export const LEO_HANDS_FREE_CONFIRMATION_PROMPT =
  "LEO prepared this action. Do you want to continue?";

export const LEO_HANDS_FREE_FOREGROUND_NOTICE =
  "Hands-Free works only while this page stays open. LEO is not always listening and cannot hear you from the lock screen or in the background.";

export const LEO_HANDS_FREE_OFFLINE_MESSAGE =
  "LEO needs a connection for live company intelligence.";

export function isLeoConversationMode(value: unknown): value is LeoConversationMode {
  return value === "TEXT" || value === "HANDS_FREE" || value === "LOW_ATTENTION";
}

/** Deterministic transitions. Unknown edges keep the current state (no hidden jumps). */
export function transitionLeoHandsFree(
  state: LeoHandsFreeState,
  event: LeoHandsFreeEvent,
): LeoHandsFreeState {
  if (event === "END") return "ENDED";
  if (state === "ENDED" && event !== "START") return "ENDED";

  if (event === "PAUSE" || event === "VISIBILITY_HIDDEN" || event === "OFFLINE") {
    if (state === "IDLE" || state === "ENDED") return state;
    return "PAUSED";
  }

  switch (event) {
    case "START":
      if (state === "IDLE" || state === "ENDED" || state === "PAUSED" || state === "ERROR") {
        return "LISTENING";
      }
      return state;
    case "RESUME":
      if (state === "PAUSED" || state === "ERROR") return "WAITING_FOR_NEXT_TURN";
      return state;
    case "LISTEN":
      if (state === "SPEAKING" || state === "THINKING") return state;
      if (
        state === "WAITING_FOR_NEXT_TURN" ||
        state === "PAUSED" ||
        state === "IDLE" ||
        state === "ERROR"
      ) {
        return "LISTENING";
      }
      return state;
    case "RECOGNITION_START":
      if (state === "LISTENING" || state === "WAITING_FOR_NEXT_TURN") return "LISTENING";
      return state;
    case "FINAL_TRANSCRIPT":
      if (state === "LISTENING" || state === "TRANSCRIBING") return "TRANSCRIBING";
      return state;
    case "SUBMIT":
      if (state === "TRANSCRIBING" || state === "LISTENING") return "THINKING";
      return state;
    case "NO_SPEECH":
      if (state === "LISTENING" || state === "TRANSCRIBING") return "WAITING_FOR_NEXT_TURN";
      return state;
    case "ANSWER_READY":
    case "SPEECH_START":
      if (state === "THINKING" || state === "SPEAKING") return "SPEAKING";
      return state;
    case "SPEECH_END":
    case "SPEECH_ERROR":
      if (state === "SPEAKING" || state === "THINKING") return "WAITING_FOR_NEXT_TURN";
      return state;
    case "STOP_LISTENING":
      if (state === "LISTENING" || state === "TRANSCRIBING") return "WAITING_FOR_NEXT_TURN";
      return state;
    case "STOP_SPEAKING":
      if (state === "SPEAKING") return "WAITING_FOR_NEXT_TURN";
      return state;
    case "ERROR":
      return "ERROR";
    default:
      return state;
  }
}

export function leoHandsFreeOwnerLabel(state: LeoHandsFreeState): string {
  switch (state) {
    case "LISTENING":
      return "Listening…";
    case "TRANSCRIBING":
      return "Processing speech…";
    case "THINKING":
      return "Thinking…";
    case "SPEAKING":
      return "Speaking…";
    case "WAITING_FOR_NEXT_TURN":
      return "Ready for your next question";
    case "PAUSED":
      return "Paused";
    case "ENDED":
      return "Hands-Free ended";
    case "ERROR":
      return "Hands-Free needs attention";
    default:
      return "Hands-Free is off";
  }
}

export function leoHandsFreeCanListen(state: LeoHandsFreeState): boolean {
  return (
    state === "LISTENING" ||
    state === "WAITING_FOR_NEXT_TURN" ||
    state === "IDLE" ||
    state === "PAUSED"
  );
}

export function leoHandsFreeCanSpeak(state: LeoHandsFreeState): boolean {
  return state === "THINKING" || state === "SPEAKING" || state === "WAITING_FOR_NEXT_TURN";
}

export function leoHandsFreeIsForegroundActive(state: LeoHandsFreeState): boolean {
  return (
    state === "LISTENING" ||
    state === "TRANSCRIBING" ||
    state === "THINKING" ||
    state === "SPEAKING" ||
    state === "WAITING_FOR_NEXT_TURN" ||
    state === "PAUSED" ||
    state === "ERROR"
  );
}

/**
 * Spoken “yes” is only user text. Without exactly one pending confirmable actionId,
 * it must not execute anything — including via a hidden voice shortcut.
 */
export function leoHandsFreeGenericYesCannotExecute(
  pendingActionId: string | null | undefined,
): boolean {
  return !pendingActionId?.trim();
}

export function resolveLeoHandsFreePendingActionId(
  answer: LeoConversationAnswer | null | undefined,
): string | null {
  if (!answer) return null;
  const fromCards = (answer.resultCards ?? []).flatMap((card) => card.actions ?? []);
  const confirmable = fromCards.filter(
    (action) => action.requiresConfirmation && action.enabled && action.actionId?.trim(),
  );
  if (confirmable.length !== 1) return null;
  return confirmable[0].actionId;
}

export function leoHandsFreeShouldSpeakConfirmation(
  answer: LeoConversationAnswer | null | undefined,
): boolean {
  if (!answer) return false;
  if (answer.preparedAction) return true;
  const level = answer.governance?.level;
  if (level === "YELLOW" || level === "RED") return true;
  return resolveLeoHandsFreePendingActionId(answer) != null;
}

export function composeLeoHandsFreeSpokenText(spokenSummary: string, askConfirmation: boolean): string {
  const base = spokenSummary.trim();
  if (!askConfirmation) return base;
  if (!base) return LEO_HANDS_FREE_CONFIRMATION_PROMPT;
  return `${base} ${LEO_HANDS_FREE_CONFIRMATION_PROMPT}`;
}

export function shouldAutoListenAfterWaiting(opts: {
  state: LeoHandsFreeState;
  modeActive: boolean;
  skipAutoListen: boolean;
  online: boolean;
  documentHidden: boolean;
}): boolean {
  return (
    opts.modeActive &&
    !opts.skipAutoListen &&
    opts.online &&
    !opts.documentHidden &&
    opts.state === "WAITING_FOR_NEXT_TURN"
  );
}
