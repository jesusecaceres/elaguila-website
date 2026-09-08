/**
 * Globalization Package A Gate 3 — canonical draft-workspace contract.
 *
 * One shared contract for what every category's draft store must guarantee, with the existing
 * per-category stores acting as adapters. This module is pure (no React, no browser globals at
 * module scope, no Supabase) and additive: no existing store's key or shape is changed by its
 * existence — adapters adopt the envelope/precedence pieces lane-by-lane (Package A Gates 3–5).
 *
 * THE THREE RULES this contract encodes (each traceable to a real, shipped defect):
 *
 * 1. NAMESPACE ISOLATION — a draft key is always scoped by pipeline + context (new-publish vs
 *    listing-edit) + the concrete identity (application instance or listing id). A listing-edit
 *    workspace and a new-ad draft must NEVER share a key. (The I.11A Autos collision: dashboard
 *    edit wrote into the same per-user namespace as a fresh new-listing draft — last write won.)
 *
 * 2. LISTING-BOUND STATE SOURCES — an existing, identified listing's only valid state sources
 *    are (a) its own listing-edit workspace and (b) the real DB-hydrated row, in that order —
 *    never a generic new-ad draft. (The P2 BR defect: a stale sessionStorage new-ad draft
 *    silently overwrote DB-hydrated photos, then the validator honestly rejected the resulting
 *    empty-photo state as a "false 422".)
 *
 * 3. STALENESS PRECEDENCE — a local edit workspace only outranks the DB row it was hydrated
 *    from while that row is unchanged. If the row moved underneath it (edited elsewhere,
 *    admin-touched), the DB is truth and the local draft must be surfaced as conflicting, not
 *    silently applied. (The I.11A platform gap: "no updated_at/staleness check anywhere a
 *    local edit workspace is written.")
 */

import type { CanonicalCategoryKey, CategoryLaneKey } from "@/app/lib/listingIdentity/types";

/* ==============================================================================================
 * Key derivation
 * ============================================================================================ */

export type DraftWorkspaceContext =
  | { kind: "new-publish"; applicationInstanceId: string }
  | { kind: "listing-edit"; listingId: string; childListingId?: string | null };

export type DraftWorkspaceScope = {
  pipeline: CanonicalCategoryKey;
  laneKey?: CategoryLaneKey | null;
  /** Owner scoping component — real user id when authenticated, anon draft-session id before
   * login. Never omitted: two users on one device must never share a draft. */
  ownerKey: string;
  context: DraftWorkspaceContext;
};

/**
 * Canonical key derivation. Existing stores keep their legacy literal keys as adapters (each
 * documented in DRAFT_STORE_ADAPTERS below); NEW stores and migrated stores use this shape:
 *   leonix:draft:{pipeline}[:{laneKey}]:{ownerKey}:new:{applicationInstanceId}
 *   leonix:draft:{pipeline}[:{laneKey}]:{ownerKey}:edit:{listingId}[:child:{childListingId}]
 * The `new:` / `edit:` segments make Rule 1 structural: the two contexts can never collide.
 */
export function deriveDraftWorkspaceKey(scope: DraftWorkspaceScope): string {
  const lane = scope.laneKey ? `:${scope.laneKey}` : "";
  const owner = scope.ownerKey.trim() || "anon-unscoped";
  const base = `leonix:draft:${scope.pipeline}${lane}:${owner}`;
  if (scope.context.kind === "new-publish") {
    return `${base}:new:${scope.context.applicationInstanceId.trim() || "default"}`;
  }
  const child = scope.context.childListingId?.trim();
  return `${base}:edit:${scope.context.listingId.trim()}${child ? `:child:${child}` : ""}`;
}

/* ==============================================================================================
 * Envelope + staleness precedence
 * ============================================================================================ */

export type DraftEnvelope<T> = {
  /** Contract version for forward migration. */
  v: 1;
  /** ISO timestamp of the last local save. */
  savedAt: string;
  /**
   * For listing-edit workspaces: the source row's `updated_at` AS HYDRATED when this workspace
   * was created/refreshed from the DB. Null when unknown (legacy envelope, or a store that has
   * not adopted staleness capture yet) — precedence then degrades to today's local-wins
   * behavior rather than inventing a conflict.
   */
  sourceUpdatedAt: string | null;
  data: T;
};

export function wrapDraftEnvelope<T>(data: T, sourceUpdatedAt: string | null | undefined): DraftEnvelope<T> {
  return { v: 1, savedAt: new Date().toISOString(), sourceUpdatedAt: sourceUpdatedAt?.trim() || null, data };
}

/** Tolerant reader: accepts a v1 envelope OR a legacy raw draft (returned with null metadata)
 * so adapters can adopt the envelope without breaking existing persisted drafts. */
export function readDraftEnvelope<T>(parsed: unknown): { data: T; savedAt: string | null; sourceUpdatedAt: string | null } | null {
  if (parsed == null || typeof parsed !== "object") return null;
  const candidate = parsed as Partial<DraftEnvelope<T>> & Record<string, unknown>;
  if (candidate.v === 1 && "data" in candidate) {
    return {
      data: candidate.data as T,
      savedAt: typeof candidate.savedAt === "string" ? candidate.savedAt : null,
      sourceUpdatedAt: typeof candidate.sourceUpdatedAt === "string" ? candidate.sourceUpdatedAt : null,
    };
  }
  // Legacy raw draft (pre-envelope store shape).
  return { data: parsed as T, savedAt: null, sourceUpdatedAt: null };
}

export type DraftPrecedence =
  /** Use the local workspace — it was hydrated from the row the DB still holds. */
  | "local"
  /** Use the DB row — no local workspace exists. */
  | "db"
  /** The row changed underneath the local workspace. DB is truth; the caller must surface the
   * conflict (offer discard/compare), never silently apply the stale local draft. */
  | "db-newer-conflict";

/**
 * Rule 3. `localSourceUpdatedAt` null (staleness not captured) degrades to "local" — identical
 * to pre-contract behavior, never a fabricated conflict.
 */
export function resolveDraftPrecedence(input: {
  hasLocalWorkspace: boolean;
  localSourceUpdatedAt: string | null;
  dbUpdatedAt: string | null;
}): DraftPrecedence {
  if (!input.hasLocalWorkspace) return "db";
  const local = (input.localSourceUpdatedAt ?? "").trim();
  const db = (input.dbUpdatedAt ?? "").trim();
  if (!local || !db) return "local";
  const localMs = Date.parse(local);
  const dbMs = Date.parse(db);
  if (!Number.isFinite(localMs) || !Number.isFinite(dbMs)) return "local";
  return dbMs > localMs ? "db-newer-conflict" : "local";
}

/* ==============================================================================================
 * Full-catalog adapter registry (evidence-backed; documentation-as-data, testable)
 * ============================================================================================ */

export type DraftStoreAdapterRecord = {
  pipeline: CanonicalCategoryKey;
  /** Where the category's draft state actually lives today. */
  storage: "sessionStorage" | "localStorage" | "sessionStorage+indexeddb" | "localStorage+indexeddb" | "sessionStorage+localStorage-fallback";
  /** The module that owns the store (the adapter). */
  module: string;
  /** Rule 1 isolation status for listing-edit vs new-publish namespaces. */
  editNamespaceIsolated: boolean;
  notes: readonly string[];
};

/** Current repository truth per pipeline (from the Package A exploration inventory + ledger
 * I.11A/P2). A pipeline listed with `editNamespaceIsolated: false` either has no edit surface
 * yet (tracked in Gate 5) or hydrates edits purely from the DB (no local edit workspace). */
export const DRAFT_STORE_ADAPTERS: readonly DraftStoreAdapterRecord[] = [
  { pipeline: "restaurantes", storage: "sessionStorage+indexeddb", module: "app/(site)/clasificados/restaurantes/application/restauranteDraftStorage.ts", editNamespaceIsolated: true, notes: ["listing-edit mode keyed by listingId query context"] },
  { pipeline: "servicios", storage: "sessionStorage+indexeddb", module: "app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosStorage.ts", editNamespaceIsolated: true, notes: ["existingPublicSlug priming requirement documented in registry knownLimitations"] },
  { pipeline: "bienes_raices_negocio", storage: "localStorage", module: ".../agente-individual/application/utils/bienesDashboardListingEditWorkspace.ts", editNamespaceIsolated: true, notes: ["per-parent + per-child workspace keys; P2 removed the generic-draft lookup from the listing-bound branch"] },
  { pipeline: "bienes_raices_privado", storage: "sessionStorage+localStorage-fallback", module: ".../privado/application/utils/bienesRaicesPrivadoDraft.ts", editNamespaceIsolated: false, notes: ["no edit surface yet (Gate 5)"] },
  { pipeline: "autos_negocios", storage: "sessionStorage+indexeddb", module: "app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts", editNamespaceIsolated: true, notes: ["autosListingEditNamespace.ts (I.11A collision fix)"] },
  { pipeline: "autos_privado", storage: "sessionStorage+indexeddb", module: "app/(site)/clasificados/autos/privado/lib/autosPrivadoDraftStorage.ts", editNamespaceIsolated: true, notes: ["same I.11A namespace derivation"] },
  { pipeline: "rentas_negocio", storage: "sessionStorage+localStorage-fallback", module: "app/(site)/clasificados/publicar/rentas/shared/rentasListingEditWorkspace.ts", editNamespaceIsolated: true, notes: ["per-listing edit key via rentasListingEditWorkspaceKey"] },
  { pipeline: "rentas_privado", storage: "sessionStorage+localStorage-fallback", module: "app/(site)/clasificados/publicar/rentas/shared/rentasListingEditWorkspace.ts", editNamespaceIsolated: true, notes: [] },
  { pipeline: "empleos", storage: "localStorage", module: "app/(site)/clasificados/empleos/lib/staged/empleosStagedStorage.ts", editNamespaceIsolated: true, notes: ["canonical staged registry keyed by identity"] },
  { pipeline: "en_venta", storage: "sessionStorage+indexeddb", module: "app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts (+ enVentaPreviewDraftIdb)", editNamespaceIsolated: false, notes: ["edit is DB-hydrated via generic /dashboard/mis-anuncios editor — no local edit workspace, so Rule 2/3 are structurally satisfied for edit"] },
  { pipeline: "comida_local", storage: "localStorage", module: "app/lib/clasificados/comida-local/* (COMIDA_LOCAL_DRAFT_STORAGE_KEY)", editNamespaceIsolated: false, notes: ["no edit surface yet (Gate 5)"] },
  { pipeline: "ofertas_locales", storage: "sessionStorage", module: "external workstream", editNamespaceIsolated: false, notes: ["EXTERNAL WORKSTREAM — not modified by Globalization"] },
  { pipeline: "busco", storage: "sessionStorage", module: "app/(site)/publicar/community/shared/hooks/* + publishBuscoQuickToListings.ts", editNamespaceIsolated: false, notes: ["edit is DB-hydrated via generic editor; publish idempotency key added in Gate 3"] },
  { pipeline: "clases", storage: "sessionStorage", module: "app/(site)/publicar/community/shared/hooks/*", editNamespaceIsolated: false, notes: ["same shared community store; generic DB-hydrated editor"] },
  { pipeline: "comunidad", storage: "sessionStorage", module: "app/(site)/publicar/community/shared/hooks/*", editNamespaceIsolated: false, notes: ["same shared community store; generic DB-hydrated editor"] },
  { pipeline: "mascotas_y_perdidos", storage: "sessionStorage", module: "app/(site)/publicar/community/shared/hooks/*", editNamespaceIsolated: false, notes: ["no safe editor yet (Gate 5)"] },
  { pipeline: "viajes", storage: "localStorage+indexeddb", module: "app/(site)/publicar/viajes/{negocios,privado}/lib/*", editNamespaceIsolated: true, notes: ["stagedId-keyed edit context via /dashboard/viajes"] },
];
