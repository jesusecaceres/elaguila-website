import type { GlobalSitePayload } from "./payloadTypes";

export type GlobalSiteResolved = {
  toggles: { showSitewideNotice: boolean; showGlobalPromoStrip: boolean };
  notice: { es: string; en: string };
  promo: { es: string; en: string };
};

const EMPTY: GlobalSiteResolved = {
  toggles: { showSitewideNotice: false, showGlobalPromoStrip: false },
  notice: { es: "", en: "" },
  promo: { es: "", en: "" },
};

function s(v: string | undefined): string {
  return v !== undefined ? v.trim() : "";
}

export function mergeGlobalSite(patch: GlobalSitePayload | Record<string, unknown> | null | undefined): GlobalSiteResolved {
  if (!patch || typeof patch !== "object") return EMPTY;
  const p = patch as GlobalSitePayload;
  const t = p.toggles ?? {};
  return {
    toggles: {
      showSitewideNotice: t.showSitewideNotice === true,
      showGlobalPromoStrip: t.showGlobalPromoStrip === true,
    },
    notice: {
      es: s(p.sitewideNotice?.es),
      en: s(p.sitewideNotice?.en),
    },
    promo: {
      es: s(p.globalPromoStrip?.es),
      en: s(p.globalPromoStrip?.en),
    },
  };
}
