"use client";

import { FiExternalLink, FiMail, FiPhone, FiUser } from "react-icons/fi";
import { SiWhatsapp } from "react-icons/si";
import type { AutoDealerListing } from "../types/autoDealerListing";
import {
  hasDealerFinanceContact,
  resolveFinanceApplicationHref,
  resolveFinanceEmailHref,
  resolveFinanceImageHref,
  resolveFinancePhoneTel,
  resolveFinanceWhatsappHref,
} from "@/app/lib/clasificados/autos/autosDealerFinanceContact";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { AutosSheetCtaLink } from "@/app/clasificados/autos/shared/components/AutosSheetCtaLink";
import {
  autosAnalyticsTrackMeta,
  autosSheetCtaAnalyticsProps,
  type AutosPublicListingAnalyticsProps,
} from "../../lib/autosAnalyticsIdentity";
import { trackAutosContactFromHref } from "../../lib/autosCtaTracking";

const TILE =
  "flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 text-center text-xs font-bold text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]";

export function DealerFinanceContact({
  data,
  embedded = false,
  publicAnalytics,
}: {
  data: AutoDealerListing;
  /** When nested inside `DealerBusinessStack`, omit duplicate top divider. */
  embedded?: boolean;
  publicAnalytics?: AutosPublicListingAnalyticsProps;
}) {
  const { lang, t } = useAutosNegociosPreviewCopy();
  const f = t.preview.finance;
  if (!hasDealerFinanceContact(data)) return null;

  const name = data.financeContactName?.trim();
  const title = data.financeContactTitle?.trim();
  const notes = data.financeNotes?.trim();
  const tel = resolveFinancePhoneTel(data);
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
          source: "detail_contact",
        })
      : undefined;

  return (
    <div className={embedded ? "" : "mt-6 border-t border-[color:var(--lx-nav-border)] pt-6"}>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--lx-text)]">{f.heading}</p>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">{f.intro}</p>
      {imageHref ? (
        <div className="mt-4 flex justify-center sm:justify-start">
          <img
            src={imageHref}
            alt=""
            className="max-h-24 max-w-[200px] rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] object-contain p-2"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : null}
      {name || title ? (
        <div className="mt-4 flex gap-3 rounded-xl border border-[color:var(--lx-gold-border)]/50 bg-[color:var(--lx-nav-hover)]/60 px-3 py-3">
          <FiUser className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
          <div className="min-w-0">
            {name ? <p className="font-bold text-[color:var(--lx-text)]">{name}</p> : null}
            {title ? <p className="text-sm font-medium text-[color:var(--lx-text-2)]">{title}</p> : null}
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {wa ? (
          <AutosSheetCtaLink href={wa} className={TILE} {...sheetProps}>
            <SiWhatsapp className="h-5 w-5 text-[color:var(--lx-gold)]" aria-hidden />
            {f.whatsapp}
          </AutosSheetCtaLink>
        ) : null}
        {tel ? (
          <AutosSheetCtaLink href={`tel:${tel}`} className={TILE} {...sheetProps}>
            <FiPhone className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden />
            {f.call}
          </AutosSheetCtaLink>
        ) : null}
        {email ? (
          <AutosSheetCtaLink href={email} lang={lang} className={TILE} {...sheetProps}>
            <FiMail className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden />
            {f.email}
          </AutosSheetCtaLink>
        ) : null}
        {appHref ? (
          <a
            href={appHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${TILE} col-span-2`}
            onClick={() => {
              if (contactMeta) trackAutosContactFromHref(appHref, contactMeta);
            }}
          >
            <FiExternalLink className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden />
            {f.preApproval}
          </a>
        ) : null}
      </div>
      {notes ? (
        <p className="mt-3 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
          <span className="font-bold text-[color:var(--lx-text)]">{f.notesLabel}: </span>
          {notes}
        </p>
      ) : null}
      <p className="mt-3 text-[10px] leading-relaxed text-[color:var(--lx-muted)]">{f.disclaimer}</p>
    </div>
  );
}
