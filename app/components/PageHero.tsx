"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

interface PageHeroProps {
  title: string; // English version
  titleEs?: string; // Spanish override (optional)
}

export default function PageHero({ title, titleEs }: PageHeroProps) {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "es";

  // Select correct title
  const displayTitle = lang === "es" && titleEs ? titleEs : title;

  return (
    <div
      className="w-full flex flex-col items-center justify-center text-center pt-32 pb-20"
      style={{
        background: "linear-gradient(to bottom, #000000 0%, #2b1e03 60%, #1a1a1a 100%)",
      }}
    >
      {/* LOGO */}
      <div className="flex justify-center mb-10">
        <Image
          src="/logo.png"
          alt="El Águila Logo"
          width={480}
          height={480}
          className="drop-shadow-[0_0_35px_rgba(255,215,0,0.35)]"
        />
      </div>

      {/* PAGE TITLE */}
      <h1 className="text-4xl md:text-5xl font-bold text-[#FFD700] px-6 leading-snug">
        {displayTitle}
      </h1>
    </div>
  );
}
