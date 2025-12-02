"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";

export default function AdminDrawPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [winner, setWinner] = useState<any | null>(null);

  // Load entries from localStorage (temporary)
  useEffect(() => {
    const stored = localStorage.getItem("sweepstakesEntries");
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  }, []);

  const drawWinner = () => {
    if (entries.length === 0) return;

    const randomIndex = Math.floor(Math.random() * entries.length);
    setWinner(entries[randomIndex]);
  };

  // Convert entries into “lottery balls”
  const ballSet = entries.map((entry: any, i: number) => ({
    id: i,
    label: `${entry.email?.substring(0, 3)}***`,
    entry,
  }));

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <Navbar />

      <div className="pt-28 max-w-2xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-center text-yellow-400">
          Sorteo — Admin
        </h1>

        {/* DRAW BUTTON */}
        <button
          className="mt-10 w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-xl transition"
          onClick={drawWinner}
        >
          Elegir Ganador
        </button>

        {/* WINNER BOX */}
        {winner && (
          <div className="mt-8 p-6 bg-yellow-500 text-black rounded-xl shadow-xl text-center">
            <h2 className="text-3xl font-bold">🎉 Ganador 🎉</h2>
            <p className="text-xl mt-2 font-semibold">{winner.name}</p>
            <p className="text-md">{winner.email}</p>
          </div>
        )}

        {/* LOTTERY BALLS */}
        <h2 className="text-2xl mt-14 text-yellow-400 font-bold">
          Participantes ({ballSet.length})
        </h2>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {ballSet.map((ball) => (
            <div
              key={ball.id}
              className="w-16 h-16 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center shadow-xl"
            >
              {ball.label}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
