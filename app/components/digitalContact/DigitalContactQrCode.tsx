"use client";

import { useEffect, useState } from "react";
import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { trackDigitalContactEvent } from "@/app/lib/digitalContact/digitalContactAnalyticsClient";
import { copyToClipboard } from "@/app/components/cta/ctaDataHelpers";

type Props = {
  profileSlug: string;
  value: string;
  fileName: string;
  copy: DigitalContactCopy;
};

/**
 * Dynamic QR — reusable across future Digital Contact profiles: pass a new `value`
 * (the profile's canonical URL) and everything else stays the same.
 */
export function DigitalContactQrCode({ profileSlug, value, fileName, copy }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then((QRCode) => {
      QRCode.toDataURL(value, {
        width: 480,
        margin: 2,
        color: { dark: "#1F241C", light: "#FFFDF7" },
      })
        .then((url) => {
          if (!cancelled) {
            setDataUrl(url);
            trackDigitalContactEvent(profileSlug, "qr_view");
          }
        })
        .catch(() => {
          if (!cancelled) setDataUrl(null);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [value, profileSlug]);

  return (
    <section aria-labelledby="dc-qr-title" className="mx-auto w-full max-w-2xl px-5 pt-10 sm:px-6 sm:pt-12">
      <div className="rounded-3xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 text-center shadow-sm sm:p-8">
        <h2 id="dc-qr-title" className="font-serif text-xl font-bold text-[#1F241C] sm:text-2xl">
          {copy.qrTitle}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#3D3428]">{copy.qrBody}</p>

        <div className="mx-auto mt-5 flex h-44 w-44 items-center justify-center rounded-2xl border border-[var(--dc-accent-border)] bg-white p-3 shadow-inner sm:h-52 sm:w-52">
          {dataUrl ? (
            <img src={dataUrl} alt={copy.qrTitle} width={480} height={480} className="h-full w-full object-contain" />
          ) : (
            <div className="h-full w-full animate-pulse rounded-xl bg-[#E8DCC5]" aria-hidden />
          )}
        </div>

        <div className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <a
            href={dataUrl ?? undefined}
            download={dataUrl ? fileName : undefined}
            aria-disabled={!dataUrl}
            onClick={() => trackDigitalContactEvent(profileSlug, "qr_download")}
            className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[var(--dc-button-primary)] bg-[var(--dc-button-primary)] px-5 py-2.5 text-sm font-bold text-[#FFFDF7] transition hover:bg-[var(--dc-button-hover)] sm:w-auto ${!dataUrl ? "pointer-events-none opacity-50" : ""}`}
          >
            {copy.qrDownload}
          </a>
          <button
            type="button"
            onClick={() => {
              void copyToClipboard(value).then((ok) => {
                if (ok) setCopied(true);
              });
              window.setTimeout(() => setCopied(false), 2200);
            }}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#D6C7AD] bg-white px-5 py-2.5 text-sm font-bold text-[#1F241C] transition hover:bg-[#FBF7EF] sm:w-auto"
          >
            {copied ? copy.qrLinkCopied : copy.qrCopyLink}
          </button>
        </div>
      </div>
    </section>
  );
}
