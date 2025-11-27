"use client";

import Navbar from "@/app/components/Navbar";
import MagazineReader from "@/app/components/MagazineReader";
import { useSearchParams } from "next/navigation";

export default function January2026MagazinePage() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  return (
    <main className="relative min-h-screen w-full text-white">
      <Navbar />

      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.4), rgba(0,0,0,0.7))",
        }}
      />

      <div className="relative z-10 pt-32">
        <MagazineReader year="2026" month="january" lang={lang} />
      </div>
    </main>
  );
}
