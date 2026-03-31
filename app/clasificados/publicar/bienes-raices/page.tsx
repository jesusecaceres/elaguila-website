"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiArrowLeft, FiBriefcase, FiUser } from "react-icons/fi";

type Lang = "es" | "en";

/**
 * BR publish hub — choose Negocio vs Privado before the Leonix application routes.
 */
export default function PublicarBrHubPage() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const other: Lang = lang === "es" ? "en" : "es";
  const qs = new URLSearchParams(searchParams?.toString() ?? "");
  qs.set("lang", other);
  const toggleHref = `/clasificados/publicar/BR?${qs.toString()}`;

  const copy =
    lang === "es"
      ? {
          title: "Bienes Raíces — elige tu flujo",
          subtitle: "Negocio (agente / inmobiliaria) o vendedor particular.",
          negocioTitle: "Negocio",
          negocioDesc: "Formulario completo para listados profesionales.",
          privadoTitle: "Privado",
          privadoDesc: "Particular — formulario enfocado en vendedor.",
          back: "Todas las categorías",
          langToggle: "English",
        }
      : {
          title: "Real estate — pick your lane",
          subtitle: "Business (agent / brokerage) or private seller.",
          negocioTitle: "Business",
          negocioDesc: "Full flow for professional listings.",
          privadoTitle: "Private",
          privadoDesc: "Individual seller — focused form.",
          back: "All categories",
          langToggle: "Español",
        };

  const laneQs = new URLSearchParams(searchParams?.toString() ?? "");
  if (!laneQs.get("lang")) laneQs.set("lang", lang);

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16">
      <div className="mx-auto max-w-lg px-6">
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">{copy.title}</h1>
              <p className="mt-2 text-[#111111]/80">{copy.subtitle}</p>
            </div>
            <Link
              href={toggleHref}
              className="shrink-0 self-center rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#E8E8E8] sm:self-start"
            >
              {copy.langToggle}
            </Link>
          </div>

          <div className="mt-8 grid gap-3">
            <Link
              href={`/clasificados/publicar/BR/negocio?${laneQs.toString()}`}
              className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white px-4 py-5 text-left transition hover:bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
            >
              <span className="flex items-center gap-2 text-lg font-bold text-[#111111]">
                <FiBriefcase className="h-5 w-5 shrink-0" aria-hidden />
                {copy.negocioTitle}
              </span>
              <span className="text-sm text-[#111111]/70">{copy.negocioDesc}</span>
            </Link>
            <Link
              href={`/clasificados/publicar/BR/privado?${laneQs.toString()}`}
              className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white px-4 py-5 text-left transition hover:bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
            >
              <span className="flex items-center gap-2 text-lg font-bold text-[#111111]">
                <FiUser className="h-5 w-5 shrink-0" aria-hidden />
                {copy.privadoTitle}
              </span>
              <span className="text-sm text-[#111111]/70">{copy.privadoDesc}</span>
            </Link>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href={`/clasificados/publicar?lang=${lang}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#111111]/80 underline hover:text-[#111111]"
            >
              <FiArrowLeft className="h-4 w-4" aria-hidden />
              {copy.back}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
