"use client";

import Image from "next/image";

export default function MagazinePage() {
  return (
    <main className="relative z-10 flex flex-col items-center justify-start min-h-screen text-white px-6 pt-40 pb-20">
      {/* PAGE TITLE */}
      <h1 className="text-6xl font-bold text-center drop-shadow-2xl mb-10">
        El Águila Digital Magazine
      </h1>

      {/* DESCRIPTION */}
      <p className="text-2xl text-center max-w-3xl mb-16 leading-relaxed">
        Welcome to the official digital magazine of <strong>El Águila</strong>.  
        Here you can read our digital editions featuring news, culture,  
        inspiration, and high-quality visual content.
      </p>

      {/* MAGAZINE IFRAME OR IMAGE */}
      {/* Placeholder until your English Publuu PDF is ready */}
      <div className="w-full max-w-5xl flex justify-center">
        <Image
          src="/magazine-placeholder.jpg"
          alt="Digital Magazine"
          width={1600}
          height={900}
          className="rounded-2xl shadow-2xl border-4 border-white/40"
        />
      </div>

      {/* FOOTER NOTE */}
      <p className="mt-14 text-xl text-center opacity-80">
        Edition: January 2026 — Test Version
      </p>
    </main>
  );
}
