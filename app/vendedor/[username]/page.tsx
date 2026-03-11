"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";

type Lang = "es" | "en";

export default function VendedorPage() {
  const params = useParams<{ username: string }>();
  const username = params?.username ?? "";
  const lang: Lang = "es";

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-16">
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#111111]">
            {lang === "es" ? "Perfil del vendedor" : "Seller profile"}
          </h1>
          <p className="mt-2 text-[#111111]/80">
            {lang === "es" ? "Vendedor:" : "Seller:"} <strong>{decodeURIComponent(username)}</strong>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[#111111]">
            <li>📅 {lang === "es" ? "Miembro desde" : "Member since"}: —</li>
            <li>📦 {lang === "es" ? "Anuncios activos" : "Active listings"}: —</li>
            <li>📍 {lang === "es" ? "Ubicación" : "Location"}: —</li>
          </ul>
          <p className="mt-4 text-xs text-[#111111]/50">
            {lang === "es"
              ? "Los datos del vendedor se cargarán cuando estén disponibles."
              : "Seller data will load when available."}
          </p>
          <Link
            href={`/clasificados?lang=${lang}`}
            className="mt-6 inline-block rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF]"
          >
            {lang === "es" ? "← Volver a Clasificados" : "← Back to Classifieds"}
          </Link>
        </div>
      </main>
    </div>
  );
}
