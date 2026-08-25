/**
 * Gate 10B — pure Creative Truth Packet compile helpers. No DB, no UI.
 * Status records what is canonical; Missing means the value was not stored.
 */
import type { SnapshotCategory } from "./types";

export const CONFIRMED_GOAL_FACT_KEYS = ["owner_goals", "owner_defined_success"] as const;
export const CONFIRMED_CUSTOMER_FACT_KEYS = ["target_customer"] as const;
export const CONFIRMED_SERVICE_FACT_KEYS = ["product_service_summary", "most_requested_item"] as const;

const CONFIRMED_STATES = new Set(["owner_confirmed", "staff_confirmed"]);

export type CompiledFact = {
  fieldKey: string;
  displayValue: string;
  sourceClass: string | null;
  confirmationState: string | null;
  factId: string;
};

export type CompiledContact = {
  id: string;
  contactType: string;
  value: string;
  isPrimary: boolean;
  visibility: string;
  channelKind: string | null;
  capabilities: readonly string[];
  isWhatsApp: boolean;
};

export type NewBriefPrefill = {
  businessGoal: string;
  campaignObjective: string;
  readerNeed: string;
  targetAudience: string;
  primaryMessage: string;
  cta: string;
  contactPath: string;
  keyServicesText: string;
  offer: string;
};

export function isConfirmedLivingBookFact(confirmationState: string | null | undefined, status: string | null | undefined): boolean {
  if (status && status !== "active") return false;
  return CONFIRMED_STATES.has(String(confirmationState ?? ""));
}

export function firstFactValue(facts: readonly CompiledFact[], keys: readonly string[]): string {
  for (const key of keys) {
    const hit = facts.find((fact) => fact.fieldKey === key && fact.displayValue.trim());
    if (hit) return hit.displayValue.trim();
  }
  return "";
}

export function contactIsWhatsApp(contact: Pick<CompiledContact, "channelKind" | "capabilities">): boolean {
  if (contact.channelKind === "whatsapp") return true;
  return contact.capabilities.includes("whatsapp");
}

export function preferredContactPath(contacts: readonly CompiledContact[]): string {
  const website = contacts.find((row) => row.contactType === "website" && row.value.trim());
  if (website) return website.value.trim();
  const primary = contacts.find((row) => row.isPrimary && row.value.trim());
  if (primary) return primary.value.trim();
  const any = contacts.find((row) => row.value.trim());
  return any?.value.trim() ?? "";
}

export function missingBrandTruthItems(): readonly string[] {
  return [
    "Brand colors — not stored as canonical creative truth.",
    "Brand personality / tone — not stored as canonical creative truth.",
  ];
}

export function factValueFromCategories(categories: readonly SnapshotCategory[], fieldKey: string): string {
  for (const category of categories) {
    const facts = Array.isArray(category.data.facts) ? category.data.facts : [];
    for (const fact of facts) {
      const row = fact as { fieldKey?: string; displayValue?: string };
      if (row.fieldKey === fieldKey && String(row.displayValue ?? "").trim()) {
        return String(row.displayValue).trim();
      }
    }
  }
  return "";
}

export function contactPathFromCategories(categories: readonly SnapshotCategory[]): string {
  const contactsCategory = categories.find((row) => row.category === "approved_contacts_location");
  const contacts = Array.isArray(contactsCategory?.data.contacts) ? contactsCategory.data.contacts as CompiledContact[] : [];
  return preferredContactPath(contacts);
}

export function recommendationNeedFromCategories(categories: readonly SnapshotCategory[]): string {
  const recs = categories.find((row) => row.category === "source_recommendation");
  const rows = Array.isArray(recs?.data.recommendations) ? recs.data.recommendations : [];
  const first = rows[0] as { needEn?: string; needEs?: string } | undefined;
  return String(first?.needEn || first?.needEs || "").trim();
}

/** Deterministic new-brief prefill. Empty string means no safe mapping. Never invents CTA/offer/colors. */
export function briefPrefillFromPacket(categories: readonly SnapshotCategory[]): NewBriefPrefill {
  const ownerGoal = factValueFromCategories(categories, "owner_goals") || factValueFromCategories(categories, "owner_defined_success");
  const audience = factValueFromCategories(categories, "target_customer");
  const service = factValueFromCategories(categories, "product_service_summary") || factValueFromCategories(categories, "most_requested_item");
  const need = recommendationNeedFromCategories(categories);
  return {
    businessGoal: ownerGoal,
    campaignObjective: ownerGoal || need,
    readerNeed: need,
    targetAudience: audience,
    primaryMessage: service,
    cta: "",
    contactPath: contactPathFromCategories(categories),
    keyServicesText: service,
    offer: "",
  };
}

export function packetExcludesRawMeetingNotes(source: string): boolean {
  return !source.includes("business_meeting_notes") && !source.includes("from(\"meetings\")");
}
