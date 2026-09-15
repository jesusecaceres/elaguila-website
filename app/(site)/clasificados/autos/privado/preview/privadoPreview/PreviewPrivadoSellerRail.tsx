"use client";

import { useState } from "react";
import Link from "next/link";
import { FiCopy, FiMail, FiMessageCircle, FiPhone, FiPrinter } from "react-icons/fi";
import { SiWhatsapp } from "react-icons/si";
import type { PreviewPrivadoVm } from "./previewPrivadoFields";
import { previewPrivadoCopy, type PreviewPrivadoLang } from "./previewPrivadoCopy";
import {
  previewPrivadoCardClass,
  previewPrivadoPriceClass,
  previewPrivadoPrimaryBtnClass,
  previewPrivadoSecondaryBtnClass,
} from "./previewPrivadoTokens";

type PreviewAction = "call" | "whatsapp" | "email" | "sms" | "site" | null;

export function PreviewPrivadoSellerRail({
  vm,
  lang,
  editBackHref,
}: {
  vm: PreviewPrivadoVm;
  lang: PreviewPrivadoLang;
  editBackHref?: string;
}) {
  const copy = previewPrivadoCopy(lang);
  const [action, setAction] = useState<PreviewAction>(null);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const detailForAction =
    action === "call" || action === "sms"
      ? vm.phoneDisplay
      : action === "whatsapp"
        ? vm.whatsappDisplay
        : action === "email"
          ? vm.email
          : undefined;

  async function copyText(value: string, kind: "detail" | "share") {
    try {
      await navigator.clipboard.writeText(value);
      if (kind === "share") {
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 1600);
      } else {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      /* clipboard may be blocked */
    }
  }

  const hasAnyContact = vm.hasCall || vm.hasWhatsapp || vm.hasEmail;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className={`${previewPrivadoCardClass} overflow-hidden`}>
        <div className="bg-[#7A1E2C] px-5 py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#FFFCF7]">
          {copy.contactHeading}
        </div>
        <div className="p-5">
          {vm.priceLabel ? (
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">{copy.priceLabel}</p>
              <p className={`mt-1 ${previewPrivadoPriceClass}`}>{vm.priceLabel}</p>
            </div>
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84A]">{copy.privateSeller}</p>
          {vm.sellerName ? (
            <h2 className="mt-1 break-words text-xl font-extrabold tracking-tight text-[#1F241C]">{vm.sellerName}</h2>
          ) : null}
          {vm.location ? <p className="mt-2 text-sm text-[#5C5346]">{vm.location}</p> : null}

          <div className="mt-5 flex flex-col gap-3">
            {vm.hasCall ? (
              <button type="button" className={previewPrivadoPrimaryBtnClass} onClick={() => setAction("call")}>
                <FiPhone className="h-5 w-5" />
                {copy.call}
              </button>
            ) : null}
            {vm.hasWhatsapp ? (
              <button type="button" className={previewPrivadoSecondaryBtnClass} onClick={() => setAction("whatsapp")}>
                <SiWhatsapp className="h-5 w-5 text-[#25D366]" />
                {copy.whatsapp}
              </button>
            ) : null}
            {vm.hasEmail ? (
              <button type="button" className={previewPrivadoSecondaryBtnClass} onClick={() => setAction("email")}>
                <FiMail className="h-5 w-5" />
                {copy.email}
              </button>
            ) : null}
            {vm.hasSms ? (
              <button type="button" className={previewPrivadoSecondaryBtnClass} onClick={() => setAction("sms")}>
                <FiMessageCircle className="h-5 w-5" />
                {copy.sms}
              </button>
            ) : null}
            {hasAnyContact ? (
              <button type="button" className={previewPrivadoSecondaryBtnClass} onClick={() => setAction("site")}>
                <FiMessageCircle className="h-5 w-5" />
                {copy.siteMessage}
              </button>
            ) : null}
          </div>

          {action ? (
            <div className="mt-4 rounded-[12px] border border-[#D6C7AD]/80 bg-[#FBF7EF] p-3">
              <p className="text-sm font-bold text-[#1F241C]">{copy.previewActionTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#5C5346]">{copy.previewActionBody}</p>
              {detailForAction ? (
                <p className="mt-2 break-all text-sm font-semibold tabular-nums text-[#1F241C]">{detailForAction}</p>
              ) : null}
              {detailForAction ? (
                <button
                  type="button"
                  className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#7A1E2C]"
                  onClick={() => void copyText(detailForAction, "detail")}
                >
                  <FiCopy className="h-4 w-4" />
                  {copied ? copy.copied : copy.copyValue}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {vm.meetingNote ? (
        <section className={`${previewPrivadoCardClass} p-5`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A6B1F]">{copy.meetingNote}</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#5C5346]">{vm.meetingNote}</p>
        </section>
      ) : null}

      <section className={`${previewPrivadoCardClass} p-5`}>
        <div className="flex flex-col gap-2">
          {editBackHref ? (
            <Link href={editBackHref} className={previewPrivadoSecondaryBtnClass}>
              {copy.backToEdit}
            </Link>
          ) : null}
          <button
            type="button"
            className={previewPrivadoSecondaryBtnClass}
            onClick={() => void copyText(typeof window !== "undefined" ? window.location.href : "", "share")}
          >
            <FiCopy className="h-4 w-4" />
            {shareCopied ? copy.copied : copy.share}
          </button>
          <button type="button" className={previewPrivadoSecondaryBtnClass} onClick={() => window.print()}>
            <FiPrinter className="h-4 w-4" />
            {copy.print}
          </button>
        </div>
      </section>

      <section className={`${previewPrivadoCardClass} p-5`}>
        <p className="text-sm font-bold text-[#1F241C]">{copy.safetyTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-[#5C5346]">{copy.safetyBody}</p>
      </section>
    </div>
  );
}
