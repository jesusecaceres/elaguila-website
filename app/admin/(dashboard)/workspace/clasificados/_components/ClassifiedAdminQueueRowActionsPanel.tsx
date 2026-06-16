"use client";

import { AdminDashboardCta, AdminDashboardCtaButton, AdminDashboardCtaGrid } from "@/app/admin/_components/AdminDashboardCta";
import { adminQueueActionCompact, adminQueueActionGroupLabel } from "@/app/admin/_components/adminTheme";
import { listingsRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { useAdminT } from "@/app/admin/_components/AdminI18nProvider";
import { ClassifiedAdminRowActions } from "./ClassifiedAdminRowActions";
import type { AdminListingsTableRow } from "../AdminListingsTable";

type LegacyHandlers = {
  staffQueueMode: boolean;
  publishBusyId: string | null;
  deletingId: string | null;
  onSetPublished: (row: AdminListingsTableRow, published: boolean) => void;
  onDelete: (row: AdminListingsTableRow) => void;
};

type Props = {
  row: AdminListingsTableRow;
  displayLeonixAdId: string;
  layout: "compact" | "card";
} & LegacyHandlers;

export function ClassifiedAdminQueueRowActionsPanel({
  row,
  displayLeonixAdId,
  layout,
  staffQueueMode,
  publishBusyId,
  deletingId,
  onSetPublished,
  onDelete,
}: Props) {
  const t = useAdminT();
  const category = (row.category ?? "").toLowerCase();
  const isRentas = category === "rentas";
  const compact = adminQueueActionCompact;
  const gridCols = layout === "card" ? 2 : 1;
  const editHref = `/admin/workspace/clasificados/listings/${encodeURIComponent(row.id)}/edit`;
  const sellerHref = row.owner_id ? `/admin/usuarios/${row.owner_id}` : null;
  const publicHref = isRentas ? rentasListingPublicPath(row.id) : `/clasificados/anuncio/${row.id}`;

  return (
    <div className="min-w-0 space-y-3" data-testid="classified-queue-row-actions">
      <div>
        <p className={adminQueueActionGroupLabel}>Review</p>
        <AdminDashboardCtaGrid columns={gridCols}>
          <AdminDashboardCta
            href={editHref}
            label={t("audit.th.editAd")}
            variant="primary"
            title="Staff edit listing"
            className={compact}
          />
        </AdminDashboardCtaGrid>
      </div>

      <div>
        <p className={adminQueueActionGroupLabel}>Inspect</p>
        <AdminDashboardCtaGrid columns={gridCols}>
          <AdminDashboardCta
            href={publicHref}
            label={isRentas ? t("listings.viewRentas") : t("listings.viewPublic")}
            variant="view"
            external
            title={isRentas ? t("listings.publicRentasTitle") : t("listings.publicGenericTitle")}
            className={compact}
          />
          {sellerHref ? (
            <AdminDashboardCta
              href={sellerHref}
              label={t("listings.ownerCard")}
              variant="active"
              title={t("listings.ownerCard")}
              className={compact}
            />
          ) : null}
          {isRentas ? (
            <AdminDashboardCta
              href={`/admin/workspace/clasificados/rentas/${row.id}`}
              label={t("listings.inspectorRentas")}
              variant="view"
              title={t("listings.inspectorRentas")}
              className={compact}
            />
          ) : null}
        </AdminDashboardCtaGrid>
      </div>

      {staffQueueMode ? (
        <ClassifiedAdminRowActions
          variant="listings"
          rowId={row.id}
          leonixAdId={displayLeonixAdId !== "—" ? displayLeonixAdId : null}
          displayLabel={row.title}
          publicLive={listingsRowIsPublicLive(row as Record<string, unknown>)}
          promoted={Boolean(row.admin_promoted)}
          verified={Boolean(row.leonix_verified)}
          canArchive={(row.status ?? "").toLowerCase() !== "removed"}
          staffEditBoardHref={editHref}
          republishCategory={String(row.category ?? "").trim() || "listings"}
          republishRow={{
            category: row.category,
            is_free: row.is_free,
            detail_pairs: row.detail_pairs,
            is_published: row.is_published,
            status: row.status,
            republish_override: row.republish_override,
            republish_count: row.republish_count,
          }}
          layout={layout}
        />
      ) : null}
      {staffQueueMode && (row.status ?? "").toLowerCase() !== "removed" ? (
        <div>
          <p className={adminQueueActionGroupLabel}>Danger</p>
          <AdminDashboardCtaGrid columns={gridCols}>
            <AdminDashboardCtaButton
              label={deletingId === row.id ? "…" : t("listings.deleteStaff")}
              variant="danger"
              disabled={deletingId === row.id}
              title={t("listings.deleteTitle")}
              onClick={() => void onDelete(row)}
              className={compact}
            />
          </AdminDashboardCtaGrid>
          <p className="mt-1 text-[10px] leading-snug text-[#9A9084]">
            Soft delete — sets status to removed (not permanent hard delete).
          </p>
        </div>
      ) : null}
      {!staffQueueMode ? (
        <>
          <div>
            <p className={adminQueueActionGroupLabel}>Lifecycle</p>
            <AdminDashboardCtaGrid columns={gridCols}>
              {row.status !== "removed" && row.is_published !== false ? (
                <AdminDashboardCtaButton
                  label={publishBusyId === row.id ? "…" : t("listings.hidePublic")}
                  variant="warning"
                  disabled={publishBusyId === row.id}
                  title={t("listings.hidePublicTitle")}
                  onClick={() => void onSetPublished(row, false)}
                  className={compact}
                />
              ) : null}
              {row.status !== "removed" && row.is_published === false ? (
                <AdminDashboardCtaButton
                  label={publishBusyId === row.id ? "…" : t("listings.republish")}
                  variant="active"
                  disabled={publishBusyId === row.id}
                  title={t("listings.republishTitle")}
                  onClick={() => void onSetPublished(row, true)}
                  className={compact}
                />
              ) : null}
            </AdminDashboardCtaGrid>
          </div>
          {row.status !== "removed" ? (
            <div>
              <p className={adminQueueActionGroupLabel}>Danger</p>
              <AdminDashboardCtaGrid columns={gridCols}>
                <AdminDashboardCtaButton
                  label={deletingId === row.id ? "…" : t("listings.deleteStaff")}
                  variant="danger"
                  disabled={deletingId === row.id}
                  title={t("listings.deleteTitle")}
                  onClick={() => void onDelete(row)}
                  className={compact}
                />
              </AdminDashboardCtaGrid>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
