import type { Lang } from "../../types/tienda";
import type {
  BusinessCardDocument,
  BusinessCardImageBlock,
  BusinessCardProductSlug,
  BusinessCardSideState,
  BusinessCardTextFields,
  BusinessCardTextLayout,
} from "./types";

function emptyFields(): BusinessCardTextFields {
  return {
    personName: "",
    title: "",
    company: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    tagline: "",
  };
}

function defaultTextLayout(): BusinessCardTextLayout {
  const allTrue: Record<keyof BusinessCardTextFields, boolean> = {
    personName: true,
    title: true,
    company: true,
    phone: true,
    email: true,
    website: true,
    address: true,
    tagline: true,
  };
  return {
    groupPosition: "bottom-center",
    groupScale: "md",
    lineVisible: allTrue,
  };
}

function emptyLogo(): BusinessCardImageBlock {
  return {
    id: "logo",
    visible: true,
    position: "top-center",
    scale: "md",
    file: null,
    previewUrl: null,
    naturalWidth: null,
    naturalHeight: null,
  };
}

function starterFront(lang: Lang): BusinessCardSideState {
  return {
    fields:
      lang === "en"
        ? {
            personName: "Alex Rivera",
            title: "Creative Director",
            company: "Leonix Media",
            phone: "(555) 010-2000",
            email: "hello@leonix.example",
            website: "leonix.example",
            address: "",
            tagline: "Premium print for business",
          }
        : {
            personName: "Alex Rivera",
            title: "Director Creativo",
            company: "Leonix Media",
            phone: "(555) 010-2000",
            email: "hola@leonix.example",
            website: "leonix.example",
            address: "",
            tagline: "Impresión premium para negocios",
          },
    textLayout: defaultTextLayout(),
    logo: emptyLogo(),
  };
}

function starterBack(lang: Lang): BusinessCardSideState {
  return {
    fields:
      lang === "en"
        ? {
            personName: "",
            title: "",
            company: "Thank you",
            phone: "",
            email: "",
            website: "",
            address: "",
            tagline: "We print what you approve.",
          }
        : {
            personName: "",
            title: "",
            company: "Gracias",
            phone: "",
            email: "",
            website: "",
            address: "",
            tagline: "Imprimimos lo que apruebas.",
          },
    textLayout: {
      ...defaultTextLayout(),
      groupPosition: "center",
    },
    logo: { ...emptyLogo(), visible: false, position: "center" },
  };
}

export function createInitialBusinessCardDocument(
  productSlug: BusinessCardProductSlug,
  lang: Lang
): BusinessCardDocument {
  const two = productSlug === "two-sided-business-cards";
  return {
    id: `bc-${Date.now().toString(36)}`,
    version: 2,
    productSlug,
    sidedness: two ? "two-sided" : "one-sided",
    activeSide: "front",
    guidesVisible: true,
    textNudgeX: 0,
    textNudgeY: 0,
    logoNudgeX: 0,
    logoNudgeY: 0,
    front: starterFront(lang),
    back: two ? starterBack(lang) : emptySide(),
    approval: {
      spellingReviewed: false,
      layoutReviewed: false,
      printAsApproved: false,
      noRedesignExpectation: false,
    },
  };
}

function emptySide(): BusinessCardSideState {
  return {
    fields: emptyFields(),
    textLayout: { ...defaultTextLayout(), groupPosition: "center" },
    logo: { ...emptyLogo(), visible: false },
  };
}
