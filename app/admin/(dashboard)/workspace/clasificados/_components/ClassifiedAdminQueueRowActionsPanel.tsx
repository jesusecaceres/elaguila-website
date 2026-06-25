"use client";

import { useCallback, useState } from "react";
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
  ownerEmail?: string | null;
} & LegacyHandlers;

function DangerSection({
  children,
  collapseSections,
}: {
  children: React.ReactNode;
  collapseSections: boolean;
}) {
  if (!collapseSections) {
    return (
      <div data-testid="admin-row-actions-danger">
        <p className={adminQueueActionGroupLabel}>Danger</p>
        {children}
      </div>
    );
  }
  return (
    <details
      className="rounded-lg border border-red-200/80 bg-red-50/40"
      data-testid="admin-row-actions-danger"
    >
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center px-3 py-2.5 text-xs font-bold uppercase text-red-800 [&::-webkit-details-marker]:hidden">
        Danger
      </summary>
      <div className="border-t border-red-200/60 p-2">{children}</div>
    </details>
  );
}

function SellerSection({
  sellerHref,
  sellerLabel,
  ownerEmail,
  listingTitle,
  leonixAdId,
  isRentas,
  rentasInspectorHref,
  collapseSections,
  t,
}: {
  sellerHref: string | null;
  sellerLabel: string;
  ownerEmail: string | null;
  listingTitle: string | null;
  leonixAdId: string | null;
  isRentas: boolean;
  rentasInspectorHref: string | null;
  collapseSections: boolean;
  t: (key: string) => string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "ok" | "err">("idle");
  const compact = adminQueueActionCompact;
  const hasSeller = Boolean(sellerHref);
  const hasContact = Boolean(ownerEmail?.trim());
  if (!hasSeller && !hasContact) return null;

  const mailto = hasContact
    ? (() => {
        const email = ownerEmail!.trim();
        const subject = "Leonix Media listing review";
        const idPart = leonixAdId ? `\nLeonix Ad ID: ${leonixAdId}` : "";
        const body = `Hello,\n\nWe are reviewing your listing "${listingTitle ?? "your listing"}".${idPart}\n\n— Leonix Media team`;
        return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      })()
    : null;

  const copyEmail = useCallback(async () => {
    const email = ownerEmail?.trim();
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopyState("ok");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("err");
      window.setTimeout(() => setCopyState("idle"), 2500);
    }
  }, [ownerEmail]);

  const inner = (
    <div className="space-y-2">
      <AdminDashboardCtaGrid columns={2}>
        {sellerHref ? (
          <AdminDashboardCta
            href={sellerHref}
            label={sellerLabel}
            variant="active"
            title={sellerLabel}
            className={compact}
          />
        ) : null}
        {isRentas && rentasInspectorHref ? (
          <AdminDashboardCta
            href={rentasInspectorHref}
            label={t("listings.inspectorRentas")}
            variant="view"
            title={t("listings.inspectorRentas")}
            className={compact}
          />
        ) : null}
      </AdminDashboardCtaGrid>
      {hasContact ? (
        <AdminDashboardCtaGrid columns={2}>
          <AdminDashboardCtaButton
            label={copyState === "ok" ? "Copied" : copyState === "err" ? "Copy failed" : "Copy email"}
            variant="neutral"
            onClick={() => void copyEmail()}
            className={compact}
            title={`Copy ${ownerEmail}`}
          />
          {mailto ? (
            <AdminDashboardCta href={mailto} label="Email seller" variant="active" className={compact} title="Opens mailto" />
          ) : null}
        </AdminDashboardCtaGrid>
      ) : null}
    </div>
  );

  if (!collapseSections) {
    return (
      <div data-testid="admin-row-actions-seller">
        <p className={adminQueueActionGroupLabel}>Seller</p>
        {inner}
      </div>
    );
  }

  return (
    <details className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7]/80" data-testid="admin-row-actions-seller">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center px-3 py-2.5 text-xs font-bold uppercase text-[#5C5346] [&::-webkit-details-marker]:hidden">
        Seller
      </summary>
      <div className="border-t border-[#E8DFD0]/60 p-2">{inner}</div>
    </details>
  );
}

export function ClassifiedAdminQueueRowActionsPanel({
  row,
  displayLeonixAdId,
  layout,
  staffQueueMode,
  publishBusyId,
  deletingId,
  onSetPublished,
  onDelete,
  ownerEmail = null,
}: Props) {
  const t = useAdminT();
  const category = (row.category ?? "").toLowerCase();
  const isRentas = category === "rentas";
  const compact = adminQueueActionCompact;
  const gridCols = layout === "card" ? 2 : 1;
  const collapseSections = layout === "card";
  const editHref = `/admin/workspace/clasificados/listings/${encodeURIComponent(row.id)}/edit`;
  const sellerHref = row.owner_id ? `/admin/usuarios/${row.owner_id}` : null;
  const publicHref = isRentas ? rentasListingPublicPath(row.id) : `/clasificados/anuncio/${row.id}`;

  if (collapseSections) {
    return (
      <div className="min-w-0 space-y-2 overflow-x-hidden" data-testid="classified-queue-row-actions">
        <AdminDashboardCtaGrid columns={2}>
          <AdminDashboardCta
            href={editHref}
            label={t("audit.th.editAd")}
            variant="primary"
            title="Staff edit listing"
            className={compact}
          />
          <AdminDashboardCta
            href={publicHref}
            label={isRentas ? t("listings.viewRentas") : t("listings.viewPublic")}
            variant="view"
            external
            title={isRentas ? t("listings.publicRentasTitle") : t("listings.publicGenericTitle")}
            className={compact}
          />
        </AdminDashboardCtaGrid>

        <SellerSection
          sellerHref={sellerHref}
          sellerLabel={t("listings.ownerCard")}
          ownerEmail={ownerEmail}
          listingTitle={row.title}
          leonixAdId={displayLeonixAdId !== "—" ? displayLeonixAdId : null}
          isRentas={isRentas}
          rentasInspectorHref={isRentas ? `/admin/workspace/clasificados/rentas/${row.id}` : null}
          collapseSections
          t={t}
        />

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
            collapseSections
          />
        ) : null}

        {staffQueueMode && (row.status ?? "").toLowerCase() !== "removed" ? (
          <DangerSection collapseSections>
            <AdminDashboardCtaGrid columns={2}>
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
          </DangerSection>
        ) : null}

        {!staffQueueMode ? (
          <>
            <details className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7]/80" data-testid="admin-row-actions-lifecycle">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center px-3 py-2.5 text-xs font-bold uppercase text-[#5C5346] [&::-webkit-details-marker]:hidden">
                Lifecycle
              </summary>
              <div className="border-t border-[#E8DFD0]/60 p-2">
                <AdminDashboardCtaGrid columns={2}>
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
            </details>
            {row.status !== "removed" ? (
              <DangerSection collapseSections>
                <AdminDashboardCtaGrid columns={2}>
                  <AdminDashboardCtaButton
                    label={deletingId === row.id ? "…" : t("listings.deleteStaff")}
                    variant="danger"
                    disabled={deletingId === row.id}
                    title={t("listings.deleteTitle")}
                    onClick={() => void onDelete(row)}
                    className={compact}
                  />
                </AdminDashboardCtaGrid>
              </DangerSection>
            ) : null}
          </>
        ) : null}

        <SellerSection
          sellerHref={sellerHref}
          sellerLabel={t("listings.ownerCard")}
          ownerEmail={ownerEmail}
          listingTitle={row.title}
          leonixAdId={displayLeonixAdId !== "—" ? displayLeonixAdId : null}
          isRentas={isRentas}
          rentasInspectorHref={isRentas ? `/admin/workspace/clasificados/rentas/${row.id}` : null}
          collapseSections
          t={t}
        />
      </div>
    );
  }

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
        <DangerSection collapseSections={false}>
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
        </DangerSection>
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
            <DangerSection collapseSections={false}>
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
            </DangerSection>
          ) : null}
        </>
      ) : null}
      {ownerEmail || sellerHref ? (
        <SellerSection
          sellerHref={sellerHref}
          sellerLabel={t("listings.ownerCard")}
          ownerEmail={ownerEmail}
          listingTitle={row.title}
          leonixAdId={displayLeonixAdId !== "—" ? displayLeonixAdId : null}
          isRentas={isRentas}
          rentasInspectorHref={isRentas ? `/admin/workspace/clasificados/rentas/${row.id}` : null}
          collapseSections={false}
          t={t}
        />
      ) : null}
    </div>
  );
}
