"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { OfertaLocalScanApiRequest, OfertaLocalScanApiResponse } from "./ofertasLocalesTypes";

export async function submitOfertaLocalAiScan(
  body: OfertaLocalScanApiRequest
): Promise<OfertaLocalScanApiResponse> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    return {
      ok: false,
      error: "unauthorized",
      detail: "Sign in to scan with AI.",
      configurationMissing: false,
    };
  }

  const res = await fetch("/api/ofertas-locales/scan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    return {
      ok: false,
      error: "bad_response",
      detail: `HTTP ${res.status}`,
      configurationMissing: false,
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "bad_response", configurationMissing: false };
  }

  return parsed as OfertaLocalScanApiResponse;
}
