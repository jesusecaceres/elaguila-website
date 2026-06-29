"use client";

import Link from "next/link";
import { adminQueueRowAnchorId, adminQueueRowClass } from "@/app/admin/_lib/adminQueueActionFlow";
import { adminCardBase, adminDashboardCtaView } from "@/app/admin/_components/adminTheme";
import { ClassifiedAdminRowActions } from "../../_components/ClassifiedAdminRowActions";
import { AdminActionExplainerGrid } from "@/app/admin/_components/AdminActionExplainer";
import {
  setServiciosListingLeonixVerifiedAction,
  updateServiciosPublicListingStatusAction,
} from "../actions";
import type { ServiciosPublicAdminRow } from "../_lib/serviciosAdminOpsTypes";
import { ServiciosAdminMonetizationPanel } from "./ServiciosAdminMonetizationPanel";

function formatWhen(iso: string | null | undefined, fallback?: string): string {
  const raw = iso ?? fallback;
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d.toLocaleString() : "—";
}

function statusBadgeClass(status: string | null): string {
  const s = (status ?? "").toLowerCase();
  if (s === "published") return "border-[#2A4536]/40 bg-[#F4FAF2] text-[#2A4536]";
  if (s === "suspended" || s === "rejected") return "border-rose-300 bg-rose-50 text-rose-900";
  if (s === "pending_review" || s === "paused_unpublished") return "border-[#C9782F]/40 bg-[#FFF3E6] text-[#8A4B12]";
  return "border-[#E8DFD0] bg-[#FAF7F2] text-[#5C5346]";
}

export function ServiciosAdminOpsListingCard({
  row,
  likes,
  saves,
  highlighted,
}: {
  row: ServiciosPublicAdminRow;
  likes: number;
  saves: number;
  highlighted: boolean;
}) {
  const publicLive = (row.listing_status ?? "") === "published";

  return (
    <article
      id={adminQueueRowAnchorId(row.id)}
      className={`${adminCardBase} min-w-0 overflow-hidden border-[#E8DFD0]/80 p-4 sm:p-5 ${adminQueueRowClass(highlighted)}`}
      data-testid="servicios-admin-listing-card"
    >
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E8DFD0]/70 pb-3">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-[#1E1810]">{row.business_name}</h3>
              <p className="mt-0.5 text-sm text-[#5C5346]">{row.city || "—"}</p>
            </div>
            <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(row.listing_status)}`}>
              {row.listing_status ?? "—"}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-2 text-xs text-[#5C5346] sm:grid-cols-2">
            <div>
              <dt className="font-bold uppercase tracking-wide text-[#7A7164]">Slug</dt>
              <dd className="mt-0.5 break-all font-mono text-[#3D3428]">{row.slug}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-[#7A7164]">Leonix Ad ID</dt>
              <dd className="mt-0.5 break-all font-mono text-[#3D3428]">{row.leonix_ad_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-[#7A7164]">Source id</dt>
              <dd className="mt-0.5 break-all font-mono text-[10px] text-[#3D3428]">{row.id}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-[#7A7164]">Owner</dt>
              <dd className="mt-0.5 break-all font-mono text-[10px] text-[#7A7164]">{row.owner_user_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-[#7A7164]">Updated</dt>
              <dd className="mt-0.5">{formatWhen(row.updated_at, row.published_at)}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-[#7A7164]">Engagement</dt>
              <dd className="mt-0.5 tabular-nums">
                MG {likes} · Saved {saves}
              </dd>
            </div>
          </dl>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#E8DFD0]/80 bg-[#FAF7F2]/90 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Status &amp; moderation</p>
              <form action={updateServiciosPublicListingStatusAction} className="mt-2 space-y-2">
                <input type="hidden" name="listing_id" value={row.id} />
                <select
                  name="listing_status"
                  defaultValue={row.listing_status ?? "published"}
                  className="w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-2 text-xs"
                >
                  <option value="pending_review">pending_review</option>
                  <option value="published">published</option>
                  <option value="paused_unpublished">paused_unpublished</option>
                  <option value="rejected">rejected</option>
                  <option value="suspended">suspended</option>
                  <option value="draft">draft</option>
                </select>
                <label className="block text-[10px] font-semibold text-[#7A7164]">
                  Moderation notes
                  <textarea
                    name="moderation_notes"
                    rows={2}
                    defaultValue={row.moderation_notes ?? ""}
                    className="mt-1 w-full resize-y rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-xs"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-[#6B1A26] bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6B1A26]"
                >
                  Save listing status
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-[#E8DFD0]/80 bg-[#FAF7F2]/90 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Trust</p>
              <p className="mt-1 text-xs text-[#5C5346]">
                Verify interest: {row.profile_json?.opsMeta?.leonixVerifiedInterest ? "yes" : "—"}
              </p>
              <form action={setServiciosListingLeonixVerifiedAction} className="mt-2 space-y-2">
                <input type="hidden" name="listing_id" value={row.id} />
                <select
                  name="leonix_verified"
                  defaultValue={row.leonix_verified ? "1" : "0"}
                  className="w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-2 text-xs"
                >
                  <option value="0">Leonix verified: no</option>
                  <option value="1">Leonix verified: yes</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-[#2A4536] bg-[#2A4536] px-3 py-2 text-xs font-semibold text-[#FFFCF7] hover:bg-[#234036]"
                >
                  Save Verify Leonix
                </button>
              </form>
            </div>
          </div>

          <Link
            href={`/clasificados/servicios/${row.slug}?lang=es`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${adminDashboardCtaView} w-full sm:w-auto`}
          >
            View public listing →
          </Link>
        </div>

        <div className="min-w-0 space-y-4 border-[#E8DFD0]/70 lg:border-l lg:pl-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Monetization</p>
            <div className="mt-2">
              <ServiciosAdminMonetizationPanel
                listing={row as unknown as Record<string, unknown>}
                hints={{ dualAnalyticsPipeline: true, analyticsCapability: "partial" }}
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Staff actions</p>
            <div className="mt-2">
              <AdminActionExplainerGrid actions={["feature", "verifyLeonix", "archive", "republish"]} />
              <ClassifiedAdminRowActions
                variant="servicios"
                rowId={row.id}
                leonixAdId={row.leonix_ad_id}
                displayLabel={row.business_name}
                publicLive={publicLive}
                promoted={Boolean(row.promoted)}
                verified={row.leonix_verified}
                canArchive={(row.listing_status ?? "") !== "rejected"}
                staffEditBoardHref={`/admin/workspace/clasificados/servicios?slug=${encodeURIComponent(row.slug)}`}
                republishCategory="servicios"
                republishRow={{
                  listing_status: row.listing_status,
                  republish_override: row.republish_override,
                }}
                layout="card"
              />
            </div>
          </div>

          <p className="text-[10px] leading-relaxed text-[#7A7164]">
            Analytics: partial — engagement counts from user_liked_listings / saved_listings when available.
          </p>
        </div>
      </div>
    </article>
  );
}
