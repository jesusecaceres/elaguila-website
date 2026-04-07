"use client";

import { useSearchParams } from "next/navigation";

export function SiteWideBannersClient(props: {
  showNotice: boolean;
  showPromo: boolean;
  noticeEs: string;
  noticeEn: string;
  promoEs: string;
  promoEn: string;
}) {
  const searchParams = useSearchParams();
  const lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const notice = lang === "en" ? (props.noticeEn || props.noticeEs) : (props.noticeEs || props.noticeEn);
  const promo = lang === "en" ? (props.promoEn || props.promoEs) : (props.promoEs || props.promoEn);

  const showN = props.showNotice && notice.trim().length > 0;
  const showP = props.showPromo && promo.trim().length > 0;

  if (!showN && !showP) return null;

  return (
    <div className="relative z-20 w-full">
      {showN ? (
        <div className="border-b border-sky-200/70 bg-sky-50/95 px-4 py-2 text-center text-sm font-medium text-sky-950">
          {notice}
        </div>
      ) : null}
      {showP ? (
        <div className="border-b border-[#C9B46A]/40 bg-gradient-to-r from-[#FFF8F0] to-[#FFFCF7] px-4 py-2 text-center text-sm text-[#3D3428]">
          {promo}
        </div>
      ) : null}
    </div>
  );
}
