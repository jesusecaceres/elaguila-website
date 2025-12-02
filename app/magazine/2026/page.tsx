// app/magazine/2026/page.tsx
"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar";

const issues = [
  {
    slug: "january",
    monthLabel: "January",
    title: "January 2026 — Launch Issue",
    coverSrc: "/magazine/2026/january/cover.png",
  },
  // Future issues can be added here:
  // { slug: "february", monthLabel: "February", title: "February 2026 — ...", coverSrc: "/magazine/2026/february/cover.png" },
];

export default function Magazine2026Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <Navbar />

      <section className="max-w-6xl mx-auto px-4 pt-32 pb-20">
        <header className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-yellow-400/80">
            Digital Archive
          </p>
          <h1 className="mt-2 text-4xl md:text-5xl font-extrabold">
            2026 Editions
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
            Browse all digital issues of <span className="font-semibold">El Águila</span> for 2026.
            Click any cover to open the interactive magazine viewer.
          </p>
        </header>

        {/* GRID OF ISSUES */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
          {issues.map((issue) => (
            <Link
              key={issue.slug}
              href={`/magazine/2026/${issue.slug}`}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-32 md:w-40 aspect-[2/3] rounded-lg overflow-hidden border border-yellow-400/60 shadow-[0_0_25px_rgba(255,215,0,0.4)] group-hover:scale-105 transition">
                <img
                  src={issue.coverSrc}
                  alt={issue.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="text-sm md:text-base font-semibold text-yellow-300">
                  {issue.monthLabel} 2026
                </p>
                <p className="text-xs md:text-sm text-gray-300">
                  {issue.title}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* BACK LINK */}
        <div className="mt-10 text-center">
          <Link
            href="/magazine"
            className="inline-flex items-center gap-2 text-sm md:text-base text-gray-300 hover:text-yellow-300"
          >
            ← Back to Magazine Hub
          </Link>
        </div>
      </section>
    </main>
  );
}
