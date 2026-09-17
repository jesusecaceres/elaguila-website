"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { FiExternalLink, FiMail, FiMessageSquare, FiPhone, FiUser } from "react-icons/fi";
import { SiWhatsapp } from "react-icons/si";
import type { AutoDealerListing } from "../types/autoDealerListing";
import {
  hasDealerFinanceContact,
  resolveFinanceApplicationHref,
  resolveFinanceEmailHref,
  resolveFinanceImageHref,
  resolveFinancePhoneTel,
  resolveFinanceSmsTel,
  resolveFinanceWhatsappHref,
} from "@/app/lib/clasificados/autos/autosDealerFinanceContact";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { AutosDirectContactLink } from "@/app/clasificados/autos/shared/components/AutosDirectContactLink";
import { buildSendEmailIntent, CtaActionSheet } from "@/app/components/cta";
import { buildAutosContactEmailBody } from "@/app/lib/clasificados/autos/autosContactEmailBody";
import type { CtaSheetIntent } from "@/app/components/cta/types";
import {
  autosAnalyticsTrackMeta,
  autosSheetCtaAnalyticsProps,
  type AutosPublicListingAnalyticsProps,
} from "../../lib/autosAnalyticsIdentity";
import { trackAutosContactFromHref, trackAutosFinancePreapprovalCta } from "../../lib/autosCtaTracking";
import {
  autosPreviewBusinessHubSectionLabelClass,
  autosPreviewRectActionClass,
  autosPreviewWhatsappBtnClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

function emailFromMailtoHref(href: string): string {
  const h = href.trim();
  if (!h.toLowerCase().startsWith("mailto:")) return "";
  try {
    return decodeURIComponent(h.slice(7).split(/[?#]/)[0] ?? "");
  } catch {
    return h.slice(7).split(/[?#]/)[0] ?? "";
  }
}

export function DealerFinanceContact({
  data,
  embedded = false,
  publicAnalytics,
  premium = false,
}: {
  data: AutoDealerListing;
  /** When nested inside `DealerBusinessStack`, omit duplicate top divider. */
  embedded?: boolean;
  publicAnalytics?: AutosPublicListingAnalyticsProps;
  premium?: boolean;
}) {
  const { lang, t } = useAutosNegociosPreviewCopy();
  const f = t.preview.finance;
  const [emailSheetIntent, setEmailSheetIntent] = useState<CtaSheetIntent | null>(null);
  if (!hasDealerFinanceContact(data)) return null;

  const name = data.financeContactName?.trim();
  const title = data.financeContactTitle?.trim();
  const notes = data.financeNotes?.trim();
  const tel = resolveFinancePhoneTel(data);
  const sms = resolveFinanceSmsTel(data);
  const wa = resolveFinanceWhatsappHref(data);
  const email = resolveFinanceEmailHref(data);
  const appHref = resolveFinanceApplicationHref(data);
  const imageHref = resolveFinanceImageHref(data);
  const sheetProps = autosSheetCtaAnalyticsProps(publicAnalytics);
  const contactMeta =
    publicAnalytics?.listingSourceId?.trim()
      ? autosAnalyticsTrackMeta({
          sourceId: publicAnalytics.listingSourceId,
          leonixAdId: publicAnalytics.leonixAdId,
          lane: publicAnalytics.lane,
          inventoryRole: publicAnalytics.inventoryRole,
          dealerInventoryGroupId: publicAnalytics.dealerInventoryGroupId,
          dealerInventoryParentListingId: publicAnalytics.dealerInventoryParentListingId,
          source: "detail_contact",
        })
      : undefined;
  const openFinanceEmail = () => {
    if (!email) return;
    if (contactMeta) trackAutosContactFromHref(email, contactMeta);
    setEmailSheetIntent(
      buildSendEmailIntent({
        email: emailFromMailtoHref(email),
        subject: name ? `Leonix · ${name}` : "Leonix",
        body: buildAutosContactEmailBody({
          lang,
          recipientName: name,
          vehicleTitle: data.vehicleTitle,
          intent: "finance",
        }),
      }),
    );
  };

  const actionClass = premium ? autosPreviewRectActionClass : autosPreviewRectActionClass;
  const waClass = premium ? autosPreviewWhatsappBtnClass : actionClass;
  const headingClass = premium ? autosPreviewBusinessHubSectionLabelClass : "text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--lx-text)]";

  return (
    <>
    <div className={embedded ? "" : "mt-6 border-t border-[color:var(--lx-nav-border)] pt-6"}>
      <p className={headingClass}>{f.heading}</p>
      <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">{f.intro}</p>
      {imageHref ? (
        <div className="mt-4 flex justify-start rounded-[10px] border border-[#D6C7AD]/70 bg-[#FBF7EF] p-3">
          <img
            src={imageHref}
            alt=""
            className="max-h-20 max-w-[180px] object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : null}
      {name || title ? (
        <div className="mt-4 flex gap-3 rounded-[10px] border border-[#D6C7AD]/70 bg-[#FBF7EF] px-3.5 py-3">
          <FiUser className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
          <div className="min-w-0">
            {name ? <p className="font-bold text-[#1F241C]">{name}</p> : null}
            {title ? <p className="text-sm font-medium text-[#5C5346]">{title}</p> : null}
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-2">
        {/* Owner-locked channel hierarchy: (Call, Text) as one row, (Email, WhatsApp) as the next —
            never a fallback that silently swaps one semantic channel for another. Each row collapses
            to a full-width single button when only one of its pair exists, and disappears entirely
            when neither does — no empty grid slot, no disabled placeholder. */}
        {(
          [
            [
              tel
                ? {
                    key: "call",
                    node: (
                      <AutosDirectContactLink href={`tel:${tel}`} className={actionClass} {...sheetProps}>
                        <FiPhone className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                        {f.call}
                      </AutosDirectContactLink>
                    ),
                  }
                : null,
              sms
                ? {
                    key: "text",
                    node: (
                      <AutosDirectContactLink href={`sms:${sms}`} className={actionClass} {...sheetProps}>
                        <FiMessageSquare className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                        {f.text}
                      </AutosDirectContactLink>
                    ),
                  }
                : null,
            ],
            [
              email
                ? {
                    key: "email",
                    node: (
                      <button type="button" onClick={openFinanceEmail} className={actionClass}>
                        <FiMail className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                        {f.email}
                      </button>
                    ),
                  }
                : null,
              wa
                ? {
                    key: "whatsapp",
                    node: (
                      <AutosDirectContactLink href={wa} className={`${waClass} min-h-[44px]`} {...sheetProps}>
                        <SiWhatsapp className="h-5 w-5 shrink-0 text-white" aria-hidden />
                        {f.whatsapp}
                      </AutosDirectContactLink>
                    ),
                  }
                : null,
            ],
          ] as Array<Array<{ key: string; node: ReactNode } | null>>
        ).map((pair, rowIdx) => {
          const present = pair.filter((item): item is { key: string; node: ReactNode } => item != null);
          if (present.length === 0) return null;
          return (
            <div key={`fin-row-${rowIdx}`} className={present.length === 2 ? "grid grid-cols-2 gap-2" : ""}>
              {present.map((item) => (
                <div key={item.key}>{item.node}</div>
              ))}
            </div>
          );
        })}
        {appHref ? (
          <a
            href={appHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionClass} min-h-[44px] gap-2`}
            onClick={() => {
              if (contactMeta) trackAutosFinancePreapprovalCta(contactMeta);
            }}
          >
            <FiExternalLink className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
            {f.preApproval}
          </a>
        ) : null}
      </div>
      {notes ? (
        <p className="mt-3 rounded-[8px] border border-[#D6C7AD]/50 bg-[#FBF7EF] px-3 py-2 text-xs leading-relaxed text-[#5C5346]">
          <span className="font-bold text-[#1F241C]">{f.notesLabel}: </span>
          {notes}
        </p>
      ) : null}
      <p className="mt-3 text-[10px] leading-relaxed text-[#8A7A68]">{f.disclaimer}</p>
    </div>
    <CtaActionSheet
      open={emailSheetIntent != null}
      onClose={() => setEmailSheetIntent(null)}
      intent={emailSheetIntent}
      lang={lang}
    />
    </>
  );
}
