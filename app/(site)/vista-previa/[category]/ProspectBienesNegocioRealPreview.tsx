"use client";

import { useMemo } from "react";

import { BrAgenteResidencialLocaleProvider } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/BrAgenteResidencialLocaleContext";
import { AgenteIndividualResidencialPreviewPage } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewPage";
import {
  parseBienesAgenteResidencialPublishedState,
  type BienesLiveListingLike,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState";
import { useBienesNegocioShellTranslation } from "@/app/(site)/clasificados/bienes-raices/lib/useBienesNegocioShellTranslation";
import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";

/**
 * PROSPECT PREVIEW — Bienes Raíces Negocio, rendered with the REAL public presentation.
 *
 * The public `BienesRaicesNegocioLiveDetailShell` cannot be reused as-is here: it unconditionally
 * mounts a browser-Supabase Save button (writes `saved_listings`), a `LeonixShareButton` with
 * persistence, a browser query for the parent identity and the related-portfolio rail, and it
 * hands `AgenteIndividualResidencialPreviewPage` an analytics context that records contact-CTA
 * clicks against the real listing id. None of those has an off switch, and a prospect has no
 * account. So this thin wrapper composes the SAME inner pieces the shell composes — the same
 * `parseBienesAgenteResidencialPublishedState`, the same `useBienesNegocioShellTranslation` +
 * `TranslateAdControl` (same category/version), the same `BrAgenteResidencialLocaleProvider` and
 * the same `AgenteIndividualResidencialPreviewPage` in `publicChrome` (public) mode — and leaves
 * the mutating extras out:
 *   - `analyticsContext` = null  -> no CTA click is ever recorded;
 *   - `ownerId` = null           -> the professional Community Trust section renders nothing;
 *   - no Save button, no Share button, no related-portfolio rail, no parent-identity fetch.
 * `publicChrome.meta` is null so the header never claims "Published listing" for an unpublished ad.
 *
 * FOLLOW-UP (not done here, category files are owned by another workstream): a `readOnlyPreview`
 * prop on `BienesRaicesNegocioLiveDetailShell` would let this wrapper be deleted.
 */
export function ProspectBienesNegocioRealPreview({
  listing,
  lang,
}: {
  listing: BienesLiveListingLike;
  lang: "es" | "en";
}) {
  const data = useMemo(
    () => parseBienesAgenteResidencialPublishedState({ listing, parentIdentity: null, lang }),
    [lang, listing],
  );
  const shellTx = useBienesNegocioShellTranslation(data, lang, listing.id);

  const translateControl = shellTx.offerTranslate ? (
    <div className="mb-3 flex justify-start" data-bienes-negocio-translate-ad="1">
      <TranslateAdControl
        siteLocale={lang}
        originalLocale={shellTx.sourceLocale}
        category="bienes-raices"
        listingKey={listing.id}
        version="bienes-negocio-t1-v1"
        translatableContent={shellTx.translatableContent}
        onTranslated={shellTx.onTranslated}
        onShowOriginal={shellTx.onShowOriginal}
        requestTranslation={requestAdTranslation}
        className="w-full sm:w-auto"
      />
    </div>
  ) : null;

  return (
    <BrAgenteResidencialLocaleProvider>
      <div className="bg-[#F9F6F1]">
        <AgenteIndividualResidencialPreviewPage
          data={shellTx.displayData}
          analyticsContext={null}
          ownerId={null}
          publicChrome={{ meta: null, beforeMainGrid: translateControl }}
        />
      </div>
    </BrAgenteResidencialLocaleProvider>
  );
}
