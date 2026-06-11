"use client";

import { adminBtnPrimary } from "@/app/admin/_components/adminTheme";
import { phoneTelHref } from "@/app/lib/leonix/phoneFormat";

export type LaunchLeadFolder = "active" | "archived";

type Props = {
  folder: LaunchLeadFolder;
  mailtoHref: string;
  phone?: string;
  lifecycleBusy?: boolean;
  onView: () => void;
  onCopyReply: () => void;
  onEmail: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
};

const actionBtn =
  "rounded border px-2 py-1 text-xs font-semibold transition disabled:opacity-50";

export function AdminLaunchLeadRowActions({
  folder,
  mailtoHref,
  phone,
  lifecycleBusy,
  onView,
  onCopyReply,
  onEmail,
  onArchive,
  onRestore,
  onDelete,
}: Props) {
  const busy = Boolean(lifecycleBusy);
  const tel = phone?.trim() ? phoneTelHref(phone) : null;

  return (
    <div className="flex min-w-[220px] flex-col gap-1.5" data-testid="launch-lead-row-actions">
      <button
        type="button"
        onClick={onView}
        className={`${adminBtnPrimary} w-full justify-center px-3 py-1.5 text-xs`}
      >
        View
      </button>
      <div className="flex flex-wrap gap-1">
        <a
          href={mailtoHref}
          className={`${actionBtn} border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100`}
        >
          Reply
        </a>
        <button
          type="button"
          onClick={onCopyReply}
          className={`${actionBtn} border-[#E8DFD0] text-[#3D3629] hover:bg-[#FAF7F2]`}
        >
          Copy reply
        </button>
        <button
          type="button"
          onClick={onEmail}
          className={`${actionBtn} border-[#E8DFD0] text-[#3D3629] hover:bg-[#FAF7F2]`}
        >
          Email
        </button>
        {tel ? (
          <a
            href={tel}
            className={`${actionBtn} border-[#E8DFD0] text-[#3D3629] hover:bg-[#FAF7F2]`}
          >
            Phone
          </a>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1">
        {folder === "active" ? (
          <button
            type="button"
            disabled={busy}
            onClick={onArchive}
            className={`${actionBtn} border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100`}
          >
            Archive
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={onRestore}
            className={`${actionBtn} border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100`}
          >
            Restore
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className={`${actionBtn} border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
