"use client";

import type { ComidaLocalDraft } from "./comidaLocalTypes";
import type { ComidaLocalPackageTierDb } from "./comidaLocalPublishTypes";

export type ComidaLocalPublishApiResponse = {
  ok?: boolean;
  id?: string;
  slug?: string;
  leonix_ad_id?: string;
  status?: string;
  package_tier?: string;
  payment_status?: string;
  publicPath?: string;
  draft_listing_id?: string;
  error?: string;
  detail?: string;
  issues?: { field: string; message: string; severity?: string }[];
};

export async function postComidaLocalPublishApi(args: {
  draft: ComidaLocalDraft;
  draftListingId: string;
  packageTier?: ComidaLocalPackageTierDb;
  lang?: "es" | "en";
  accessToken?: string | null;
}): Promise<{ res: Response; data: ComidaLocalPublishApiResponse }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (args.accessToken) {
    headers.Authorization = `Bearer ${args.accessToken}`;
  }

  const res = await fetch("/api/clasificados/comida-local/publish", {
    method: "POST",
    headers,
    body: JSON.stringify({
      draft: args.draft,
      draftListingId: args.draftListingId,
      packageTier: args.packageTier ?? "basic",
      lang: args.lang ?? "es",
    }),
  });

  const data = (await res.json()) as ComidaLocalPublishApiResponse;
  return { res, data };
}
