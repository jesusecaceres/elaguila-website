/**
 * Pure helpers for the normalized Clasificados operating shell (header / summary / filter bar /
 * listing-card sections). No React, no I/O — importable from server pages, client tables and the
 * tsx verifier alike.
 */
import { isGenericListingPubliclyLive } from "@/app/admin/_lib/adminLivePredicates";
import {
  BIENES_FSBO_LIFECYCLE_CATEGORY,
  isBrFsboRow,
} from "@/app/lib/listingLifecycle/bienesFsboLifecycle";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import type { AdminCategorySummary } from "@/app/admin/_lib/adminCategorySummary";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import { adminLowerBoundTitle } from "@/app/admin/_lib/adminFilterTruth";
import { ADMIN_QUEUE_DEFAULT_LIMIT, normalizeAdminQueueLimit } from "@/app/admin/_lib/adminQueueActionFlow";
import type { AdminListingCommercialTruth } from "@/app/admin/_lib/adminListingCommercialTruth";
import {
  classifyPublication,
  type PublicationSemantic,
  type PublicationTruth,
} from "@/app/admin/_lib/publicationSemantics";

// ── Category names ─────────────────────────────────────────────────────────────────────────────
export const ADMIN_CATEGORY_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  rentas: "Rentas",
  "bienes-raices": "Bienes Raíces",
  "en-venta": "En Venta",
  clases: "Clases",
  comunidad: "Comunidad",
  "mascotas-y-perdidos": "Mascotas y Perdidos",
  busco: "Busco",
  autos: "Autos",
  empleos: "Empleos",
  servicios: "Servicios",
  restaurantes: "Restaurantes",
  "comida-local": "Comida Local",
  "ofertas-locales": "Ofertas Locales",
  travel: "Viajes",
  viajes: "Viajes",
};

export function adminCategoryDisplayName(slug: string): string {
  const s = String(slug ?? "").trim().toLowerCase();
  return ADMIN_CATEGORY_DISPLAY_NAMES[s] ?? (s || "—");
}

// ── Counts: null is "unavailable", never zero ─────────────────────────────────────────────────
export function adminCountText(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? new Intl.NumberFormat("en-US").format(n) : "—";
}


export type AdminSummaryCell = {
  key: string;
  label: string;
  value: string;
  tone: "neutral" | "good" | "warn" | "bad";
  title?: string;
};

/** Pure: the cells the operating summary shows. `expired` appears only when the category has one (non-null). */
export function buildAdminCategorySummaryCells(summary: AdminCategorySummary, lang: AdminLang = "en"): AdminSummaryCell[] {
  const unavailable = adminTr(lang, "catShell.summary.unavailable");
  const lowerBound = new Set<string>(summary.lowerBound ?? []);
  const count = (key: string, labelKey: string, n: number | null, tone: AdminSummaryCell["tone"]): AdminSummaryCell => ({
    key,
    label: adminTr(lang, labelKey),
    // A scan-capped metric is a LOWER BOUND ("≥ n"), never presented as the whole-dataset number.
    value: n != null && lowerBound.has(key) ? `≥ ${adminCountText(n)}` : adminCountText(n),
    // A null count is unavailable — neutral, with the honest reason as a tooltip. Never a fake 0.
    tone: n == null ? "neutral" : tone,
    title: n == null ? unavailable : lowerBound.has(key) ? adminLowerBoundTitle(lang) : undefined,
  });

  const cells: AdminSummaryCell[] = [
    count("total", "catShell.summary.total", summary.total, "neutral"),
    count("live", "catShell.summary.live", summary.live, "good"),
    count("needsAttention", "catShell.summary.needsAttention", summary.needsAttention, (summary.needsAttention ?? 0) > 0 ? "warn" : "neutral"),
    count("paymentIssue", "catShell.summary.paymentIssue", summary.paymentIssue, (summary.paymentIssue ?? 0) > 0 ? "bad" : "neutral"),
  ];
  if (summary.expired != null) {
    cells.push(count("expired", "catShell.summary.expired", summary.expired, summary.expired > 0 ? "warn" : "neutral"));
  }
  cells.push({
    key: "sourceHealth",
    label: adminTr(lang, "catShell.summary.sourceHealth"),
    value: adminTr(lang, summary.sourceHealth.ok ? "catShell.summary.healthOk" : "catShell.summary.healthProblem"),
    tone: summary.sourceHealth.ok ? "good" : "bad",
    title: summary.sourceHealth.note ?? undefined,
  });
  return cells;
}

// ── Real statuses per category (proper <select>, not free text) ───────────────────────────────
export type AdminStatusOption = { value: string; label: string };

export function humanizeToken(v: string): string {
  const t = String(v ?? "").trim().replace(/[_-]+/g, " ");
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

const LISTINGS_STATUSES = ["needs_review", "active", "pending", "flagged", "unpublished", "sold", "removed"] as const;

/** Status vocabularies exactly as `publicationSemantics.ts` reads them per canonical table. */
const STATUS_VOCAB: Record<string, readonly string[]> = {
  autos: ["active", "pending_payment", "payment_failed", "draft", "suspended", "removed", "cancelled"],
  servicios: ["published", "pending_payment", "draft", "pending_review", "suspended", "paused_unpublished", "rejected", "archived"],
  restaurantes: ["published", "pending_payment", "draft", "pending_review", "suspended", "paused_unpublished", "rejected", "archived"],
  "comida-local": ["published", "pending_payment", "draft", "pending_review", "suspended", "paused_unpublished", "rejected", "archived"],
  empleos: ["published", "draft", "pending_review", "paused", "rejected", "archived"],
  "ofertas-locales": ["approved", "submitted", "draft", "rejected", "archived", "expired"],
  travel: ["approved", "submitted", "in_review", "changes_requested", "rejected", "unpublished", "expired"],
  viajes: ["approved", "submitted", "in_review", "changes_requested", "rejected", "unpublished", "expired"],
};

/** Real status values for a category's filter `<select>`. Unknown category → the generic listings set. */
export function adminStatusOptionsForCategory(slug: string): AdminStatusOption[] {
  const s = String(slug ?? "").trim().toLowerCase();
  const vocab = STATUS_VOCAB[s] ?? LISTINGS_STATUSES;
  return vocab.map((value) => ({
    value,
    label: value === "needs_review" ? "Needs review (pending / flagged / reported)" : humanizeToken(value),
  }));
}

/** A status coming from the URL that is not in the category's vocabulary is kept visible, never dropped silently. */
export function adminStatusOptionsWithCurrent(options: AdminStatusOption[], current: string): AdminStatusOption[] {
  const c = String(current ?? "").trim();
  if (!c || options.some((o) => o.value.toLowerCase() === c.toLowerCase())) return options;
  return [...options, { value: c, label: `${c} (custom)` }];
}

// ── Bienes Raices lane selector (Negocio / Privado FSBO) ─────────────────────────────────────
export type AdminBrLane = "negocio" | "privado";

export const ADMIN_BR_LANE_OPTIONS: ReadonlyArray<{ value: AdminBrLane | "all"; label: string; hint: string }> = [
  { value: "all", label: "All Bienes Raíces", hint: "Negocio and Privado (FSBO) together" },
  { value: "negocio", label: "Negocio", hint: "Business lane: parent listing + inventory children (subscription, capacity)" },
  { value: "privado", label: "Privado (FSBO)", hint: "Private-seller lane: independent, fixed 45-day term (seller_type = personal)" },
];

/** Unknown / missing lane values fall back to `all` — a bad URL never hides rows. */
export function parseAdminBrLane(sp: Record<string, string | string[] | undefined> | undefined): AdminBrLane | "all" {
  const v = sp?.lane;
  const raw = (typeof v === "string" ? v : Array.isArray(v) ? v[0] : "")?.trim().toLowerCase();
  return raw === "negocio" || raw === "privado" ? raw : "all";
}

// ── Row chips (BR lane + inventory role) ──────────────────────────────────────────────────────
export type AdminRowChip = {
  key: string;
  /** adminTr key */
  labelKey: string;
  tone: "lane-negocio" | "lane-privado" | "role" | "neutral";
};

export type AdminRowChipInput = {
  category?: string | null;
  seller_type?: string | null;
  inventory_role?: string | null;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
};

/**
 * The lane / inventory-role chips the generic staff row MUST show (Bienes Raíces Negocio vs Privado
 * (FSBO), parent vs child inventory). The lane comes from the same shared predicate the webhook, the
 * term rule and the renewal gate use (`isBrFsboRow`) — never from a display heuristic.
 */
export function adminListingRowChips(row: AdminRowChipInput): AdminRowChip[] {
  const chips: AdminRowChip[] = [];
  const category = String(row.category ?? "").trim().toLowerCase();
  if (category === BIENES_FSBO_LIFECYCLE_CATEGORY) {
    const fsbo = isBrFsboRow({ category: row.category, seller_type: row.seller_type } );
    chips.push(
      fsbo
        ? { key: "lane", labelKey: "catShell.chip.lanePrivado", tone: "lane-privado" }
        : { key: "lane", labelKey: "catShell.chip.laneNegocio", tone: "lane-negocio" },
    );
  }
  const role = String(row.inventory_role ?? "").trim().toLowerCase();
  if (role) {
    chips.push({ key: "role", labelKey: role === "main" ? "catShell.chip.roleMain" : "catShell.chip.roleChild", tone: "role" });
  }
  if (String(row.br_inventory_group_id ?? "").trim() || String(row.br_inventory_parent_listing_id ?? "").trim()) {
    chips.push({ key: "group", labelKey: "catShell.chip.inGroup", tone: "neutral" });
  }
  return chips;
}

export const ADMIN_CHIP_TONE_CLASS: Record<AdminRowChip["tone"], string> = {
  "lane-negocio": "border-[#1E4A7A]/40 bg-[#EEF4FC] text-[#1E4A7A]",
  "lane-privado": "border-[#2A4536]/30 bg-[#F4FAF2] text-[#2A4536]",
  role: "border-[#C9B46A]/50 bg-[#FFFCF7] text-[#5C4E2E]",
  neutral: "border-[#E8DFD0] bg-[#FAF7F2] text-[#5C5346]",
};

// ── Publication semantic → presentation ───────────────────────────────────────────────────────
export function adminSemanticIsPublic(semantic: PublicationSemantic | null | undefined): boolean {
  return semantic === "PUBLIC";
}

export const ADMIN_SEMANTIC_TONE_CLASS: Record<PublicationSemantic, string> = {
  PUBLIC: "border-emerald-300 bg-emerald-50 text-emerald-900",
  NOT_PUBLIC_PAYMENT: "border-amber-300 bg-amber-50 text-amber-900",
  NOT_PUBLIC_DRAFT: "border-[#E8DFD0] bg-[#FAF7F2] text-[#5C5346]",
  NOT_PUBLIC_MODERATION: "border-amber-300 bg-amber-50 text-amber-900",
  PAUSED: "border-[#E8DFD0] bg-[#FAF7F2] text-[#5C5346]",
  EXPIRED: "border-orange-300 bg-orange-50 text-orange-900",
  REMOVED: "border-red-200 bg-red-50 text-red-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  UNKNOWN: "border-[#E8DFD0] bg-white text-[#7A7164]",
};

/**
 * LISTING TRUTH for a row of the generic `public.listings` table (Rentas, Bienes Raíces, En Venta,
 * Clases, Comunidad, Mascotas, Busco). Read through the shared publication semantics; the payment
 * hint only ever comes from a KNOWN payment record — no record means "unknown", never "unpaid".
 */
export function adminListingTruthForListingsRow(
  row: Record<string, unknown>,
  commercial: AdminListingCommercialTruth | null | undefined,
  now?: Date,
): PublicationTruth {
  const cleared =
    commercial && commercial.state === "known"
      ? ["paid", "succeeded"].includes(String(commercial.paymentStatus ?? "").trim().toLowerCase())
      : undefined;
  const truth = classifyPublication("listings", row, { now, paymentCleared: cleared });
  // The chip must agree with the Live scope and the row action (Live = the public reader's predicate). The
  // category-agnostic semantic says PUBLIC for a Rentas row with no paid term and PAUSED for a sold Busco /
  // Comunidad / Clases row that the public reader still shows. Bienes Raices needs the parent map, so it keeps
  // the base semantic.
  if (String(row.category ?? "").trim().toLowerCase() === "bienes-raices") return truth;
  const nowMs = (now ?? new Date()).getTime();
  const live = isGenericListingPubliclyLive(null, row, nowMs);
  if (live && truth.semantic !== "PUBLIC") {
    return { ...truth, semantic: "PUBLIC", reason: "Publicly visible (matches the public reader)." };
  }
  if (!live && truth.semantic === "PUBLIC") {
    const exp = typeof row.expires_at === "string" ? new Date(row.expires_at).getTime() : NaN;
    if (Number.isFinite(exp) && exp <= nowMs) {
      return { ...truth, semantic: "EXPIRED", reason: "Term elapsed - not in the public read set." };
    }
    if (!Number.isFinite(exp)) {
      return { ...truth, semantic: "NOT_PUBLIC_PAYMENT", reason: "No paid term on record - not in the public read set." };
    }
    return { ...truth, semantic: "PAUSED", reason: "Not in the public read set." };
  }
  return truth;
}

// ── Commercial truth → presentation ───────────────────────────────────────────────────────────
export type AdminCommercialTone = "ok" | "waiting" | "attention" | "neutral";

/** Tone for the whole commercial block. Unknown/unreadable is `neutral` (never green, never red). */
export function adminCommercialTone(truth: AdminListingCommercialTruth | null | undefined): AdminCommercialTone {
  if (!truth || truth.state !== "known") return "neutral";
  if (!truth.circuit) return "neutral";
  return truth.circuit.severity;
}

export const ADMIN_COMMERCIAL_TONE_CLASS: Record<AdminCommercialTone, string> = {
  ok: "border-emerald-300 bg-emerald-50 text-emerald-900",
  waiting: "border-[#E8DFD0] bg-[#FAF7F2] text-[#5C5346]",
  attention: "border-red-200 bg-red-50 text-red-800",
  neutral: "border-[#E8DFD0] bg-white text-[#7A7164]",
};

export function adminMoney(cents: number | null | undefined): string | null {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

// ── Filter bar plumbing (server-side GET form) ────────────────────────────────────────────────
/** Transient action-proof params must never be carried through a filter submit. */
const TRANSIENT_PARAMS = new Set(["action_status", "action", "target", "target_label", "target_ad_id", "scroll_y", "action_error"]);

function firstOf(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

/**
 * Hidden inputs that keep every OTHER query param (scope, lane, category-specific filters …) alive
 * when the filter form is submitted. Params the form itself owns are excluded so they are replaced.
 */
export function adminFilterHiddenParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  ownFieldNames: readonly string[],
): { name: string; value: string }[] {
  const own = new Set(ownFieldNames);
  const out: { name: string; value: string }[] = [];
  for (const [name, raw] of Object.entries(searchParams ?? {})) {
    if (own.has(name) || TRANSIENT_PARAMS.has(name)) continue;
    const v = firstOf(raw)?.trim();
    if (v) out.push({ name, value: v });
  }
  return out;
}

/** Row-limit choices for the filter bar; always contains the effective current value. */
export const ADMIN_QUEUE_LIMIT_CHOICES: readonly number[] = [25, ADMIN_QUEUE_DEFAULT_LIMIT, 100, 200, 300, 400, 500];

export function adminQueueLimitChoices(rawLimit: string | undefined): { current: number; choices: number[] } {
  const current = normalizeAdminQueueLimit(rawLimit, ADMIN_QUEUE_DEFAULT_LIMIT);
  const choices = [...new Set([...ADMIN_QUEUE_LIMIT_CHOICES, current])].sort((a, b) => a - b);
  return { current, choices };
}

/** Leonix Ad ID filter: case-insensitive contains on the stored `leonix_ad_id`. Blank filter keeps all rows. */
export function adminRowMatchesLeonixAdIdFilter(row: { leonix_ad_id?: string | null }, filter: string): boolean {
  const f = String(filter ?? "").trim().toLowerCase();
  if (!f) return true;
  return String(row.leonix_ad_id ?? "").toLowerCase().includes(f);
}

/** Owner filter: case-insensitive contains on `owner_id` / `owner_user_id`. Blank filter keeps all rows. */
export function adminRowMatchesOwnerFilter(row: { owner_id?: string | null; owner_user_id?: string | null }, filter: string): boolean {
  const f = String(filter ?? "").trim().toLowerCase();
  if (!f) return true;
  return `${row.owner_id ?? ""} ${row.owner_user_id ?? ""}`.toLowerCase().includes(f);
}
