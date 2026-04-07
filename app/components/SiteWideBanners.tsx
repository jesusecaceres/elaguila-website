import { Suspense } from "react";
import { SiteWideBannersClient } from "./SiteWideBannersClient";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { mergeGlobalSite } from "@/app/lib/siteSectionContent/globalSiteMerge";
import type { GlobalSitePayload } from "@/app/lib/siteSectionContent/payloadTypes";

/**
 * Sitewide notice + promo strips (below main nav). Controlled from `/admin/site-settings`.
 * Language follows `?lang=` like other public pages; defaults to ES.
 */
export async function SiteWideBanners() {
  const { payload } = await getSiteSectionPayload("global_site");
  const g = mergeGlobalSite(payload as unknown as GlobalSitePayload);

  return (
    <Suspense fallback={null}>
      <SiteWideBannersClient
        showNotice={g.toggles.showSitewideNotice}
        showPromo={g.toggles.showGlobalPromoStrip}
        noticeEs={g.notice.es}
        noticeEn={g.notice.en}
        promoEs={g.promo.es}
        promoEn={g.promo.en}
      />
    </Suspense>
  );
}
