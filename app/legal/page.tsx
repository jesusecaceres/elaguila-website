"use client";a

import Navbar from "@/app/components/Navbar";

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto pt-28 pb-20 px-6">
        <h1 className="text-4xl font-bold text-yellow-400 mb-6">
          Legal Information
        </h1>

        <p className="text-lg leading-relaxed text-gray-300 mb-6">
          Welcome to El Águila. This page contains our general legal information, including
          terms of use, privacy considerations, and guidelines for participation in our
          sweepstakes and promotional activities.
        </p>

        <p className="text-lg leading-relaxed text-gray-300 mb-6">
          For detailed sweepstakes rules, please visit the dedicated page:
        </p>

        <a
          href="/legal/sweepstakes-rules"
          className="text-yellow-400 underline text-lg hover:text-yellow-300"
        >
          View Sweepstakes Official Rules →
        </a>
      </div>
    </main>
  );
}
