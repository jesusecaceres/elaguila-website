"use client";

import type { ViajesContactChannel } from "../data/viajesOfferDetailSampleData";
import type { ViajesUi } from "../data/viajesUiCopy";
import { ViajesContactChannelsRow } from "./ViajesContactChannelsRow";
import { ViajesPublicInquiryForm } from "./ViajesPublicInquiryForm";
import { ViajesSheetCtaLink } from "./ViajesSheetCtaLink";

const ACCENT = "#D97706";

const PRIVATE_SAFE_KINDS = new Set<ViajesContactChannel["kind"]>(["tel", "telOffice", "sms", "whatsapp", "email", "website"]);

export function ViajesOfferInquiryHub({
  displayName,
  channels,
  stagedListingId,
  preview,
  ui,
  disclosure,
}: {
  displayName: string;
  channels: ViajesContactChannel[];
  stagedListingId?: string | null;
  preview?: boolean;
  ui: ViajesUi;
  disclosure: string;
}) {
  const od = ui.offerDetail;
  const safe = channels.filter((c) => PRIVATE_SAFE_KINDS.has(c.kind) && c.href.trim());
  const primary = safe[0];

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/90 via-[color:var(--lx-card)] to-[color:var(--lx-card)] p-5 shadow-[0_10px_40px_-20px_rgba(71,85,105,0.18)] sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-black/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {od.identityBadgePrivate}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{od.privatePostedBy}</span>
      </div>
      <h2 className="mt-3 text-xl font-bold text-[color:var(--lx-text)] sm:text-2xl">
        {displayName || (ui.lang === "en" ? "Private seller" : "Particular")}
      </h2>
      <div className="mt-3 rounded-xl border border-slate-200/90 bg-slate-50/95 px-4 py-3 text-sm leading-relaxed text-slate-900">
        {disclosure}
      </div>
      <p className="mt-3 text-sm text-[color:var(--lx-muted)]">
        {ui.lang === "en"
          ? "Exact private address stays hidden. Contact the seller through the channels they shared."
          : "La dirección exacta permanece oculta. Contacta al anunciante por los canales que compartió."}
      </p>

      {safe.length ? (
        <ViajesContactChannelsRow channels={safe} ariaLabel={od.contactChannelsHeading} lang={ui.lang} />
      ) : null}

      {primary ? (
        <div className="mt-4 sm:max-w-sm">
          <ViajesSheetCtaLink
            href={primary.href}
            lang={ui.lang}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-md"
            style={{ backgroundColor: ACCENT }}
          >
            {primary.label}
          </ViajesSheetCtaLink>
        </div>
      ) : null}

      {!preview && stagedListingId ? (
        <div className="mt-6 border-t border-[color:var(--lx-nav-border)] pt-6">
          <ViajesPublicInquiryForm stagedListingId={stagedListingId} copy={od.inquiry} />
        </div>
      ) : null}
    </section>
  );
}
