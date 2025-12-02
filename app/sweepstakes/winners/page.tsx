"use client";

import { useEffect, useState } from "react";

type Winner = {
  id: number;
  prize: string;
  email: string;
  city: string;
};

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWinners() {
      try {
        const res = await fetch("/api/winners");
        const data = await res.json();

        // Guarantee that data is always an array
        setWinners(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading winners:", err);
        setWinners([]);
      } finally {
        setLoading(false);
      }
    }

    loadWinners();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold text-yellow-400 mb-10 drop-shadow-lg">
        Recent Winners
      </h1>

      {loading ? (
        <p className="text-gray-300">Loading...</p>
      ) : winners.length === 0 ? (
        <p className="text-gray-400">No winners have been recorded yet.</p>
      ) : (
        <div className="space-y-8">
          {winners.map((w) => (
            <div
              key={w.id}
              className="border border-yellow-700 rounded-xl p-6 bg-zinc-900 shadow-xl"
            >
              <p className="text-xl font-bold text-yellow-300">
                Prize: {w.prize}
              </p>
              <p className="mt-2 text-gray-300">Winner: {w.email}</p>
              <p className="text-gray-400">City: {w.city}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
