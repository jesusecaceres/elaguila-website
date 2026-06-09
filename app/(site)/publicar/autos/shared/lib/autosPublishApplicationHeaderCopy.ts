import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

export function getAutosPublishHeaderEyebrow(lang: AutosNegociosLang, lane: "negocios" | "privado"): string {
  const category = lang === "es" ? "Clasificados" : "Classifieds";
  const laneLabel =
    lang === "es" ? (lane === "negocios" ? "Negocios" : "Privado") : lane === "negocios" ? "Business" : "Private";
  return `${category} · ${laneLabel}`;
}
