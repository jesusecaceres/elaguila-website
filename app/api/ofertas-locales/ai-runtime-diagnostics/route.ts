import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getMissingOfertaLocalDocumentAiEnvLabels,
  isOfertaLocalDocumentAiConfigured,
} from "@/app/lib/ofertas-locales/ofertasLocalesDocumentAiConfig";
import {
  getSupabaseUrlHost,
  OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION,
  parseSupabaseProjectRefFromUrl,
  probeOfertasLocalesAiTables,
} from "@/app/lib/ofertas-locales/ofertasLocalesSupabaseSchema";
import { getAdminSupabase, isSupabaseAdminConfigured, requireAdminCookie } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

function hasDocumentAiCredentials(): boolean {
  const raw = process.env.GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON?.trim();
  if (raw) return true;
  return Boolean(
    process.env.GOOGLE_DOCUMENT_AI_CLIENT_EMAIL?.trim() &&
      process.env.GOOGLE_DOCUMENT_AI_PRIVATE_KEY?.trim()
  );
}

/**
 * Admin-only runtime diagnostics for Ofertas Locales AI scan (OL-7E).
 * Read-only — no DB writes, no secrets exposed.
 */
export async function GET() {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const timestamp = new Date().toISOString();

  const envPresence = {
    hasSupabaseUrl: Boolean(supabaseUrl?.trim()),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    hasDocumentAiProjectId: Boolean(process.env.GOOGLE_DOCUMENT_AI_PROJECT_ID?.trim()),
    hasDocumentAiProcessorId: Boolean(process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID?.trim()),
    hasDocumentAiCredentials: hasDocumentAiCredentials(),
    documentAiConfigured: isOfertaLocalDocumentAiConfigured(),
    missingDocumentAiEnv: isOfertaLocalDocumentAiConfigured()
      ? []
      : getMissingOfertaLocalDocumentAiEnvLabels(),
  };

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      ok: true,
      timestamp,
      routeVersion: OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION,
      supabaseHost: getSupabaseUrlHost(supabaseUrl),
      supabaseProjectRef: parseSupabaseProjectRefFromUrl(supabaseUrl),
      env: envPresence,
      tableProbes: null,
      adminConfigured: false,
      detail: "Supabase admin client is not configured on this deployment.",
    });
  }

  const supabase = getAdminSupabase();
  const tableProbe = await probeOfertasLocalesAiTables(supabase);

  return NextResponse.json({
    ok: true,
    timestamp,
    routeVersion: OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION,
    supabaseHost: getSupabaseUrlHost(supabaseUrl),
    supabaseProjectRef: parseSupabaseProjectRefFromUrl(supabaseUrl),
    env: envPresence,
    tableProbes: tableProbe.tables,
    allTablesOk: tableProbe.ok,
    failedTables: tableProbe.failedTables,
    adminConfigured: true,
  });
}
