"use client";

import {
  assetHasUploadedWithUrl,
  ofertaLocalDraftAssetRoleLabel,
} from "@/app/lib/ofertas-locales/ofertasLocalesDraftAssetHelpers";
import type { OfertaLocalDraft, OfertaLocalDraftAsset } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

const BTN =
  "rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-xs font-semibold text-[#7A1E2C] hover:border-[#7A1E2C]/40";

type Props = {
  lang: OfertasLocalesAppLang;
  draft: OfertaLocalDraft;
  onEditFiles: () => void;
};

function chipForAsset(
  asset: OfertaLocalDraftAsset,
  bucket: "flyerAssets" | "couponAssets",
  lang: OfertasLocalesAppLang
) {
  const sectionMode =
    bucket === "flyerAssets" ? ("primaryMainFlyer" as const) : ("mainCoupons" as const);
  const role = ofertaLocalDraftAssetRoleLabel({ asset, bucket, sectionMode, lang });
  const uploaded = assetHasUploadedWithUrl(asset);
  return { role, label: asset.fileName || role, uploaded };
}

export function OfertasLocalesUploadedFilesSummary({ lang, draft, onEditFiles }: Props) {
  const c = ofertasLocalesAppCopy(lang);

  const flyerChips = draft.flyerAssets
    .filter((a) => a.status !== "removed")
    .map((a) => chipForAsset(a, "flyerAssets", lang));
  const couponChips = draft.couponAssets
    .filter((a) => a.status !== "removed")
    .map((a) => chipForAsset(a, "couponAssets", lang));

  if (flyerChips.length === 0 && couponChips.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#D4C4A8]/80 bg-[#FDF8F0]/90 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#7A1E2C]">{c.uploadedFilesSummaryTitle}</p>
          <p className="mt-1 text-xs text-[#1E1814]/60">{c.uploadedFilesSummaryHint}</p>
        </div>
        <button type="button" className={BTN} onClick={onEditFiles}>
          {c.uploadedFilesEditButton}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {flyerChips.map((chip, i) => (
          <span
            key={`flyer-${i}`}
            className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
              chip.uploaded
                ? "border-[#7A1E2C]/30 bg-white text-[#1E1814]"
                : "border-dashed border-[#D4C4A8] text-[#1E1814]/50"
            }`}
          >
            <span className="font-semibold text-[#7A1E2C]">{c.assetsRoleMainFlyer}</span>
            <span className="truncate">{chip.label}</span>
          </span>
        ))}
        {couponChips.map((chip, i) => (
          <span
            key={`coupon-${i}`}
            className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
              chip.uploaded
                ? "border-[#7A1E2C]/30 bg-white text-[#1E1814]"
                : "border-dashed border-[#D4C4A8] text-[#1E1814]/50"
            }`}
          >
            <span className="font-semibold text-[#7A1E2C]">{c.assetsRoleCouponAdditional}</span>
            <span className="truncate">{chip.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
