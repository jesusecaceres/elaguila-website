import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export type CategoryDashboardActionContract = {
  categorySlug: string;
  listingId: string | null;
  leonixAdId: string | null;
  slug: string | null;
  sourceTable: string;
  status: string;
  publicUrl: string | null;
  resultsUrl: string | null;
  editUrl: string | null;
  manageUrl: string | null;
  previewUrl: string | null;
  canEdit: boolean;
  canPause: boolean;
  canRepublish: boolean;
  canViewPublic: boolean;
  canViewResults: boolean;
  canSeeAnalytics: boolean;
};

function cleanString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildServiciosDashboardActionContract(args: {
  id?: string | null;
  slug: string;
  leonixAdId?: string | null;
  status: string;
  lang: Lang;
}): CategoryDashboardActionContract {
  const slug = args.slug.trim();
  const q = new URLSearchParams({ lang: args.lang });
  q.set("edit", "1");
  q.set("source", "dashboard");
  q.set("listingSlug", slug);
  const id = cleanString(args.id ?? null);
  const leonixAdId = cleanString(args.leonixAdId ?? null);
  if (id) q.set("listingId", id);
  if (leonixAdId) q.set("leonixAdId", leonixAdId);

  const publicQ = `lang=${args.lang}`;
  const publicUrl = slug ? `/clasificados/servicios/${encodeURIComponent(slug)}?${publicQ}` : null;
  const resultsUrl = `/clasificados/servicios/resultados?${publicQ}`;

  return {
    categorySlug: "servicios",
    listingId: id,
    leonixAdId,
    slug,
    sourceTable: "servicios_public_listings",
    status: args.status,
    publicUrl,
    resultsUrl,
    editUrl: slug ? `/clasificados/publicar/servicios?${q.toString()}` : null,
    manageUrl: `/dashboard/servicios?${publicQ}${slug ? `&listingSlug=${encodeURIComponent(slug)}` : ""}`,
    previewUrl: null,
    canEdit: Boolean(slug),
    canPause: false,
    canRepublish: false,
    canViewPublic: Boolean(publicUrl),
    canViewResults: true,
    canSeeAnalytics: false,
  };
}
