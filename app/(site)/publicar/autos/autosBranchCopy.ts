import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

export type AutosBranchCopy = {
  metaTitle: string;
  kicker: string;
  title: string;
  intro: string;
  backToPublicar: string;
  privado: {
    title: string;
    body: string;
    cta: string;
  };
  negocios: {
    title: string;
    body: string;
    cta: string;
  };
  privadoPlaceholder: {
    title: string;
    body: string;
    back: string;
    branch: string;
  };
};

const ES: AutosBranchCopy = {
  metaTitle: "Publicar en Autos — LEONIX",
  kicker: "Publicar · Clasificados · Autos",
  title: "Publicar en Autos",
  intro: "Elige si publicas como particular o como negocio / concesionario.",
  backToPublicar: "Volver a categorías",
  privado: {
    title: "Privado",
    body: "Vendedor individual: anuncio directo, flujo más simple para un solo vehículo.",
    cta: "Continuar como particular",
  },
  negocios: {
    title: "Negocios",
    body: "Concesionario o lote: inventario con bloque de negocio, medios y herramientas avanzadas.",
    cta: "Continuar como negocio",
  },
  privadoPlaceholder: {
    title: "Privado — flujo activo (QA)",
    body: "El flujo particular comparte el mismo sistema de borrador, confirmación y publicación que Negocios. Usa «Continuar como particular» desde la pantalla anterior.",
    back: "Volver a Autos",
    branch: "Elegir otra opción",
  },
};

const EN: AutosBranchCopy = {
  metaTitle: "Publish in Autos — LEONIX",
  kicker: "Publish · Classifieds · Autos",
  title: "Publish in Autos",
  intro: "Choose whether you are posting as an individual seller or as a business / dealership.",
  backToPublicar: "Back to categories",
  privado: {
    title: "Private seller",
    body: "Individual seller: a straightforward flow for a single-vehicle listing.",
    cta: "Continue as private seller",
  },
  negocios: {
    title: "Dealership",
    body: "Dealership or lot: inventory listings with a business block, media, and advanced tools.",
    cta: "Continue as business",
  },
  privadoPlaceholder: {
    title: "Private seller — live flow (QA)",
    body: "The private lane uses the same draft, confirm, and publish pipeline as the business lane. Use “Continue as private seller” from the branch screen.",
    back: "Back to Autos",
    branch: "Choose another path",
  },
};

export function getAutosBranchCopy(lang: AutosNegociosLang): AutosBranchCopy {
  return lang === "en" ? EN : ES;
}
