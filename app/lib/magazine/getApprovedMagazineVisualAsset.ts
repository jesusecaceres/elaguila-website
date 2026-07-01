import "server-only";

import {
  describeMagazineVisualAssetState,
  JUNE_2026_ISSUE_ID,
  mapMagazineVisualAssetRow,
  normalizeMagazineVisualLocale,
  type MagazineVisualAssetAvailability,
  type MagazineVisualAssetKind,
} from "@/app/lib/magazine/magazineVisualAssetsPlatform";
import {
  getServerSupabaseAnon,
  isSupabasePublicReadConfigured,
} from "@/app/lib/supabase/server";

export type GetApprovedMagazineVisualAssetInput = {
  issueId?: string;
  targetLocale: string | null | undefined;
  assetKind?: MagazineVisualAssetKind;
};

/**
 * Server-only lookup for QA-approved, publicly available magazine visual assets.
 * Uses anon client + RLS — never returns unapproved rows. Fails closed on error.
 */
export async function getApprovedMagazineVisualAsset(
  input: GetApprovedMagazineVisualAssetInput,
): Promise<MagazineVisualAssetAvailability> {
  const issueId = input.issueId ?? JUNE_2026_ISSUE_ID;
  const assetKind = input.assetKind ?? "translated_pdf";
  const targetLocale = normalizeMagazineVisualLocale(input.targetLocale);

  const unavailable = describeMagazineVisualAssetState(null, input.targetLocale, issueId, assetKind);

  if (!targetLocale || targetLocale === "es") {
    return unavailable;
  }

  if (!isSupabasePublicReadConfigured()) {
    return unavailable;
  }

  try {
    const supabase = getServerSupabaseAnon();
    const { data, error } = await supabase
      .from("magazine_visual_assets")
      .select("*")
      .eq("issue_id", issueId)
      .eq("target_locale", targetLocale)
      .eq("asset_kind", assetKind)
      .eq("publicly_available", true)
      .eq("qa_approved", true)
      .eq("qa_status", "approved")
      .maybeSingle();

    if (error || !data) {
      return unavailable;
    }

    const record = mapMagazineVisualAssetRow(data as Record<string, unknown>);
    return describeMagazineVisualAssetState(record, targetLocale, issueId, assetKind);
  } catch {
    return unavailable;
  }
}
