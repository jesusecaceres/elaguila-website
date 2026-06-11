"use client";

import type { ReactNode } from "react";
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminCardBase,
} from "@/app/admin/_components/adminTheme";
import type { NewsletterSubscriberRow } from "@/app/admin/_lib/leonixLeadsData";
import {
  buildNewsletterMailtoUrl,
  buildNewsletterReplyContent,
} from "@/app/admin/_lib/leonixLeadReplyTemplates";
import {
  formatLeadWhen,
  parseInterestChips,
} from "@/app/admin/_components/leads/adminLeadInboxFormat";
import type { LaunchLeadFolder } from "@/app/admin/_components/leads/AdminLaunchLeadRowActions";

type Props = {
  row: NewsletterSubscriberRow;
  folder: LaunchLeadFolder;
  saving: boolean;
  lifecycleBusy: boolean;
  editNotes: string;
  onClose: () => void;
  onEditNotes: (v: string) => void;
  onSave: () => void;
  onCopy: (label: string, value: string) => void;
  onLifecycle: (action: "archive" | "restore" | "delete") => void;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-[#7A7164]">{label}</dt>
      <dd className="mt-0.5 text-sm text-[#3D3629]">{children}</dd>
    </div>
  );
}

export function AdminNewsletterSubscriberDetailDrawer({
  row,
  folder,
  saving,
  lifecycleBusy,
  editNotes,
  onClose,
  onEditNotes,
  onSave,
  onCopy,
  onLifecycle,
}: Props) {
  const reply = buildNewsletterReplyContent(row);
  const busy = saving || lifecycleBusy;
  const chips = parseInterestChips(row.interests);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" aria-hidden onClick={onClose} />
      <div
        className={`${adminCardBase} fixed inset-x-3 top-[5vh] z-50 mx-auto flex max-h-[90vh] w-[min(640px,calc(100vw-1.5rem))] flex-col border-[#6B5B2E]/30 shadow-2xl sm:inset-x-auto sm:right-6 sm:left-auto`}
        role="dialog"
        aria-label="Newsletter subscriber details"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#E8DFD0] p-5 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Newsletter subscriber — full details</p>
            <h2 className="mt-1 text-xl font-bold text-[#1E1810]">{row.name || row.email}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-[#E8DFD0] px-3 py-1.5 text-xs font-bold">
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-4">
          <section className="rounded-lg border border-sky-200 bg-sky-50/80 p-4">
            <p className="text-xs font-bold uppercase text-sky-900">Recommended reply</p>
            <p className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap text-sm text-[#3D3629]">{reply.body}</p>
          </section>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Created">{formatLeadWhen(row.created_at)}</Field>
            <Field label="Status">{row.status}</Field>
            <Field label="Email">
              <a href={`mailto:${row.email}`} className="break-all font-medium text-[#6B5B2E] underline">
                {row.email}
              </a>
            </Field>
            <Field label="Name">{row.name || "—"}</Field>
            <Field label="City">{row.city || "—"}</Field>
            <Field label="ZIP">{row.zip_code || "—"}</Field>
            <Field label="Preferred language">{row.preferred_language}</Field>
            <Field label="Language (form)">{row.lang}</Field>
            <Field label="Source">{row.source}</Field>
            <Field label="Consent">{formatLeadWhen(row.consent_timestamp)}</Field>
            {row.archived_at ? <Field label="Archived">{formatLeadWhen(row.archived_at)}</Field> : null}
          </dl>

          <div className="mt-5">
            <Field label="Interests">
              {chips.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex rounded-full bg-[#F3E6D2] px-2 py-0.5 text-xs font-semibold text-[#5C5346] ring-1 ring-[#E8DFD0]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              )}
            </Field>
          </div>

          <label className="mt-5 block text-xs font-bold uppercase text-[#5C5346]">
            Internal notes
            <textarea
              value={editNotes}
              onChange={(e) => onEditNotes(e.target.value)}
              disabled={busy}
              rows={3}
              maxLength={4000}
              className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="shrink-0 space-y-3 border-t border-[#E8DFD0] bg-[#FAF7F2]/50 p-5">
          <div className="flex flex-wrap gap-2">
            <a href={buildNewsletterMailtoUrl(row)} className={adminBtnPrimary}>
              Reply
            </a>
            <button type="button" onClick={() => onCopy("Reply", reply.body)} className={adminBtnSecondary}>
              Copy reply
            </button>
            <button type="button" onClick={() => onCopy("Email", row.email)} className={adminBtnSecondary}>
              Email
            </button>
            <button type="button" disabled={busy} onClick={onSave} className={adminBtnSecondary}>
              {saving ? "Saving…" : "Save notes"}
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
                Archive
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onLifecycle("restore")}
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
              >
                Restore
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
