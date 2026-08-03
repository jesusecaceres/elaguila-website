/**
 * Gate BCO-4A / Gate B / Gate B.1 — Sales Team Business Workspace data access. Server-only,
 * always via getAdminSupabase() (service-role, bypasses RLS by design — see
 * app/lib/supabase/server.ts and every other admin data module in this repo). Every caller MUST
 * have already passed requireSalesWorkspaceAccess() — this module does not check authorization
 * itself, but every write function requires a real StrictSalesActor (never a bare string), and
 * every read that returns private fields takes the actor's capability set and shapes the result
 * accordingly — sensitive fields are redacted server-side, never merely hidden in JSX.
 *
 * Reuses the existing Business Identity repositories (app/lib/business/repositories/**) for the
 * detail-page joins wherever they already accept a generic SupabaseClient, rather than
 * re-querying the same tables a second way.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { mapBusinessRow } from "@/app/lib/business/repositories/businessesRepo";
import { listContactsForBusiness } from "@/app/lib/business/repositories/contactsRepo";
import { listServiceAreasForBusiness } from "@/app/lib/business/repositories/serviceAreasRepo";
import { listDigitalProfilesForBusiness } from "@/app/lib/business/repositories/digitalProfilesRepo";
import { listCustomLinksForBusiness } from "@/app/lib/business/repositories/customLinksRepo";
import { listListingLinksForBusiness } from "@/app/lib/business/repositories/listingLinksRepo";
import type { Business, BusinessContact, BusinessCustomLink, BusinessDigitalProfile, BusinessListingLink, BusinessServiceArea } from "@/app/lib/business/types";
import type { BusinessSalesStatus, FollowUpStoredStatus, SalesContactMethod, SalesNoteOutcome, SalesNoteType } from "./salesWorkspaceLogic";
import type { StrictSalesActor } from "./businessWorkspaceAccess";
import { hasCapability } from "./salesWorkspaceCapabilities";

const BUSINESS_LIST_COLUMNS =
  "id, display_name, legal_name, public_name, normalized_name, slug, broad_business_type, specific_business_type, custom_specific_type, business_stage, primary_language, business_primary_language, business_additional_languages, year_started, operating_models, sales_relationships, sales_channels, preferred_response_method, status, onboarding_status, creation_source, created_by_user_id, created_at, updated_at, archived_at";

const REDACTED = "•••• (view_private_contacts required)";

// ---------------------------------------------------------------------------
// Audit log — every mutation in this module writes one row. See
// supabase/migrations/20260731220000_admin_roster_foundation_and_sales_workspace.sql for the schema and
// docs/sales-business-workspace-data-contract-01.md for the governance rules (no secret values,
// no raw note body duplication).
// ---------------------------------------------------------------------------

export type SalesAuditAction =
  | "note_created"
  | "note_updated"
  | "follow_up_created"
  | "follow_up_completed"
  | "follow_up_cancelled"
  | "follow_up_waiting_on_owner"
  | "sales_status_changed"
  | "archived";

async function writeAuditLog(
  actor: StrictSalesActor,
  businessId: string,
  action: SalesAuditAction,
  recordType: "sales_profile" | "sales_note" | "follow_up",
  recordId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const supabase = getAdminSupabase();
  // Best-effort: a failed audit write must never be silently treated as if the underlying
  // mutation itself failed (the mutation already committed), but it's logged to the server
  // console so an operational gap is visible rather than swallowed entirely.
  const { error } = await supabase.from("business_sales_audit_log").insert({
    action,
    business_id: businessId,
    record_type: recordType,
    record_id: recordId,
    actor_roster_id: actor.rosterId,
    actor_auth_user_id: actor.authUserId,
    actor_email: actor.email,
    actor_role: actor.role,
    metadata,
  });
  if (error) {
    console.error(`[sales-workspace-audit] failed to write audit log for ${action} on business ${businessId}:`, error.message);
  }
}

export type BusinessWorkspaceListItem = {
  business: Business;
  salesStatus: BusinessSalesStatus;
  lastContactedAt: string | null;
  nextFollowUpDate: string | null;
  nextFollowUpStatus: FollowUpStoredStatus | null;
  connectedAdCount: number;
  primaryCountry: string | null;
  primaryCity: string | null;
  hasPhone: boolean;
  hasEmail: boolean;
  hasWhatsapp: boolean;
  hasWebsite: boolean;
  completenessMet: number;
  completenessTotal: number;
};

export type BusinessWorkspaceListFilters = {
  keyword?: string;
  broadBusinessType?: string;
  businessStage?: string;
  country?: string;
  status?: BusinessSalesStatus;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasWhatsapp?: boolean;
  hasWebsite?: boolean;
  hasConnectedAds?: boolean;
  limit?: number;
  offset?: number;
};

/**
 * List + filter across ALL businesses (not scoped to a single owner) — the whole point of the
 * staff workspace. Filtering that needs joined data (country, contact-method flags, ad count) is
 * done in application code after a bounded fetch, matching the existing
 * filterPromoCodesForAccess/filterEntitlementsForAccess pattern in adminAccessControl.ts rather
 * than hand-rolling ad hoc cross-table SQL. The list view never returns raw contact *values* at
 * all (only boolean has-phone/email/whatsapp/website flags), so no capability check is needed
 * here — nothing private is shaped.
 */
export async function listBusinessesForWorkspace(filters: BusinessWorkspaceListFilters): Promise<{ items: BusinessWorkspaceListItem[]; total: number }> {
  const supabase = getAdminSupabase();
  let query = supabase.from("businesses").select(BUSINESS_LIST_COLUMNS);
  if (filters.status !== "archived") {
    query = query.is("archived_at", null);
  }
  if (filters.keyword?.trim()) {
    const kw = filters.keyword.trim();
    query = query.or(`display_name.ilike.%${kw}%,public_name.ilike.%${kw}%,normalized_name.ilike.%${kw}%`);
  }
  if (filters.broadBusinessType) query = query.eq("broad_business_type", filters.broadBusinessType);
  if (filters.businessStage) query = query.eq("business_stage", filters.businessStage);
  query = query.order("updated_at", { ascending: false }).limit(500);

  const { data, error } = await query;
  if (error || !data) return { items: [], total: 0 };

  const businesses = (data as Record<string, unknown>[]).map((row) => mapBusinessRow(row as never));
  const businessIds = businesses.map((b) => b.id);
  if (businessIds.length === 0) return { items: [], total: 0 };

  const [salesProfiles, followUps, serviceAreas, contacts, digitalProfiles, customLinks, listingLinks] = await Promise.all([
    fetchSalesProfilesByBusinessIds(businessIds),
    fetchCurrentFollowUpsByBusinessIds(businessIds),
    fetchAllRowsByBusinessIds<{ business_id: string; country: string | null; city_hint: string | null; is_primary: boolean }>(supabase, "business_service_areas", "business_id, country, city_hint, is_primary", businessIds),
    fetchAllRowsByBusinessIds<{ business_id: string; contact_type: string; capabilities: string[] | null }>(supabase, "business_contacts", "business_id, contact_type, capabilities", businessIds),
    fetchAllRowsByBusinessIds<{ business_id: string; platform: string }>(supabase, "business_digital_profiles", "business_id, platform", businessIds),
    fetchAllRowsByBusinessIds<{ business_id: string }>(supabase, "business_custom_links", "business_id", businessIds),
    fetchAllRowsByBusinessIds<{ business_id: string; status: string }>(supabase, "business_listing_links", "business_id, status", businessIds),
  ]);

  let items: BusinessWorkspaceListItem[] = businesses.map((business) => {
    const areasForBusiness = serviceAreas.filter((a) => a.business_id === business.id);
    const primaryArea = areasForBusiness.find((a) => a.is_primary) ?? areasForBusiness[0];
    const contactsForBusiness = contacts.filter((c) => c.business_id === business.id);
    const digitalProfilesForBusiness = digitalProfiles.filter((d) => d.business_id === business.id);
    const customLinksForBusiness = customLinks.filter((l) => l.business_id === business.id);
    const listingLinksForBusiness = listingLinks.filter((l) => l.business_id === business.id);
    const salesProfile = salesProfiles.get(business.id);
    const followUp = followUps.get(business.id);

    const hasPhone = contactsForBusiness.some((c) => c.contact_type === "phone");
    const hasEmail = contactsForBusiness.some((c) => c.contact_type === "email");
    const hasWhatsapp = contactsForBusiness.some((c) => c.contact_type === "phone" && (c.capabilities ?? []).includes("whatsapp"));
    const hasWebsite = contactsForBusiness.some((c) => c.contact_type === "website") || customLinksForBusiness.length > 0;
    const hasGoogleBusiness = digitalProfilesForBusiness.some((d) => d.platform === "google_business");
    const connectedAdCount = listingLinksForBusiness.filter((l) => l.status === "verified" || l.status === "pending").length;

    const completeness = [
      Boolean(business.displayName && business.broadBusinessType && business.businessStage),
      contactsForBusiness.length > 0,
      areasForBusiness.length > 0,
      hasWebsite,
      hasWhatsapp,
      hasGoogleBusiness,
      connectedAdCount > 0,
    ];

    return {
      business,
      salesStatus: salesProfile?.status ?? "new",
      lastContactedAt: salesProfile?.last_contacted_at ?? null,
      nextFollowUpDate: followUp?.scheduled_date ?? null,
      nextFollowUpStatus: followUp?.status ?? null,
      connectedAdCount,
      primaryCountry: primaryArea?.country ?? null,
      primaryCity: primaryArea?.city_hint ?? null,
      hasPhone,
      hasEmail,
      hasWhatsapp,
      hasWebsite,
      completenessMet: completeness.filter(Boolean).length,
      completenessTotal: completeness.length,
    };
  });

  if (filters.country) items = items.filter((i) => i.primaryCountry === filters.country);
  if (filters.status) items = items.filter((i) => i.salesStatus === filters.status);
  if (filters.hasPhone !== undefined) items = items.filter((i) => i.hasPhone === filters.hasPhone);
  if (filters.hasEmail !== undefined) items = items.filter((i) => i.hasEmail === filters.hasEmail);
  if (filters.hasWhatsapp !== undefined) items = items.filter((i) => i.hasWhatsapp === filters.hasWhatsapp);
  if (filters.hasWebsite !== undefined) items = items.filter((i) => i.hasWebsite === filters.hasWebsite);
  if (filters.hasConnectedAds !== undefined) items = items.filter((i) => (i.connectedAdCount > 0) === filters.hasConnectedAds);

  const total = items.length;
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 50;
  return { items: items.slice(offset, offset + limit), total };
}

async function fetchAllRowsByBusinessIds<T extends Record<string, unknown>>(
  supabase: ReturnType<typeof getAdminSupabase>,
  table: string,
  columns: string,
  businessIds: readonly string[],
): Promise<T[]> {
  const { data, error } = await supabase.from(table).select(columns).in("business_id", businessIds as string[]);
  if (error || !data) return [];
  return data as unknown as T[];
}

async function fetchSalesProfilesByBusinessIds(businessIds: readonly string[]) {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("business_sales_profiles")
    .select("business_id, status, last_contacted_at")
    .in("business_id", businessIds as string[]);
  const map = new Map<string, { status: BusinessSalesStatus; last_contacted_at: string | null }>();
  for (const row of (data ?? []) as { business_id: string; status: BusinessSalesStatus; last_contacted_at: string | null }[]) {
    map.set(row.business_id, { status: row.status, last_contacted_at: row.last_contacted_at });
  }
  return map;
}

async function fetchCurrentFollowUpsByBusinessIds(businessIds: readonly string[]) {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("business_follow_ups")
    .select("business_id, scheduled_date, status")
    .in("business_id", businessIds as string[])
    .in("status", ["scheduled", "due_today", "overdue", "waiting_on_owner"]);
  const map = new Map<string, { scheduled_date: string; status: FollowUpStoredStatus }>();
  for (const row of (data ?? []) as { business_id: string; scheduled_date: string; status: FollowUpStoredStatus }[]) {
    map.set(row.business_id, row);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Detail workspace — full joined read for one business.
// ---------------------------------------------------------------------------

export type BusinessSalesProfileRecord = {
  status: BusinessSalesStatus;
  lastContactedAt: string | null;
  updatedAt: string;
};

export type SalesNoteRecord = {
  id: string;
  noteType: SalesNoteType;
  body: string;
  visibility: "internal" | "private";
  contactMethod: SalesContactMethod | null;
  outcome: SalesNoteOutcome | null;
  followUpDate: string | null;
  authorEmail: string;
  authorRole: string;
  createdAt: string;
  updatedAt: string;
};

export type FollowUpRecord = {
  id: string;
  scheduledDate: string;
  scheduledTime: string | null;
  contactMethod: SalesContactMethod | null;
  purpose: string;
  status: FollowUpStoredStatus;
  outcome: string | null;
  completedAt: string | null;
  assignedRosterId: string | null;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
};

export type BusinessWorkspaceDetail = {
  business: Business;
  membership: { manualReviewFlag: boolean; authorizationRole: string | null } | null;
  contacts: BusinessContact[];
  serviceAreas: BusinessServiceArea[];
  digitalProfiles: BusinessDigitalProfile[];
  customLinks: BusinessCustomLink[];
  listingLinks: BusinessListingLink[];
  salesProfile: BusinessSalesProfileRecord;
  notes: SalesNoteRecord[];
  currentFollowUp: FollowUpRecord | null;
};

/**
 * `actor` is required (not optional) — this function creates the sales profile row on first view
 * (get-or-create), which is itself an attributed write. Contact values are redacted unless the
 * actor has `view_private_contacts` — shaped here, server-side, not left for the page to hide.
 */
export async function getBusinessWorkspaceDetail(businessId: string, actor: StrictSalesActor): Promise<BusinessWorkspaceDetail | null> {
  const supabase = getAdminSupabase();
  const { data: businessRow, error } = await supabase.from("businesses").select(BUSINESS_LIST_COLUMNS).eq("id", businessId).maybeSingle();
  if (error || !businessRow) return null;
  const business = mapBusinessRow(businessRow as never);

  const [membershipRow, contactsRaw, serviceAreas, digitalProfiles, customLinks, listingLinks, salesProfile, notes, currentFollowUp] = await Promise.all([
    supabase
      .from("business_memberships")
      .select("manual_review_flag, authorization_role")
      .eq("business_id", businessId)
      .eq("is_primary_owner", true)
      .maybeSingle(),
    listContactsForBusiness(supabase, businessId),
    listServiceAreasForBusiness(supabase, businessId),
    listDigitalProfilesForBusiness(supabase, businessId),
    listCustomLinksForBusiness(supabase, businessId),
    listListingLinksForBusiness(supabase, businessId),
    getOrCreateSalesProfile(businessId, actor),
    listSalesNotes(businessId),
    getCurrentFollowUp(businessId),
  ]);

  const membership = membershipRow.data
    ? {
        manualReviewFlag: Boolean((membershipRow.data as { manual_review_flag: boolean }).manual_review_flag),
        authorizationRole: (membershipRow.data as { authorization_role: string | null }).authorization_role,
      }
    : null;

  const canViewPrivateContacts = hasCapability(actor.capabilities, "view_private_contacts");
  const contacts = canViewPrivateContacts
    ? contactsRaw
    : contactsRaw.map((c) => ({ ...c, value: REDACTED, normalizedValue: REDACTED }));

  return { business, membership, contacts, serviceAreas, digitalProfiles, customLinks, listingLinks, salesProfile, notes, currentFollowUp };
}

export async function getOrCreateSalesProfile(businessId: string, actor: StrictSalesActor): Promise<BusinessSalesProfileRecord> {
  const supabase = getAdminSupabase();
  const { data: existing } = await supabase.from("business_sales_profiles").select("status, last_contacted_at, updated_at").eq("business_id", businessId).maybeSingle();
  if (existing) {
    return { status: (existing as { status: BusinessSalesStatus }).status, lastContactedAt: (existing as { last_contacted_at: string | null }).last_contacted_at, updatedAt: (existing as { updated_at: string }).updated_at };
  }
  const { data: created, error } = await supabase
    .from("business_sales_profiles")
    .insert({
      business_id: businessId,
      status: "new",
      created_by_roster_id: actor.rosterId,
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actor.role,
      updated_by_roster_id: actor.rosterId,
      updated_by_auth_user_id: actor.authUserId,
      updated_by_email: actor.email,
      updated_by_role: actor.role,
    })
    .select("status, last_contacted_at, updated_at")
    .maybeSingle();
  if (error || !created) return { status: "new", lastContactedAt: null, updatedAt: new Date().toISOString() };
  return { status: (created as { status: BusinessSalesStatus }).status, lastContactedAt: (created as { last_contacted_at: string | null }).last_contacted_at, updatedAt: (created as { updated_at: string }).updated_at };
}

export async function updateSalesStatus(businessId: string, status: BusinessSalesStatus, actor: StrictSalesActor): Promise<boolean> {
  const supabase = getAdminSupabase();
  const before = await getOrCreateSalesProfile(businessId, actor);
  const patch: Record<string, unknown> = {
    status,
    updated_by_roster_id: actor.rosterId,
    updated_by_auth_user_id: actor.authUserId,
    updated_by_email: actor.email,
    updated_by_role: actor.role,
    updated_at: new Date().toISOString(),
  };
  if (status === "contacted") patch.last_contacted_at = new Date().toISOString();
  const { error } = await supabase.from("business_sales_profiles").update(patch).eq("business_id", businessId);
  if (error) return false;
  await writeAuditLog(actor, businessId, status === "archived" ? "archived" : "sales_status_changed", "sales_profile", null, { from_status: before.status, to_status: status });
  return true;
}

export async function listSalesNotes(businessId: string): Promise<SalesNoteRecord[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_sales_notes")
    .select("id, note_type, body, visibility, contact_method, outcome, follow_up_date, author_email, author_role, created_at, updated_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    noteType: row.note_type as SalesNoteType,
    body: String(row.body),
    visibility: row.visibility as "internal" | "private",
    contactMethod: (row.contact_method as SalesContactMethod | null) ?? null,
    outcome: (row.outcome as SalesNoteOutcome | null) ?? null,
    followUpDate: (row.follow_up_date as string | null) ?? null,
    authorEmail: String(row.author_email),
    authorRole: String(row.author_role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export type CreateSalesNoteInput = {
  businessId: string;
  noteType: SalesNoteType;
  body: string;
  visibility: "internal" | "private";
  contactMethod: SalesContactMethod | null;
  outcome: SalesNoteOutcome | null;
  followUpDate: string | null;
};

export async function createSalesNote(input: CreateSalesNoteInput, actor: StrictSalesActor): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const trimmedBody = input.body.trim();
  if (!trimmedBody) return { ok: false, error: "empty_body" };
  if (trimmedBody.length > 4000) return { ok: false, error: "body_too_long" };
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_sales_notes")
    .insert({
      business_id: input.businessId,
      note_type: input.noteType,
      body: trimmedBody,
      visibility: input.visibility,
      contact_method: input.contactMethod,
      outcome: input.outcome,
      follow_up_date: input.followUpDate,
      author_roster_id: actor.rosterId,
      author_auth_user_id: actor.authUserId,
      author_email: actor.email,
      author_role: actor.role,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  const id = String((data as { id: string }).id);
  await writeAuditLog(actor, input.businessId, "note_created", "sales_note", id, { note_type: input.noteType });
  return { ok: true, id };
}

export async function getCurrentFollowUp(businessId: string): Promise<FollowUpRecord | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_follow_ups")
    .select("id, scheduled_date, scheduled_time, contact_method, purpose, status, outcome, completed_at, assigned_roster_id, created_by_email, created_by_role, created_at")
    .eq("business_id", businessId)
    .in("status", ["scheduled", "due_today", "overdue", "waiting_on_owner"])
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    scheduledDate: String(row.scheduled_date),
    scheduledTime: (row.scheduled_time as string | null) ?? null,
    contactMethod: (row.contact_method as SalesContactMethod | null) ?? null,
    purpose: String(row.purpose),
    status: row.status as FollowUpStoredStatus,
    outcome: (row.outcome as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    assignedRosterId: (row.assigned_roster_id as string | null) ?? null,
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
  };
}

export type UpsertFollowUpInput = {
  businessId: string;
  scheduledDate: string;
  scheduledTime: string | null;
  contactMethod: SalesContactMethod | null;
  purpose: string;
  assignedRosterId: string | null;
};

/**
 * Creates the business's one current follow-up, or replaces it if one already exists (cancels the
 * stale one, creates the new one) — the DB's partial unique index
 * (business_follow_ups_one_current_per_business) is the actual guarantee; this function just
 * makes the "replace" UX explicit rather than surfacing a raw constraint-violation error.
 */
export async function upsertCurrentFollowUp(input: UpsertFollowUpInput, actor: StrictSalesActor): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedPurpose = input.purpose.trim();
  if (!trimmedPurpose) return { ok: false, error: "empty_purpose" };
  const supabase = getAdminSupabase();
  const existing = await getCurrentFollowUp(input.businessId);
  if (existing) {
    await supabase.from("business_follow_ups").update({ status: "cancelled", outcome: "Replaced by a new follow-up.", updated_at: new Date().toISOString() }).eq("id", existing.id);
    await writeAuditLog(actor, input.businessId, "follow_up_cancelled", "follow_up", existing.id, { reason: "replaced" });
  }
  const { data, error } = await supabase
    .from("business_follow_ups")
    .insert({
      business_id: input.businessId,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime,
      contact_method: input.contactMethod,
      purpose: trimmedPurpose,
      status: "scheduled",
      assigned_roster_id: input.assignedRosterId ?? actor.rosterId,
      created_by_roster_id: actor.rosterId,
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actor.role,
    })
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  await writeAuditLog(actor, input.businessId, "follow_up_created", "follow_up", data ? String((data as { id: string }).id) : null, { scheduled_date: input.scheduledDate });
  return { ok: true };
}

export async function completeFollowUp(followUpId: string, businessId: string, outcome: string | null, actor: StrictSalesActor): Promise<boolean> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("business_follow_ups")
    .update({ status: "completed", outcome, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", followUpId);
  if (error) return false;
  await writeAuditLog(actor, businessId, "follow_up_completed", "follow_up", followUpId, { outcome });
  return true;
}

export async function markFollowUpStatus(
  followUpId: string,
  businessId: string,
  status: Extract<FollowUpStoredStatus, "cancelled" | "waiting_on_owner">,
  actor: StrictSalesActor,
): Promise<boolean> {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("business_follow_ups").update({ status, updated_at: new Date().toISOString() }).eq("id", followUpId);
  if (error) return false;
  await writeAuditLog(actor, businessId, status === "cancelled" ? "follow_up_cancelled" : "follow_up_waiting_on_owner", "follow_up", followUpId, {});
  return true;
}
