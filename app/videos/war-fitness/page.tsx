"use client";

import React, { useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function WarFitnessVideoPage() {
  const searchParams = useSearchParams()!;
  const lang = (searchParams.get("lang") as "es" | "en") || "es";
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [showButtons, setShowButtons] = useState(false);

  const text = {
    es: {
      title: "Video Promocional — WAR Fitness",
      coupons: "Cupones",
      sweepstakes: "Sorteos",
    },
    en: {
      title: "Promotional Video — WAR Fitness",
      coupons: "Coupons",
      sweepstakes: "Sweepstakes",
    },
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const progress = video.currentTime / video.duration;
    if (progress >= 0.9 && !showButtons) {
      setShowButtons(true);
    }
  };

  const goToCoupons = () => {
    if (lang === "es") router.push("/entrar?lang=es&prize=coupon");
    else router.push("/enter?lang=en&prize=coupon");
  };

  const goToSweepstakes = () => {
    if (lang === "es") router.push("/entrar?lang=es&prize=weekly");
    else router.push("/enter?lang=en&prize=weekly");
  };

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-start pt-24 bg-black">
      {/* TITLE */}
      <h1 className="text-center text-2xl md:text-3xl font-bold text-yellow-400 drop-shadow-lg mb-4">
        {text[lang].title}
      </h1>

      {/* VIDEO WRAPPER */}
      <div className="flex justify-center w-full px-4">
        <div
          className="
            border-[3px]
            border-yellow-500
            shadow-[0_0_25px_rgba(255,215,0,0.7)]
            rounded-xl
            overflow-hidden
            bg-black
          "
          style={{
            width: "clamp(260px, 40vmin, 500px)",
            aspectRatio: "9 / 16",
          }}
        >
          <video
            ref={videoRef}
            src="/videos/test-war-fitness.mp4"
            controls
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* BUTTONS */}
      {showButtons && (
        <div className="flex gap-6 mt-8">
          <button
            onClick={goToCoupons}
            className="px-10 py-4 bg-yellow-400 text-black font-bold rounded-xl shadow-[0_0_15px_rgba(255,215,0,0.7)] hover:bg-yellow-300 transition"
          >
            {text[lang].coupons}
          </button>

          <button
            onClick={goToSweepstakes}
            className="px-10 py-4 bg-yellow-400 text-black font-bold rounded-xl shadow-[0_0_15px_rgba(255,215,0,0.7)] hover:bg-yellow-300 transition"
          >
            {text[lang].sweepstakes}
          </button>
        </div>
      )}

      <div className="h-12" />
    </main>
  );
}
