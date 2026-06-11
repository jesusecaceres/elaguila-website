"use client";

import type { ReactNode } from "react";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import {
  AdminLaunchLeadRowActions,
  type LaunchLeadFolder,
} from "@/app/admin/_components/leads/AdminLaunchLeadRowActions";

type Props = {
  createdAt: ReactNode;
  statusBadge: ReactNode;
  title: string;
  subtitle?: string;
  wants?: ReactNode;
  source?: string;
  contactEmail?: string;
  contactPhone?: string;
  folder: LaunchLeadFolder;
  mailtoHref: string;
  lifecycleBusy?: boolean;
  onView: () => void;
  onCopyReply: () => void;
  onEmail: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
};

export function AdminLaunchLeadMobileCard({
  createdAt,
  statusBadge,
  title,
  subtitle,
  wants,
  source,
  contactEmail,
  contactPhone,
  folder,
  mailtoHref,
  lifecycleBusy,
  onView,
  onCopyReply,
  onEmail,
  onArchive,
  onRestore,
  onDelete,
}: Props) {
  return (
    <article className={`${adminCardBase} break-words p-4`} data-testid="launch-lead-mobile-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#1E1810] break-words">{title}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-[#5C5346] break-words">{subtitle}</p> : null}
        </div>
        {statusBadge}
      </div>

      <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-[#5C5346]">
        <span className="font-semibold text-[#7A7164]">{createdAt}</span>
        {wants ? <div className="break-words">{wants}</div> : null}
        {source ? (
          <span>
            Source: <span className="font-mono break-all">{source}</span>
          </span>
        ) : null}
        {contactEmail ? (
          <span>
            Email: <span className="break-all">{contactEmail}</span>
          </span>
        ) : null}
        {contactPhone ? <span>Phone: {contactPhone}</span> : null}
      </div>

      <div className="mt-3">
        <AdminLaunchLeadRowActions
          folder={folder}
          mailtoHref={mailtoHref}
          phone={contactPhone}
          lifecycleBusy={lifecycleBusy}
          onView={onView}
          onCopyReply={onCopyReply}
          onEmail={onEmail}
          onArchive={onArchive}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}
