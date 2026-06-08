"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type {
  OfertaLocalItemPatchApiResponse,
  OfertaLocalItemReviewPatch,
  OfertaLocalItemsListApiResponse,
} from "./ofertasLocalesTypes";

async function authHeaders(): Promise<HeadersInit | null> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchOfertaLocalReviewItems(
  ofertaLocalId: string,
  scanJobId?: string | null
): Promise<OfertaLocalItemsListApiResponse> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, error: "unauthorized", detail: "Sign in to review items." };
  }

  const qs = new URLSearchParams({ ofertaLocalId });
  if (scanJobId?.trim()) qs.set("scanJobId", scanJobId.trim());

  const res = await fetch(`/api/ofertas-locales/items?${qs.toString()}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  try {
    return (await res.json()) as OfertaLocalItemsListApiResponse;
  } catch {
    return { ok: false, error: "bad_response", detail: `HTTP ${res.status}` };
  }
}

export async function patchOfertaLocalReviewItem(
  itemId: string,
  patch: OfertaLocalItemReviewPatch
): Promise<OfertaLocalItemPatchApiResponse> {
  const headers = await authHeaders();
  if (!headers) {
    return { ok: false, error: "unauthorized", detail: "Sign in to update items." };
  }

  const res = await fetch(`/api/ofertas-locales/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patch),
  });

  try {
    return (await res.json()) as OfertaLocalItemPatchApiResponse;
  } catch {
    return { ok: false, error: "bad_response", detail: `HTTP ${res.status}` };
  }
}
