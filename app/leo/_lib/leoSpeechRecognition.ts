/**
 * LEO-14.9 — browser-native speech recognition (foreground dictation only).
 * No raw audio capture, persistence, or external STT providers.
 */

import type { LeoConversationLanguage } from "@/app/leo/_lib/leoTypes";

export type LeoSpeechRecognitionImplementation = "STANDARD" | "WEBKIT" | "NONE";

export type LeoSpeechRecognitionCapability = {
  supported: boolean;
  implementation: LeoSpeechRecognitionImplementation;
};

export type LeoVoiceDictationState = "IDLE" | "LISTENING" | "TRANSCRIBING" | "UNAVAILABLE" | "ERROR";

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [altIndex: number]: { transcript: string };
    };
  };
};

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
};

function isBrowserWindow(win: Window | undefined): win is SpeechRecognitionWindow {
  return typeof win !== "undefined";
}

/** SSR-safe capability probe — pass `window` only on the client. */
export function getLeoSpeechRecognitionCapability(win?: Window): LeoSpeechRecognitionCapability {
  if (!isBrowserWindow(win)) {
    return { supported: false, implementation: "NONE" };
  }
  if (typeof win.SpeechRecognition === "function") {
    return { supported: true, implementation: "STANDARD" };
  }
  if (typeof win.webkitSpeechRecognition === "function") {
    return { supported: true, implementation: "WEBKIT" };
  }
  return { supported: false, implementation: "NONE" };
}

/** Resolve BCP-47 tag for browser SpeechRecognition. AUTO uses browser locale — not language detection. */
export function resolveLeoSpeechRecognitionLang(
  preference: LeoConversationLanguage,
  browserLocale?: string | null,
): string {
  if (preference === "en") return "en-US";
  if (preference === "es") return "es-MX";
  const locale = (browserLocale ?? "").trim();
  if (locale) return locale;
  return "en-US";
}

export function leoSpeechRecognitionAutoLabel(): string {
  return "Browser default language";
}

/** Append final transcript into composer draft without replacing existing text. */
export function mergeTranscriptIntoComposer(existing: string, transcript: string): string {
  const next = transcript.trim();
  if (!next) return existing;
  const base = existing.trimEnd();
  if (!base) return next;
  return `${base} ${next}`;
}

/** Owner-facing error copy — no raw browser error names as primary text. */
export function mapLeoSpeechRecognitionError(errorCode: string): string {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission is blocked.";
    case "no-speech":
      return "I didn't catch anything.";
    case "audio-capture":
      return "Microphone is unavailable on this device.";
    case "network":
      return "Voice dictation needs a network connection in this browser.";
    case "aborted":
      return "Listening stopped.";
    case "language-not-supported":
      return "This language isn't supported for voice dictation here.";
    default:
      return "Voice dictation isn't available right now.";
  }
}

export type LeoSpeechRecognitionCallbacks = {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  onError?: (message: string) => void;
};

export type LeoSpeechRecognitionSession = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  dispose: () => void;
  isActive: () => boolean;
};

export function createLeoSpeechRecognitionSession(
  win: Window,
  lang: string,
  callbacks: LeoSpeechRecognitionCallbacks,
): LeoSpeechRecognitionSession | null {
  const cap = getLeoSpeechRecognitionCapability(win);
  if (!cap.supported) return null;

  const w = win as SpeechRecognitionWindow;
  const Ctor = cap.implementation === "STANDARD" ? w.SpeechRecognition : w.webkitSpeechRecognition;
  if (!Ctor) return null;

  let recognition: BrowserSpeechRecognition | null = null;
  let active = false;
  let disposed = false;

  const ensure = (): BrowserSpeechRecognition | null => {
    if (disposed) return null;
    if (!recognition) {
      recognition = new Ctor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = lang;

      recognition.onstart = () => {
        active = true;
        callbacks.onListeningChange?.(true);
      };

      recognition.onend = () => {
        active = false;
        callbacks.onListeningChange?.(false);
      };

      recognition.onerror = (event) => {
        if (event.error === "aborted") return;
        callbacks.onError?.(mapLeoSpeechRecognitionError(event.error));
      };

      recognition.onresult = (event) => {
        let interim = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) finalText += transcript;
          else interim += transcript;
        }
        if (interim.trim()) callbacks.onInterim?.(interim.trim());
        if (finalText.trim()) callbacks.onFinal(finalText.trim());
      };
    }
    recognition.lang = lang;
    return recognition;
  };

  return {
    start() {
      if (disposed) return;
      const rec = ensure();
      if (!rec) return;
      try {
        rec.start();
      } catch {
        callbacks.onError?.("Voice dictation isn't available in this browser.");
      }
    },
    stop() {
      if (!recognition || disposed) return;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
    abort() {
      if (!recognition || disposed) return;
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
      active = false;
      callbacks.onListeningChange?.(false);
    },
    dispose() {
      disposed = true;
      this.abort();
      recognition = null;
    },
    isActive() {
      return active;
    },
  };
}
