"use client";

import {
  adminDashboardCtaPrimary,
  adminDashboardCtaView,
  adminDashboardCtaActive,
  adminDashboardCtaDanger,
  adminDashboardCtaNeutral,
  adminQueueActionCompact,
} from "@/app/admin/_components/adminTheme";
import { AdminDashboardCtaButton, AdminDashboardCtaGrid } from "@/app/admin/_components/AdminDashboardCta";
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

const compact = adminQueueActionCompact;

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
    <div className="min-w-0 space-y-2" data-testid="launch-lead-row-actions">
      <AdminDashboardCtaGrid columns={2}>
        <AdminDashboardCtaButton
          label="View"
          variant="view"
          onClick={onView}
          className={compact}
          title="Open lead details"
        />
        <a
          href={mailtoHref}
          className={`${adminDashboardCtaPrimary} ${compact}`}
          title="Reply via mailto helper"
        >
          Reply
        </a>
        <AdminDashboardCtaButton
          label="Copy reply"
          variant="neutral"
          onClick={onCopyReply}
          className={compact}
        />
        <AdminDashboardCtaButton label="Email" variant="neutral" onClick={onEmail} className={compact} />
        {tel ? (
          <a href={tel} className={`${adminDashboardCtaNeutral} ${compact}`}>
            Phone
          </a>
        ) : null}
      </AdminDashboardCtaGrid>
      <AdminDashboardCtaGrid columns={2}>
        {folder === "active" ? (
          <AdminDashboardCtaButton
            label="Archive"
            variant="active"
            disabled={busy}
            onClick={onArchive}
            className={compact}
          />
        ) : (
          <AdminDashboardCtaButton
            label="Restore"
            variant="active"
            disabled={busy}
            onClick={onRestore}
            className={compact}
          />
        )}
        <AdminDashboardCtaButton
          label="Delete"
          variant="danger"
          disabled={busy}
          onClick={onDelete}
          className={compact}
        />
      </AdminDashboardCtaGrid>
    </div>
  );
}
