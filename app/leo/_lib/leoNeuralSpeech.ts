/**
 * LEO-VOICE.1 — client-side neural speech playback.
 * Calls the owner-only /api/leo/speech route and plays the returned audio.
 * Mirrors LeoSpeechSynthesisController's shape 1:1 so the shared spoken
 * session (LeoSpokenSession.tsx) can treat both lanes interchangeably and
 * fall back to browser SpeechSynthesis on any failure.
 */

import type { LeoSpeechPlaybackState } from "@/app/leo/_lib/leoSpeechSynthesis";

/** `Audio`/`fetch` aren't guaranteed on the base `Window` type — same defensive
 * optional-cast pattern as leoSpeechSynthesis.ts's SpeechSynthesisWindow. */
type LeoNeuralSpeechWindow = Window & {
  Audio?: typeof Audio;
  fetch?: typeof fetch;
};

export type LeoNeuralSpeechCallbacks = {
  onStateChange?: (state: LeoSpeechPlaybackState) => void;
  /** Fires on real audio playback completion — never a guessed timeout. */
  onEnd?: () => void;
  /** Fires on any failure (network, provider, playback) — caller should fall back. */
  onError?: () => void;
};

export type LeoNeuralSpeechController = {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  repeat: (text: string) => void;
  getState: () => LeoSpeechPlaybackState;
  dispose: () => void;
};

/** SSR-safe capability probe — no OS voice required, only fetch + <audio>. */
export function isLeoNeuralSpeechClientCapable(win?: Window): boolean {
  if (typeof win === "undefined") return false;
  const w = win as LeoNeuralSpeechWindow;
  return typeof w.Audio === "function" && typeof w.fetch === "function";
}

export function createLeoNeuralSpeechController(
  win: Window,
  callbacks: LeoNeuralSpeechCallbacks = {},
): LeoNeuralSpeechController | null {
  if (!isLeoNeuralSpeechClientCapable(win)) return null;
  const w = win as Required<LeoNeuralSpeechWindow>;

  let state: LeoSpeechPlaybackState = "IDLE";
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;
  let abortController: AbortController | null = null;
  let lastText = "";
  let disposed = false;
  let generation = 0;

  const setState = (next: LeoSpeechPlaybackState) => {
    state = next;
    callbacks.onStateChange?.(next);
  };

  const cleanupAudio = () => {
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.onpause = null;
      audio.onplay = null;
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
      audio = null;
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  };

  const stopInternal = () => {
    generation += 1;
    abortController?.abort();
    abortController = null;
    cleanupAudio();
    setState("IDLE");
  };

  const speakInternal = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || disposed) return;

    stopInternal();
    lastText = trimmed;
    const myGeneration = generation;
    const controller = new AbortController();
    abortController = controller;

    try {
      const res = await w.fetch("/api/leo/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
        signal: controller.signal,
      });
      if (disposed || myGeneration !== generation) return;
      if (!res.ok) {
        callbacks.onError?.();
        return;
      }
      const blob = await res.blob();
      if (disposed || myGeneration !== generation) return;
      if (!blob.size) {
        callbacks.onError?.();
        return;
      }

      const url = URL.createObjectURL(blob);
      const el = new w.Audio(url);
      audio = el;
      objectUrl = url;

      el.onplay = () => {
        if (audio !== el) return;
        setState("SPEAKING");
      };
      el.onpause = () => {
        if (audio !== el || el.ended) return;
        setState("PAUSED");
      };
      el.onended = () => {
        if (audio !== el) return;
        cleanupAudio();
        setState("IDLE");
        callbacks.onEnd?.();
      };
      el.onerror = () => {
        if (audio !== el) return;
        cleanupAudio();
        setState("IDLE");
        callbacks.onError?.();
      };

      await el.play();
    } catch {
      if (disposed || myGeneration !== generation) return;
      callbacks.onError?.();
    }
  };

  return {
    speak(text) {
      void speakInternal(text);
    },
    pause() {
      if (disposed || state !== "SPEAKING" || !audio) return;
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
    },
    resume() {
      if (disposed || state !== "PAUSED" || !audio) return;
      void audio.play().catch(() => callbacks.onError?.());
    },
    stop() {
      stopInternal();
    },
    repeat(text) {
      void speakInternal(text || lastText);
    },
    getState() {
      return disposed ? "IDLE" : state;
    },
    dispose() {
      disposed = true;
      stopInternal();
      lastText = "";
    },
  };
}
