import { navCopyLang, type SupportedLang } from "@/app/lib/language";

export type DealersDeAutosHubCategoryCopy = {
  label: string;
  desc: string;
  explore: string;
  post: string;
};

const COPY: Record<"es" | "en", DealersDeAutosHubCategoryCopy> = {
  es: {
    label: "Dealers de Autos",
    desc: "Inventario de agencias y negocios de autos.",
    explore: "EXPLORAR",
    post: "Publicar en Dealers de Autos",
  },
  en: {
    label: "Dealers de Autos",
    desc: "Dealership and auto business inventory.",
    explore: "EXPLORE",
    post: "Post in Dealers de Autos",
  },
};

export function getDealersDeAutosHubCategoryCopy(routeLang: SupportedLang): DealersDeAutosHubCategoryCopy {
  return COPY[navCopyLang(routeLang)];
}
