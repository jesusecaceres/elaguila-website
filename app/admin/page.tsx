"use client";

import Navbar from "@/app/components/Navbar";

export default function AdminHome() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <Navbar />

      <div className="mt-20 p-10 bg-gray-900 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-yellow-400">
          Admin Dashboard Placeholder
        </h1>

        <p className="text-gray-300">
          This is the admin homepage. Full functionality coming soon.
        </p>
      </div>
    </main>
  );
}
