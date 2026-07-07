import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { getAutosPlanDisplayCopy } from "@/app/lib/clasificados/autos/autosPricingCopy";

export type AutosBranchCopy = {
  metaTitle: string;
  kicker: string;
  title: string;
  intro: string;
  backToPublicar: string;
  privado: {
    title: string;
    priceDisplay: string;
    body: string;
    cta: string;
    launchBadge: string;
  };
  negocios: {
    title: string;
    priceDisplay: string;
    body: string;
    cta: string;
    launchNote: string;
  };
  privadoPlaceholder: {
    title: string;
    body: string;
    back: string;
    branch: string;
  };
};

function buildCopy(lang: AutosNegociosLang): AutosBranchCopy {
  const privadoPlan = getAutosPlanDisplayCopy(lang, "privado");
  const negociosPlan = getAutosPlanDisplayCopy(lang, "negocios");

  if (lang === "en") {
    return {
      metaTitle: "Publish in Autos — LEONIX",
      kicker: "Publish · Classifieds · Autos",
      title: "Publish in Autos",
      intro: "Choose whether you are posting as a private seller or as a dealership. Review plan pricing before you start.",
      backToPublicar: "Back to categories",
      privado: {
        title: "Private seller",
        priceDisplay: privadoPlan.priceDisplay,
        body: "Post one vehicle as a private seller. Built for selling your car locally on Leonix.",
        cta: "Start private listing",
        launchBadge: "Launch 25 code eligible",
      },
      negocios: {
        title: "Dealer de Autos",
        priceDisplay: negociosPlan.priceDisplay,
        body: "For dealerships and auto businesses that need a professional presence and vehicle inventory.",
        cta: "Start as dealer",
        launchNote: "Business package — separate promotions",
      },
      privadoPlaceholder: {
        title: "Private seller — live flow (QA)",
        body: "The private lane uses the same draft, confirm, and publish pipeline as the business lane. Use “Start private listing” from the branch screen.",
        back: "Back to Autos",
        branch: "Choose another path",
      },
    };
  }

  return {
    metaTitle: "Publicar en Autos — LEONIX",
    kicker: "Publicar · Clasificados · Autos",
    title: "Publicar en Autos",
    intro: "Elige si publicas como vendedor privado o como dealer. Revisa el precio del plan antes de empezar.",
    backToPublicar: "Volver a categorías",
    privado: {
      title: "Vendedor privado",
      priceDisplay: privadoPlan.priceDisplay,
      body: "Publica un vehículo como vendedor privado. Ideal para vender tu auto localmente en Leonix.",
      cta: "Empezar anuncio privado",
      launchBadge: "Acepta código Leonix Launch 25",
    },
    negocios: {
      title: "Dealer de Autos",
      priceDisplay: negociosPlan.priceDisplay,
      body: "Para agencias y negocios de autos que necesitan una presencia profesional e inventario de vehículos.",
      cta: "Empezar como dealer",
      launchNote: "Paquete de negocio — promociones separadas",
    },
    privadoPlaceholder: {
      title: "Privado — flujo activo (QA)",
      body: "El flujo particular comparte el mismo sistema de borrador, confirmación y publicación que Negocios. Usa «Empezar anuncio privado» desde la pantalla anterior.",
      back: "Volver a Autos",
      branch: "Elegir otra opción",
    },
  };
}

export function getAutosBranchCopy(lang: AutosNegociosLang): AutosBranchCopy {
  return buildCopy(lang);
}
