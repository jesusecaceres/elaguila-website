"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  adminBtnSecondary,
  adminCardBase,
  adminTableWrap,
  adminTableZebraRow,
} from "@/app/admin/_components/adminTheme";
import type { MediaKitLeadRow } from "@/app/admin/_lib/leonixLeadsData";
import {
  buildMediaKitMailtoUrl,
  buildMediaKitReplyContent,
  LEONIX_MEDIA_KIT_PDF_URL,
} from "@/app/admin/_lib/leonixLeadReplyTemplates";
import {
  clipLeadText,
  copyTextToClipboard,
  formatLeadCreatedParts,
} from "@/app/admin/_components/leads/adminLeadInboxFormat";

type Props = {
  initialRows: MediaKitLeadRow[];
  total: number;
  limit: number;
};

function CreatedCell({ iso }: { iso: string }) {
  const parts = formatLeadCreatedParts(iso);
  return (
    <div className="leading-tight">
      <span className="block text-xs font-medium text-[#3D3629]">{parts.date}</span>
      {parts.time ? <span className="block text-[10px] text-[#7A7164]">{parts.time}</span> : null}
    </div>
  );
}

export function AdminMediaKitLeadsClient({ initialRows, total, limit }: Props) {
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialRows;
    return initialRows.filter((row) => {
      const hay = [row.name, row.email, row.phone, row.business, row.message, row.source]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [initialRows, search]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function copyValue(label: string, value: string) {
    const ok = await copyTextToClipboard(value);
    showToast(ok ? `${label} copied` : `Could not copy ${label}`);
  }

  return (
    <div className="space-y-6">
      <p className={`${adminCardBase} border-[#E8DFD0] bg-[#FAF7F2]/90 px-4 py-3 text-sm text-[#3D3629]`}>
        Media kit requests from <code className="text-xs">/media-kit</code>. Reply includes{" "}
        <a href={LEONIX_MEDIA_KIT_PDF_URL} className="font-semibold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
          media kit PDF
        </a>
        . Use mailto or copy — no server email sent.
      </p>

      <label className="flex min-w-[200px] max-w-md flex-col gap-1 text-xs font-semibold text-[#5C5346]">
        Search
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, email, business…"
          className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Link href="/api/admin/leads/media-kit/export" className={adminBtnSecondary}>
          Export CSV
        </Link>
        <span className="self-center text-sm text-[#7A7164]">
          Showing {filtered.length} of {initialRows.length} loaded ({total} total, newest {limit})
        </span>
      </div>

      {toast ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm text-emerald-950`}>
          {toast}
        </div>
      ) : null}

      <div className={adminTableWrap}>
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full table-fixed text-left text-sm">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="w-[80px] px-3 py-3">Created</th>
                <th className="w-[120px] px-3 py-3">Lead</th>
                <th className="w-[100px] px-3 py-3">Business</th>
                <th className="w-[180px] px-3 py-3">Message</th>
                <th className="w-[56px] px-3 py-3">Lang</th>
                <th className="w-[100px] px-3 py-3">Source</th>
                <th className="w-[72px] px-3 py-3">Status</th>
                <th className="w-[180px] px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#7A7164]">
                    No media kit leads match the search.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const reply = buildMediaKitReplyContent(row);
                  const mailto = buildMediaKitMailtoUrl(row);
                  return (
                    <tr key={row.id} className={`align-top ${adminTableZebraRow}`}>
                      <td className="px-3 py-3">
                        <CreatedCell iso={row.created_at} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="block font-semibold text-[#1E1810]">{clipLeadText(row.name, 36)}</span>
                        <span className="mt-0.5 block text-xs break-all text-[#5C5346]">{row.email}</span>
                        {row.phone ? (
                          <span className="mt-0.5 block text-[10px] text-[#7A7164]">{row.phone}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-[#3D3629]">{clipLeadText(row.business, 32)}</td>
                      <td className="px-3 py-3 text-xs text-[#5C5346]" title={row.message}>
                        {clipLeadText(row.message, 90)}
                      </td>
                      <td className="px-3 py-3 text-xs uppercase">{row.lang}</td>
                      <td className="px-3 py-3 text-xs font-mono">{row.source}</td>
                      <td className="px-3 py-3 text-xs font-semibold">{row.status}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          <a
                            href={mailto}
                            className="rounded border border-[#E8DFD0] px-2 py-1 text-xs font-semibold hover:bg-[#FAF7F2]"
                          >
                            Open email
                          </a>
                          <button
                            type="button"
                            onClick={() => void copyValue("Reply", reply.body)}
                            className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-100"
                          >
                            Copy reply
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyValue("Email", row.email)}
                            className="rounded border border-[#E8DFD0] px-2 py-1 text-xs hover:bg-[#FAF7F2]"
                          >
                            Copy email
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
