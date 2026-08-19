/**
 * LEO-14.9 — browser-native speech synthesis for LEO spoken summaries.
 * No external TTS, packages, or audio file generation.
 */

import type { LeoConversationAnswer } from "@/app/leo/_lib/leoTypes";

export type LeoSpeechSynthesisCapability = {
  supported: boolean;
  pauseSupported: boolean;
};

export type LeoSpeechPlaybackState = "IDLE" | "SPEAKING" | "PAUSED";

const MAX_FALLBACK_SPOKEN_CHARS = 320;

type SpeechUtteranceCtor = new (text: string) => SpeechSynthesisUtterance;

type SpeechSynthesisWindow = Window & {
  speechSynthesis?: SpeechSynthesis;
  SpeechSynthesisUtterance?: SpeechUtteranceCtor;
};

function isBrowserWindow(win: Window | undefined): win is SpeechSynthesisWindow {
  return typeof win !== "undefined";
}

/** SSR-safe capability probe. */
export function getLeoSpeechSynthesisCapability(win?: Window): LeoSpeechSynthesisCapability {
  if (!isBrowserWindow(win)) {
    return { supported: false, pauseSupported: false };
  }
  const synth = win.speechSynthesis;
  const UtteranceCtor = win.SpeechSynthesisUtterance;
  if (!synth || typeof UtteranceCtor !== "function") {
    return { supported: false, pauseSupported: false };
  }
  const pauseSupported = typeof synth.pause === "function" && typeof synth.resume === "function";
  return { supported: true, pauseSupported };
}

/** Prefer answer.spokenSummary; never read evidence wholesale. */
export function resolveLeoSpokenResponseText(answer: LeoConversationAnswer): string | null {
  const spoken = answer.spokenSummary?.trim();
  if (spoken) return boundSpokenText(spoken);

  const summary = answer.summary?.trim();
  if (!summary) return null;

  const scrubbed = summary
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, "")
    .replace(/\b(gmail|calendar|evidence|unknown|limitation):\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!scrubbed) return null;
  return boundSpokenText(scrubbed);
}

function boundSpokenText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_FALLBACK_SPOKEN_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_FALLBACK_SPOKEN_CHARS - 1).trim()}…`;
}

export function resolveLeoSpeechSynthesisLang(
  preference: "en" | "es" | "auto",
  browserLocale?: string | null,
): string {
  if (preference === "en") return "en-US";
  if (preference === "es") return "es-MX";
  const locale = (browserLocale ?? "").trim();
  return locale || "en-US";
}

export type LeoSpeechSynthesisCallbacks = {
  onStateChange?: (state: LeoSpeechPlaybackState) => void;
};

export type LeoSpeechSynthesisController = {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  repeat: (text: string) => void;
  getState: () => LeoSpeechPlaybackState;
  dispose: () => void;
};

export function createLeoSpeechSynthesisController(
  win: Window,
  lang: string,
  callbacks: LeoSpeechSynthesisCallbacks = {},
): LeoSpeechSynthesisController | null {
  const cap = getLeoSpeechSynthesisCapability(win);
  if (!cap.supported) return null;

  const w = win as SpeechSynthesisWindow;
  const synth = w.speechSynthesis!;
  const UtteranceCtor = w.SpeechSynthesisUtterance!;
  let state: LeoSpeechPlaybackState = "IDLE";
  let currentUtterance: SpeechSynthesisUtterance | null = null;
  let lastText = "";
  let disposed = false;

  const setState = (next: LeoSpeechPlaybackState) => {
    state = next;
    callbacks.onStateChange?.(next);
  };

  const cancelOwned = () => {
    try {
      synth.cancel();
    } catch {
      /* ignore */
    }
    currentUtterance = null;
    setState("IDLE");
  };

  const speakInternal = (text: string) => {
    if (disposed) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    cancelOwned();
    lastText = trimmed;

    const utterance = new UtteranceCtor(trimmed);
    utterance.lang = lang;
    currentUtterance = utterance;

    utterance.onstart = () => setState("SPEAKING");
    utterance.onend = () => {
      if (currentUtterance === utterance) {
        currentUtterance = null;
        setState("IDLE");
      }
    };
    utterance.onerror = () => {
      if (currentUtterance === utterance) {
        currentUtterance = null;
        setState("IDLE");
      }
    };

    synth.speak(utterance);
  };

  return {
    speak(text) {
      speakInternal(text);
    },
    pause() {
      if (!cap.pauseSupported || disposed || state !== "SPEAKING") return;
      try {
        synth.pause();
        if (synth.paused) setState("PAUSED");
      } catch {
        /* pause not reliable on this browser */
      }
    },
    resume() {
      if (!cap.pauseSupported || disposed || state !== "PAUSED") return;
      try {
        synth.resume();
        if (!synth.paused) setState("SPEAKING");
      } catch {
        /* resume not reliable on this browser */
      }
    },
    stop() {
      cancelOwned();
    },
    repeat(text) {
      speakInternal(text || lastText);
    },
    getState() {
      if (disposed) return "IDLE";
      if (cap.pauseSupported && synth.paused && state === "PAUSED") return "PAUSED";
      if (synth.speaking && state !== "PAUSED") return "SPEAKING";
      return state;
    },
    dispose() {
      disposed = true;
      cancelOwned();
      lastText = "";
    },
  };
}
