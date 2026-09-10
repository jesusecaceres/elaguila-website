/**
 * LEO-15 Business Concierge read bridge — owner-gated server orchestration.
 * Strictly read-only. Single-business fetch by canonical UUID — no cross-business reads.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import {
  buildLeoBusinessConciergeContext,
  isValidLeoBusinessConciergeId,
  resolveLeoBusinessConciergeRef,
  type LeoBusinessConciergeBuildInput,
} from "@/app/leo/_lib/leoBusinessConciergeBridge";
import type {
  LeoBusinessConciergeAvailability,
  LeoBusinessConciergeBusinessRef,
  LeoBusinessConciergeContext,
  LeoBusinessConciergeLeadSnapshot,
  LeoBusinessConciergeSupportSnapshot,
  LeoConversationEntityRef,
} from "@/app/leo/_lib/leoTypes";

const LEAD_CONCIERGE_SELECT =
  "id,business_name,business_category,inquiry_type,status,city_area,website_or_social";

const SUPPORT_CONCIERGE_SELECT = "id,status,subject";

function boundText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 3)}...` : t;
}

async function fetchLeadSnapshot(
  id: string,
): Promise<{ lead: LeoBusinessConciergeLeadSnapshot | null; availability: LeoBusinessConciergeAvailability; limitation?: string }> {
  if (!isValidLeoBusinessConciergeId(id)) {
    return { lead: null, availability: "UNAVAILABLE", limitation: "Invalid lead id." };
  }
  if (!isSupabaseAdminConfigured()) {
    return {
      lead: null,
      availability: "UNAVAILABLE",
      limitation: "Supabase admin not configured — lead context unavailable.",
    };
  }
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("leonix_leads")
      .select(LEAD_CONCIERGE_SELECT)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      return {
        lead: null,
        availability: "UNAVAILABLE",
        limitation: "Lead record could not be loaded.",
      };
    }
    if (!data) {
      return { lead: null, availability: "EMPTY", limitation: "No lead matched that canonical id." };
    }
    const row = data as Record<string, unknown>;
    const lead: LeoBusinessConciergeLeadSnapshot = {
      id: String(row.id),
      businessName: boundText(row.business_name, 120),
      businessCategory: boundText(row.business_category, 80),
      inquiryType: boundText(row.inquiry_type, 80),
      status: String(row.status ?? ""),
      cityArea: boundText(row.city_area, 80),
      websiteOrSocial: boundText(row.website_or_social, 120),
    };
    return { lead, availability: "AVAILABLE" };
  } catch {
    return { lead: null, availability: "UNAVAILABLE", limitation: "Lead fetch failed." };
  }
}

async function fetchSupportSnapshot(
  id: string,
): Promise<{ support: LeoBusinessConciergeSupportSnapshot | null; availability: LeoBusinessConciergeAvailability; limitation?: string }> {
  if (!isValidLeoBusinessConciergeId(id)) {
    return { support: null, availability: "UNAVAILABLE", limitation: "Invalid support ticket id." };
  }
  if (!isSupabaseAdminConfigured()) {
    return {
      support: null,
      availability: "UNAVAILABLE",
      limitation: "Supabase admin not configured — support context unavailable.",
    };
  }
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("support_tickets")
      .select(SUPPORT_CONCIERGE_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return {
        support: null,
        availability: "UNAVAILABLE",
        limitation: "Support ticket could not be loaded.",
      };
    }
    if (!data) {
      return { support: null, availability: "EMPTY", limitation: "No support ticket matched that id." };
    }
    const row = data as Record<string, unknown>;
    const subject = boundText(row.subject, 80);
    return {
      support: {
        id: String(row.id),
        status: String(row.status ?? ""),
        subjectLabel: subject,
      },
      availability: "PARTIAL",
    };
  } catch {
    return { support: null, availability: "UNAVAILABLE", limitation: "Support ticket fetch failed." };
  }
}

export async function getLeoBusinessConciergeContextForRef(input: {
  businessRef: LeoBusinessConciergeBusinessRef;
  nowMs?: number;
}): Promise<LeoBusinessConciergeContext> {
  await requireLeoOwnerAccess();
  const nowMs = input.nowMs ?? Date.now();
  const buildInput: LeoBusinessConciergeBuildInput = {
    nowMs,
    businessRef: input.businessRef,
    sourceAvailability: "NOT_IMPLEMENTED",
    sourceLimitations: [],
  };

  if (input.businessRef.kind === "lead") {
    const fetched = await fetchLeadSnapshot(input.businessRef.id);
    buildInput.lead = fetched.lead;
    buildInput.sourceAvailability = fetched.availability;
    if (fetched.limitation) buildInput.sourceLimitations!.push(fetched.limitation);
  } else {
    const fetched = await fetchSupportSnapshot(input.businessRef.id);
    buildInput.support = fetched.support;
    buildInput.sourceAvailability = fetched.availability;
    if (fetched.limitation) buildInput.sourceLimitations!.push(fetched.limitation);
  }

  return buildLeoBusinessConciergeContext(buildInput);
}

export async function getLeoBusinessConciergeContextFromRefs(input: {
  nowMs?: number;
  entityRef?: LeoConversationEntityRef | null;
  focusEntityRef?: LeoConversationEntityRef | null;
  selectedEntityRef?: LeoConversationEntityRef | null;
  requiresBusinessTarget?: boolean;
}): Promise<
  | { status: "OK"; context: LeoBusinessConciergeContext }
  | { status: "AMBIGUOUS"; clarification: string }
  | { status: "NONE"; summary: string }
> {
  await requireLeoOwnerAccess();
  const resolved = resolveLeoBusinessConciergeRef({
    entityRef: input.entityRef,
    focusEntityRef: input.focusEntityRef,
    selectedEntityRef: input.selectedEntityRef,
  });

  if (resolved.status === "AMBIGUOUS") {
    return { status: "AMBIGUOUS", clarification: resolved.clarification };
  }
  if (resolved.status === "NONE") {
    const summary = input.requiresBusinessTarget
      ? "Select a client or lead card first, or specify which business you mean. LEO will not guess."
      : "No canonical business identity was resolved.";
    return { status: "NONE", summary };
  }

  const context = await getLeoBusinessConciergeContextForRef({
    businessRef: resolved.ref,
    nowMs: input.nowMs,
  });
  return { status: "OK", context };
}

/** Fetch bounded concierge contexts for Morning Brief client-care enrichment (max 2). */
export async function fetchLeoBusinessConciergeEnrichmentForRefs(
  refs: LeoBusinessConciergeBusinessRef[],
  nowMs: number,
): Promise<Map<string, LeoBusinessConciergeContext>> {
  await requireLeoOwnerAccess();
  const out = new Map<string, LeoBusinessConciergeContext>();
  const unique = refs.slice(0, 2);
  const results = await Promise.allSettled(
    unique.map((ref) => getLeoBusinessConciergeContextForRef({ businessRef: ref, nowMs })),
  );
  for (let i = 0; i < unique.length; i++) {
    const res = results[i];
    if (res?.status === "fulfilled") {
      out.set(`${unique[i]!.kind}:${unique[i]!.id}`, res.value);
    }
  }
  return out;
}
