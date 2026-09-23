/**
 * The ONE client-side caller for "save this ad for the client", for every category.
 *
 * Each category's assisted endpoint has its own request contract — they were built at different
 * times, against different row shapes, and this file does not pretend otherwise. What it does is
 * keep those eight contracts in ONE place, so a staff-facing button never has to know which body a
 * category wants, and a contract change has one place to be wrong instead of eight.
 *
 * It holds no authority. Every field here is a request; the server decides. In particular the
 * listing id is deliberately NOT sent unless a category's existing route already uses it (Autos
 * privado PATCH, Comida Local draft id): the server-issued assisted context carries the canonical
 * row and a body id can only agree with it, so the safest thing a caller can send is nothing at
 * all and let the server say which row this is.
 *
 * Organizational custody: `clientUserId` is optional attribution. A null client is a valid
 * owner-null first save. Public/customer callers never go through this module.
 */
import { QUICK_SALES_CATEGORY_MAP, type QuickSalesCategory } from "./quickSalesCategories";

export type AssistedSavePayload =
  | { category: "rentas"; draft: Record<string, unknown>; lane?: "privado"; lang?: "es" | "en" }
  | { category: "empleos"; envelope: Record<string, unknown>; lang?: "es" | "en" }
  | { category: "autos-privado"; listing: Record<string, unknown>; listingId?: string | null; lang?: "es" | "en" }
  | { category: "servicios"; state: Record<string, unknown>; lang?: "es" | "en" }
  | { category: "restaurantes"; draft: Record<string, unknown>; lang?: "es" | "en" }
  | { category: "comida-local"; draft: Record<string, unknown>; draftListingId?: string | null; lang?: "es" | "en" }
  | { category: "autos"; clientUserId?: string | null; dealerListing: Record<string, unknown>; vehicleListing?: Record<string, unknown> | null; lang?: "es" | "en" }
  | { category: "bienes-raices"; clientUserId?: string | null; listingRow: Record<string, unknown>; lang?: "es" | "en" };

export type AssistedSaveResult =
  | { ok: true; listingId: string | null; raw: Record<string, unknown> }
  | { ok: false; status: number; error: string; message?: string };

function bodyFor(payload: AssistedSavePayload): Record<string, unknown> {
  const lang = payload.lang ?? "es";
  switch (payload.category) {
    case "rentas":
      return { assistedAction: "save_for_client", draft: payload.draft, lane: payload.lane ?? "privado", lang };
    case "empleos":
      return { assistedAction: "save_for_client", envelope: payload.envelope, lang };
    case "autos-privado":
      return {
        assistedAction: "save_for_client",
        listing: payload.listing,
        lane: "privado",
        lang,
      };
    case "servicios":
      return { assistedAction: "save_for_client", state: payload.state, lang };
    case "restaurantes":
      // `activation_mode: "pending_payment"` is what makes this route answer with the canonical
      // `listingId`; without it a save succeeds and tells the caller nothing it can bind to.
      return { assistedAction: "save_for_client", draft: payload.draft, activation_mode: "pending_payment", lang };
    case "comida-local":
      return {
        assistedAction: "save_for_client",
        draft: payload.draft,
        ...(payload.draftListingId ? { draftListingId: payload.draftListingId } : {}),
        activationMode: "pending_payment",
        lang,
      };
    case "autos":
      return {
        assistedAction: "save_for_client",
        clientUserId: payload.clientUserId ?? null,
        dealerListing: payload.dealerListing,
        ...(payload.vehicleListing ? { vehicleListing: payload.vehicleListing } : {}),
        lang,
      };
    case "bienes-raices":
      return {
        assistedAction: "save_for_client",
        clientUserId: payload.clientUserId ?? null,
        listingRow: payload.listingRow,
        lang,
      };
  }
}

function saveMethodAndUrl(payload: AssistedSavePayload): { method: "POST" | "PATCH"; url: string } {
  const endpoint = QUICK_SALES_CATEGORY_MAP[payload.category].saveEndpoint;
  if (payload.category === "autos-privado") {
    const listingId = typeof payload.listingId === "string" ? payload.listingId.trim() : "";
    if (listingId) return { method: "PATCH", url: `${endpoint}/${listingId}` };
  }
  return { method: "POST", url: endpoint };
}

/** Which field each route answers with. The canonical row id, under its own name per category. */
export function listingIdFrom(category: QuickSalesCategory, json: Record<string, unknown>): string | null {
  const keys =
    category === "autos"
      ? ["mainListingId", "listingId", "id"]
      : category === "autos-privado"
        ? ["listingId", "id"]
        : ["listingId", "id"];
  for (const key of keys) {
    const value = json[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  const nested = json.listing;
  if (nested && typeof nested === "object") {
    const nestedId = (nested as { id?: unknown }).id;
    if (typeof nestedId === "string" && nestedId.trim()) return nestedId.trim();
  }
  return null;
}

export async function saveForClient(payload: AssistedSavePayload): Promise<AssistedSaveResult> {
  const { method, url } = saveMethodAndUrl(payload);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(bodyFor(payload)),
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0, error: "network_error" };
  }
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    json = {};
  }
  if (!res.ok || json.ok !== true) {
    return {
      ok: false,
      status: res.status,
      error: typeof json.error === "string" ? json.error : "save_failed",
      message: typeof json.message === "string" ? json.message : undefined,
    };
  }
  return { ok: true, listingId: listingIdFrom(payload.category, json), raw: json };
}

/**
 * Re-bind the assisted context to the row the save just created.
 *
 * This is the step that makes "the same canonical row" true across saves: the FIRST save is the
 * call that mints the row, so the context that authorized it could not have named it. Handing the
 * id straight back to the custody endpoint — which re-proves the custody ledger before it signs
 * anything — is what makes every later save, preview and publish in this session land on that one
 * row, whatever the browser later believes.
 */
export async function bindCanonicalRow(input: {
  category: QuickSalesCategory;
  businessId: string;
  clientUserId?: string | null;
  listingId: string;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/sales-preview/custody", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        category: input.category,
        businessId: input.businessId,
        clientUserId: input.clientUserId || undefined,
        listingId: input.listingId,
      }),
      cache: "no-store",
    });
    const json = (await res.json()) as { ok?: boolean };
    return res.ok && json.ok === true;
  } catch {
    return false;
  }
}

export type AssistedCustodyContext = {
  category: QuickSalesCategory;
  businessId: string;
  listingId: string | null;
  /** Present for the categories that attribute a listing to a customer account. Optional. */
  clientUserId?: string | null;
  paymentState: string;
  publishReady: boolean;
  expiresAtMs: number;
  packageKey?: string | null;
  plan?: "quick" | "full" | null;
};

/** What the SERVER believes about this staff session right now. Never a client-side guess. */
export async function readAssistedCustodyContext(): Promise<AssistedCustodyContext | null> {
  try {
    const res = await fetch("/api/admin/sales-preview/custody", { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { context?: AssistedCustodyContext | null };
    return json.context ?? null;
  } catch {
    return null;
  }
}

export type AssistedSaveClickOutcome =
  | {
      ok: true;
      listingId: string | null;
      rebound: boolean;
      openedCustomerLogin: false;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      openedCustomerLogin: false;
    };

/**
 * The exact pipeline the visible staff "Save for Client" control runs. Tests click that control;
 * this function is what the click invokes. It never opens customer login and never sends a
 * customer bearer token.
 */
export async function handleAssistedSaveClick(input: {
  category: QuickSalesCategory;
  ctx: AssistedCustodyContext;
  payload: AssistedSavePayload | null;
}): Promise<AssistedSaveClickOutcome> {
  if (!input.payload) {
    return { ok: false, error: "payload_incomplete", openedCustomerLogin: false };
  }
  if (input.payload.category !== input.category) {
    return { ok: false, error: "category_mismatch", openedCustomerLogin: false };
  }
  const result = await saveForClient(input.payload);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      status: result.status,
      openedCustomerLogin: false,
    };
  }
  let rebound = false;
  if (result.listingId) {
    rebound = await bindCanonicalRow({
      category: input.category,
      businessId: input.ctx.businessId,
      listingId: result.listingId,
      clientUserId: input.ctx.clientUserId ?? null,
    });
  }
  return { ok: true, listingId: result.listingId, rebound, openedCustomerLogin: false };
}
