"use client";

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import { autosDraftTextValue, autosDraftUrlValue } from "@/app/lib/clasificados/autos/autosPublishFormText";
import { formatPhoneInputDisplay } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { AutosDealerFinanceImageUpload } from "./AutosDealerFinanceImageUpload";

const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none focus:border-[color:var(--lx-gold-border)]";
const LABEL = "text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const GRID2 = "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2";

/** Finance image field `financeContactImageUrl` — upload + URL via AutosDealerFinanceImageUpload. */

export function AutosDealerFinanceFields({
  listing,
  setListingPatch,
  copy,
}: {
  listing: AutoDealerListing;
  setListingPatch: (patch: Partial<AutoDealerListing>) => void;
  copy: AutosNegociosCopy;
}) {
  const f = copy.app.finance;
  return (
    <div className="mt-8 rounded-xl border border-[color:var(--lx-gold-border)]/40 bg-gradient-to-br from-[color:var(--lx-section)] to-[#FFFCF7] p-4 sm:p-5">
      <h3 className="text-sm font-extrabold tracking-tight text-[color:var(--lx-text)]">{f.heading}</h3>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">{f.intro}</p>
      <div className={GRID2}>
        <div>
          <label className={LABEL}>{f.name}</label>
          <input
            className={INPUT}
            value={listing.financeContactName ?? ""}
            onChange={(e) => setListingPatch({ financeContactName: autosDraftTextValue(e.target.value) })}
          />
        </div>
        <div>
          <label className={LABEL}>{f.title}</label>
          <input
            className={INPUT}
            value={listing.financeContactTitle ?? ""}
            onChange={(e) => setListingPatch({ financeContactTitle: autosDraftTextValue(e.target.value) })}
          />
        </div>
        <div>
          <label className={LABEL}>{f.phone}</label>
          <input
            className={`${INPUT} tabular-nums`}
            inputMode="tel"
            value={formatPhoneInputDisplay(listing.financeContactPhone ?? "")}
            onChange={(e) => {
              const v = formatPhoneInputDisplay(e.target.value);
              setListingPatch({ financeContactPhone: v.trim() ? v : undefined });
            }}
          />
        </div>
        <div>
          <label className={LABEL}>{f.whatsapp}</label>
          <input
            className={`${INPUT} tabular-nums`}
            inputMode="tel"
            value={formatPhoneInputDisplay(listing.financeContactWhatsapp ?? "")}
            onChange={(e) => {
              const v = formatPhoneInputDisplay(e.target.value);
              setListingPatch({ financeContactWhatsapp: v.trim() ? v : undefined });
            }}
          />
        </div>
        <div>
          <label className={LABEL}>{f.email}</label>
          <input
            className={INPUT}
            type="email"
            autoComplete="email"
            value={listing.financeContactEmail ?? ""}
            onChange={(e) => setListingPatch({ financeContactEmail: autosDraftTextValue(e.target.value) })}
          />
        </div>
        <div>
          <label className={LABEL}>{f.preApprovalUrl}</label>
          <input
            className={INPUT}
            placeholder={copy.app.placeholders.https}
            value={listing.financeApplicationUrl ?? ""}
            onChange={(e) => setListingPatch({ financeApplicationUrl: autosDraftUrlValue(e.target.value) })}
          />
        </div>
        <AutosDealerFinanceImageUpload
          listing={listing}
          setListingPatch={setListingPatch}
          copy={{
            imageUrl: f.imageUrl,
            imageHelper: f.imageHelper,
            imageUrlLabel: f.imageUrlLabel,
            useImageUrl: f.useImageUrl,
            imageConfirmed: f.imageConfirmed,
            imageUpload: f.imageUpload,
            imageUploadHint: f.imageUploadHint,
            imagePreviewTitle: f.imagePreviewTitle,
            imagePreviewFile: f.imagePreviewFile,
            imagePreviewUrl: f.imagePreviewUrl,
            removeImage: f.removeImage,
            httpsPlaceholder: copy.app.placeholders.https,
          }}
        />
        <div className="sm:col-span-2">
          <label className={LABEL}>{f.notes}</label>
          <textarea
            className={`${INPUT} min-h-[80px]`}
            value={listing.financeNotes ?? ""}
            onChange={(e) => setListingPatch({ financeNotes: autosDraftTextValue(e.target.value) })}
          />
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{f.disclaimer}</p>
    </div>
  );
}
