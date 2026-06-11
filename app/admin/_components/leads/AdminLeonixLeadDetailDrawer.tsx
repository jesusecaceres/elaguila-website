"use client";

import type { ReactNode } from "react";
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminCardBase,
} from "@/app/admin/_components/adminTheme";
import type { LeonixLeadRow } from "@/app/admin/_lib/leonixLeadsData";
import { LEONIX_LEAD_STATUSES } from "@/app/admin/_lib/leonixLeadStatuses";
import {
  buildLeadMailtoUrl,
  buildLeadPhoneScript,
  buildLeadReplyContent,
  leadNextActionLabel,
  leadReplyKindLabel,
} from "@/app/admin/_lib/leonixLeadReplyTemplates";
import {
  inquiryTypeLabel,
  parseInquiryType,
  type InquiryType,
} from "@/app/lib/leonix/inquiryTypes";
import { phoneTelHref } from "@/app/lib/leonix/phoneFormat";
import {
  contactPreferenceBadgeClass,
  formatLeadPhoneDisplay,
  formatLeadWhen,
  inquiryTypeBadgeClass,
  leadStatusBadgeClass,
} from "@/app/admin/_components/leads/adminLeadInboxFormat";

type Props = {
  lead: LeonixLeadRow;
  folder: "active" | "archived";
  saving: boolean;
  lifecycleBusy: boolean;
  editStatus: string;
  editNotes: string;
  editFollowUp: string;
  onClose: () => void;
  onEditStatus: (v: string) => void;
  onEditNotes: (v: string) => void;
  onEditFollowUp: (v: string) => void;
  onSave: () => void;
  onCopy: (label: string, value: string) => void;
  onLifecycle: (action: "archive" | "restore" | "delete" | "mark_contacted") => void;
};

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}>
      {label.replace(/_/g, " ")}
    </span>
  );
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-[#7A7164]">{label}</dt>
      <dd className="mt-0.5 text-sm text-[#3D3629]">{children}</dd>
    </div>
  );
}

export function AdminLeonixLeadDetailDrawer({
  lead,
  folder,
  saving,
  lifecycleBusy,
  editStatus,
  editNotes,
  editFollowUp,
  onClose,
  onEditStatus,
  onEditNotes,
  onEditFollowUp,
  onSave,
  onCopy,
  onLifecycle,
}: Props) {
  const reply = buildLeadReplyContent(lead);
  const inquiryLabel = inquiryTypeLabel(parseInquiryType(lead.inquiry_type) as InquiryType, "en");
  const busy = saving || lifecycleBusy;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        aria-hidden
        onClick={onClose}
      />
      <div
        className={`${adminCardBase} fixed inset-x-3 top-[5vh] z-50 mx-auto flex max-h-[90vh] w-[min(640px,calc(100vw-1.5rem))] flex-col border-[#6B5B2E]/30 shadow-2xl sm:inset-x-auto sm:right-6 sm:left-auto`}
        role="dialog"
        aria-label="Full lead details"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#E8DFD0] p-5 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Lead submission — full details</p>
            <h2 className="mt-1 text-xl font-bold text-[#1E1810]">{lead.full_name}</h2>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge label={lead.status} className={leadStatusBadgeClass(lead.status)} />
              <Badge label={inquiryLabel} className={inquiryTypeBadgeClass(lead.inquiry_type)} />
              <Badge
                label={lead.preferred_contact_method}
                className={contactPreferenceBadgeClass(lead.preferred_contact_method)}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded border border-[#E8DFD0] px-3 py-1.5 text-xs font-bold hover:bg-[#FAF7F2]"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-4">
          <section className="rounded-lg border border-sky-200 bg-sky-50/80 p-4">
            <p className="text-xs font-bold uppercase text-sky-900">
              Recommended reply — {leadReplyKindLabel(reply.kind)}
            </p>
            <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-[#3D3629]">{reply.body}</p>
            <p className="mt-2 text-[10px] text-[#7A7164]">
              Mailto opens your email client — Leonix does not send email from the server.
            </p>
          </section>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailField label="Created">{formatLeadWhen(lead.created_at)}</DetailField>
            <DetailField label="Next action">{leadNextActionLabel(lead)}</DetailField>
            <DetailField label="Email">
              <a href={`mailto:${lead.email}`} className="break-all font-medium text-[#6B5B2E] underline">
                {lead.email}
              </a>
            </DetailField>
            <DetailField label="Phone">
              {lead.phone ? (
                <a href={phoneTelHref(lead.phone)} className="font-medium text-[#6B5B2E] underline">
                  {formatLeadPhoneDisplay(lead.phone)}
                </a>
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Business">{lead.business_name || "—"}</DetailField>
            <DetailField label="City / area">{lead.city_area || "—"}</DetailField>
            <DetailField label="Inquiry type">
              {inquiryLabel}
              <span className="mt-0.5 block font-mono text-[11px] text-[#7A7164]">{lead.inquiry_type}</span>
            </DetailField>
            <DetailField label="Business category">{lead.business_category || "—"}</DetailField>
            <DetailField label="Website / social">
              <span className="break-all">{lead.website_or_social || "—"}</span>
            </DetailField>
            <DetailField label="Language">{lead.lang}</DetailField>
            <DetailField label="Source page">{lead.source_page}</DetailField>
            <DetailField label="Source CTA">{lead.source_cta || "—"}</DetailField>
            <DetailField label="Launch updates">{lead.wants_launch_updates ? "Yes" : "No"}</DetailField>
            <DetailField label="Consent to contact">{lead.consent_to_contact ? "Yes" : "No"}</DetailField>
            <DetailField label="Last contacted">
              {lead.last_contacted_at ? formatLeadWhen(lead.last_contacted_at) : "—"}
            </DetailField>
            <DetailField label="Follow-up scheduled">
              {lead.follow_up_at ? formatLeadWhen(lead.follow_up_at) : "—"}
            </DetailField>
            {lead.archived_at ? (
              <DetailField label="Archived">{formatLeadWhen(lead.archived_at)}</DetailField>
            ) : null}
          </dl>

          <div className="mt-5">
            <DetailField label="Full message">
              <div className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-[#FAF7F2] p-4 text-sm leading-relaxed text-[#3D3629]">
                {lead.message.trim() || "—"}
              </div>
            </DetailField>
          </div>

          {lead.internal_notes?.trim() ? (
            <div className="mt-4">
              <DetailField label="Internal notes (saved)">
                <div className="mt-1 whitespace-pre-wrap rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-[#3D3629]">
                  {lead.internal_notes}
                </div>
              </DetailField>
            </div>
          ) : null}

          <div className="mt-5 space-y-3 border-t border-[#E8DFD0] pt-4">
            <label className="block text-xs font-bold uppercase text-[#5C5346]">
              Pipeline status
              <select
                value={editStatus}
                onChange={(e) => onEditStatus(e.target.value)}
                disabled={busy}
                className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm"
              >
                {LEONIX_LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase text-[#5C5346]">
              Follow-up date
              <input
                type="date"
                value={editFollowUp}
                onChange={(e) => onEditFollowUp(e.target.value)}
                disabled={busy}
                className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-bold uppercase text-[#5C5346]">
              Internal notes
              <textarea
                value={editNotes}
                onChange={(e) => onEditNotes(e.target.value)}
                disabled={busy}
                rows={4}
                maxLength={4000}
                className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm"
                placeholder="Call outcome, deal stage, next steps…"
              />
            </label>
          </div>
        </div>

        <div className="shrink-0 space-y-3 border-t border-[#E8DFD0] bg-[#FAF7F2]/50 p-5">
          <p className="text-xs font-bold uppercase text-[#5C5346]">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            <a href={buildLeadMailtoUrl(lead)} className={adminBtnPrimary}>
              Open email
            </a>
            <button type="button" onClick={() => onCopy("Reply", reply.body)} className={adminBtnSecondary}>
              Copy reply
            </button>
            <button type="button" onClick={() => onCopy("Email", lead.email)} className={adminBtnSecondary}>
              Copy email
            </button>
            {lead.phone ? (
              <>
                <a href={phoneTelHref(lead.phone)} className={adminBtnSecondary}>
                  Call
                </a>
                <button
                  type="button"
                  onClick={() => onCopy("Phone script", buildLeadPhoneScript(lead))}
                  className={adminBtnSecondary}
                >
                  Copy phone script
                </button>
              </>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => onLifecycle("mark_contacted")}
              className={adminBtnSecondary}
            >
              Mark contacted
            </button>
            <button type="button" disabled={busy} onClick={() => onSave()} className={adminBtnSecondary}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-[#E8DFD0]/80 pt-3">
            {folder === "active" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onLifecycle("archive")}
                className="rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-900 hover:bg-violet-100 disabled:opacity-50"
              >
                Archive lead
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onLifecycle("restore")}
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
              >
                Restore to inbox
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => onLifecycle("delete")}
              className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-900 hover:bg-rose-100 disabled:opacity-50"
            >
              Delete (soft)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
