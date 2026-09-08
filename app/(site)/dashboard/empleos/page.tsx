"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { formatEmpleosLocationLine } from "@/app/publicar/empleos/shared/lib/empleosGlobalLocation";

import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { OwnerProductPageFrame } from "../components/OwnerProductPageFrame";
import { OwnerEntityWorkspace } from "../components/OwnerEntityWorkspace";
import type { ActionItem } from "../components/DashboardListingActionBar";
import { getOwnerEntityCapabilities, isLiveCapability } from "../lib/ownerEntityCapabilityRegistry";
import { resolveListingUiStatus, listingUiStatusLabel, listingUiStatusChipClass } from "../lib/listingDisplayStatus";
import {
  editListingLabel,
  publicViewLabel,
  publicResultsLabel,
  pauseListingLabel,
  resumeListingLabel,
  archiveListingLabel,
} from "../lib/dashboardMisAnunciosCategoryTools";
import { ownerToolsTitle, ownerApplicationsModuleTitle } from "../lib/dashboardI18n";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";

type Row = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  lifecycle_status: string;
  lane: string;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  listing_snapshot?: {
    jobRecord?: {
      stateRegion?: string | null;
      country?: string | null;
      employerAddressLine?: string | null;
      employerAddressLine2?: string | null;
    };
  } | null;
  updated_at: string;
};

function laneLabel(lane: string, lang: Lang): string {
  if (lane === "quick") return lang === "es" ? "Empleo local" : "Local job ad";
  if (lane === "premium") return lang === "es" ? "Preservado (premium)" : "Preserved (premium)";
  if (lane === "feria") return lang === "es" ? "Feria de empleo" : "Job fair";
  return lane;
}

function empleosEditHref(lane: string, id: string, q: string): string | null {
  if (lane === "quick") return `/publicar/empleos/quick?edit=${id}&${q}`;
  if (lane === "premium") return `/publicar/empleos/premium?edit=${id}&${q}`;
  if (lane === "feria") return `/publicar/empleos/feria?edit=${id}&${q}`;
  return null;
}

function EmpleosEmployerDashboardPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = "/dashboard/empleos";
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;
  const capabilities = getOwnerEntityCapabilities("empleos");

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            eyebrow: "Empleos",
            title: "Tus vacantes",
            subtitle: "Tus anuncios de empleo publicados o en revisión en Leonix.",
            loading: "Cargando…",
            empty: "Aún no tienes vacantes en esta cuenta.",
            publish: "Publicar vacante",
            moreOptions: "Más opciones",
            moreOptionsClose: "Cerrar",
            company: "Empresa",
            location: "Ubicación",
            updated: "Actualizado",
          }
        : {
            eyebrow: "Jobs",
            title: "Your job listings",
            subtitle: "Your job ads published or under review on Leonix.",
            loading: "Loading…",
            empty: "No job listings for this account yet.",
            publish: "Post a job",
            moreOptions: "More options",
            moreOptionsClose: "Close",
            company: "Company",
            location: "Location",
            updated: "Updated",
          },
    [lang],
  );

  const [authLoading, setAuthLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    void (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          const redirect = encodeURIComponent(`${pathname}${typeof window !== "undefined" ? window.location.search || "" : ""}`);
          router.replace(`/login?redirect=${redirect}`);
          return;
        }
        if (!cancelled) setOwnerId(userData.user.id);
        const { data, error } = await supabase
          .from("empleos_public_listings")
          .select("id, slug, title, company_name, lifecycle_status, lane, city, state, postal_code, listing_snapshot, updated_at")
          .eq("owner_user_id", userData.user.id)
          .order("updated_at", { ascending: false });
        if (!cancelled) {
          if (!error && data) setRows(data as Row[]);
        }
      } catch (err) {
        console.error("[dashboard/empleos] load failed", err);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function patchStatus(listingId: string, next: "published" | "paused" | "archived") {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    setBusyId(listingId);
    try {
      const res = await fetch(`/api/clasificados/empleos/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lifecycle_status: next }),
      });
      const json = (await res.json()) as { ok?: boolean };
      if (json.ok) {
        setRows((prev) => prev.map((r) => (r.id === listingId ? { ...r, lifecycle_status: next } : r)));
      }
    } finally {
      setBusyId(null);
    }
  }

  const rowLocationLine = (r: Row) =>
    formatEmpleosLocationLine(
      {
        city: r.city,
        stateRegion: r.listing_snapshot?.jobRecord?.stateRegion ?? r.state,
        postalCode: r.postal_code,
        country: r.listing_snapshot?.jobRecord?.country,
        addressLine1: r.listing_snapshot?.jobRecord?.employerAddressLine,
        addressLine2: r.listing_snapshot?.jobRecord?.employerAddressLine2,
      },
      { compact: true, includePostal: true },
    );

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="listings"
      plan="free"
      userName={null}
      email={null}
      accountRef={null}
      ownerId={ownerId}
      contentLayout="workbench"
    >
      <OwnerProductPageFrame
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
        primaryAction={{ href: appendLangToPath("/publicar/empleos", lang), label: t.publish }}
        secondaryAction={{ href: appendLangToPath("/clasificados/empleos/resultados", lang), label: publicResultsLabel(lang) }}
        loading={authLoading}
        loadingLabel={t.loading}
        empty={!authLoading && rows.length === 0}
        emptyLabel={t.empty}
      >
        {rows.map((r) => {
          const uiStatus = resolveListingUiStatus({ status: r.lifecycle_status });
          const editHref = empleosEditHref(r.lane, r.id, q);
          const locationLine = rowLocationLine(r);
          const busy = busyId === r.id;
          const supportsApplications = r.lane !== "feria" && isLiveCapability(capabilities.specialized.applications);
          const detailItems = [
            r.company_name ? { label: t.company, value: r.company_name } : null,
            locationLine ? { label: t.location, value: locationLine } : null,
            r.updated_at ? { label: t.updated, value: new Date(r.updated_at).toLocaleString(lang === "es" ? "es-US" : "en-US") } : null,
          ].filter((x): x is { label: string; value: string } => x !== null);

          const quickActions: ActionItem[] = [];
          if (r.lifecycle_status === "published" && isLiveCapability(capabilities.identity.publicView)) {
            quickActions.push({
              href: appendLangToPath(`/clasificados/empleos/${r.slug}`, lang),
              label: publicViewLabel(lang),
              tone: "secondary",
            });
          }

          const lifecycleActions: ActionItem[] = [];
          if (isLiveCapability(capabilities.lifecycle.pause) && r.lifecycle_status === "published") {
            lifecycleActions.push({
              label: pauseListingLabel(lang),
              onClick: () => void patchStatus(r.id, "paused"),
              disabled: busy,
              tone: "warning",
            });
          }
          if (
            isLiveCapability(capabilities.lifecycle.reactivate) &&
            (r.lifecycle_status === "paused" || r.lifecycle_status === "archived" || r.lifecycle_status === "draft")
          ) {
            lifecycleActions.push({
              label: resumeListingLabel(lang),
              onClick: () => void patchStatus(r.id, "published"),
              disabled: busy,
              tone: "positive",
            });
          }
          if (isLiveCapability(capabilities.lifecycle.archive) && r.lifecycle_status !== "archived") {
            lifecycleActions.push({
              label: archiveListingLabel(lang),
              onClick: () => void patchStatus(r.id, "archived"),
              disabled: busy,
              tone: "danger",
            });
          }

          const specializedActions: ActionItem[] = supportsApplications
            ? [{ href: `/dashboard/empleos/${r.id}?${q}`, label: ownerApplicationsModuleTitle(lang), tone: "premium" }]
            : [];

          return (
            <OwnerEntityWorkspace
              key={r.id}
              lang={lang}
              header={{
                eyebrow: t.eyebrow,
                title: r.title,
                statusLabel: listingUiStatusLabel(uiStatus, lang),
                statusChipClass: listingUiStatusChipClass(uiStatus),
                badges: [laneLabel(r.lane, lang)],
              }}
              detailItems={detailItems}
              primaryAction={{ href: editHref ?? `/dashboard/empleos/${r.id}?${q}`, label: editListingLabel(lang) }}
              quickActions={quickActions}
              lifecycleActions={lifecycleActions}
              specialized={specializedActions.length > 0 ? { title: ownerToolsTitle(lang), actions: specializedActions } : undefined}
              mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
            />
          );
        })}
      </OwnerProductPageFrame>
    </LeonixDashboardShell>
  );
}

export default function EmpleosEmployerDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <EmpleosEmployerDashboardPageContent />
    </Suspense>
  );
}
