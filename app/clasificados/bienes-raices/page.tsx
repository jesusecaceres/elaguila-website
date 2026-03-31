"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiBriefcase, FiUser } from "react-icons/fi";

type Lang = "es" | "en";

/** Bienes Raíces hub: elige negocio vs particular → publicar en `/clasificados/publicar/bienes-raices/*`. */
export default function BienesRaicesHubPage() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const other: Lang = lang === "es" ? "en" : "es";
  const qs = new URLSearchParams(searchParams?.toString() ?? "");
  qs.set("lang", other);
  const toggleHref = `/clasificados/bienes-raices?${qs.toString()}`;

  const copy =
    lang === "es"
      ? {
          title: "Bienes Raíces",
          subtitle: "Elige cómo quieres publicar: como negocio o como particular.",
          negocio: "Negocio o profesional",
          negocioHint: "Inmobiliaria, desarrollador, agente certificado",
          privado: "Vendedor particular",
          privadoHint: "Dueño o familiar que vende o renta directo",
          langToggle: "English",
          back: "Volver a Clasificados",
        }
      : {
          title: "Real Estate",
          subtitle: "Choose business or private seller to start the listing form.",
          negocio: "Business or professional",
          negocioHint: "Brokerage, developer, licensed agent",
          privado: "Private seller",
          privadoHint: "Owner or family selling or renting directly",
          langToggle: "Español",
          back: "Back to Classifieds",
        };

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16">
      <div className="max-w-lg mx-auto px-6">
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-[#111111]">{copy.title}</h1>
              <p className="mt-2 text-[#111111]/80">{copy.subtitle}</p>
            </div>
            <Link
              href={toggleHref}
              className="shrink-0 self-center sm:self-start rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#E8E8E8]"
            >
              {copy.langToggle}
            </Link>
          </div>

          <div className="mt-8 grid gap-3">
            <Link
              href={`/clasificados/publicar/bienes-raices/negocio?lang=${lang}`}
              className="flex items-start gap-4 rounded-xl border border-black/10 bg-white px-4 py-4 text-left transition hover:bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
            >
              <FiBriefcase className="h-8 w-8 shrink-0 text-[#111111] mt-0.5" aria-hidden />
              <span>
                <span className="block font-semibold text-[#111111]">{copy.negocio}</span>
                <span className="mt-1 block text-sm text-[#111111]/70">{copy.negocioHint}</span>
              </span>
            </Link>
            <Link
              href={`/clasificados/publicar/bienes-raices/privado?lang=${lang}`}
              className="flex items-start gap-4 rounded-xl border border-black/10 bg-white px-4 py-4 text-left transition hover:bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
            >
              <FiUser className="h-8 w-8 shrink-0 text-[#111111] mt-0.5" aria-hidden />
              <span>
                <span className="block font-semibold text-[#111111]">{copy.privado}</span>
                <span className="mt-1 block text-sm text-[#111111]/70">{copy.privadoHint}</span>
              </span>
            </Link>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href={`/clasificados?lang=${lang}`}
              className="text-sm font-semibold text-[#111111]/80 underline hover:text-[#111111]"
            >
              {copy.back}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
