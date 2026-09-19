"use client";

import { useEffect, useRef, useState } from "react";
import { LEARNING_FOCUS_RING } from "../learningUi";

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

/**
 * Gate G2 — provider-agnostic audio player. Rendered ONLY when a real recording exists for the
 * current language (see hasPlayableAudio); there is no fake or placeholder player. Native <audio>
 * controls (keyboard + screen-reader operable, lock-screen capable) plus speed and chapter jumps,
 * and Media Session metadata for car / headphone controls. Never autoplays.
 */
export function LessonAudioPlayer({
  src,
  mime,
  title,
  artist,
  chapters,
  copy,
}: {
  src: string;
  mime: string;
  title: string;
  artist: string;
  chapters: { id: string; title: string; startSeconds: number }[];
  copy: { speed: string; chapters: string };
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist });
  }, [title, artist]);

  return (
    <div>
      <audio ref={ref} controls preload="none" className="w-full">
        <source src={src} type={mime} />
      </audio>

      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={copy.speed}>
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">{copy.speed}</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={speed === s}
            onClick={() => setSpeed(s)}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm font-bold ${
              speed === s ? "border-[#2A4536] bg-[#2A4536] text-[#F3D98A]" : "border-[#D6C7AD] bg-[#FFFDF7] text-[#2A4536]"
            } ${LEARNING_FOCUS_RING}`}
          >
            {s}×
          </button>
        ))}
      </div>

      {chapters.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">{copy.chapters}</p>
          <ol className="mt-1 grid gap-1 sm:grid-cols-2">
            {chapters.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!ref.current) return;
                    ref.current.currentTime = c.startSeconds;
                    void ref.current.play();
                  }}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-semibold text-[#7A1E2C] hover:bg-[#7A1E2C]/[0.06] ${LEARNING_FOCUS_RING}`}
                >
                  <span className="shrink-0 tabular-nums text-xs text-[#5C5346]">
                    {Math.floor(c.startSeconds / 60)}:{String(Math.floor(c.startSeconds % 60)).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 break-words">{c.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
