/**
 * Gate BCO-5A — staff-side Living Business Book visibility shaping. Separate from
 * app/lib/business/livingBook/logic.ts (which handles the OWNER-facing shaping and doesn't know
 * about staff capabilities) because this needs SalesWorkspaceCapability, an admin-layer concept.
 * Shapes results by capability BEFORE they are returned — never left for the page/JSX to hide.
 */
import "server-only";

import type { BusinessEvidence, BusinessFact } from "@/app/lib/business/livingBook/types";
import { hasCapability, type SalesWorkspaceCapability } from "./salesWorkspaceCapabilities";

export function shapeFactsForStaffActor(facts: readonly BusinessFact[], capabilities: ReadonlySet<SalesWorkspaceCapability>): BusinessFact[] {
  if (hasCapability(capabilities, "view_private_business_facts")) return [...facts];
  return facts.filter((f) => f.sensitivity !== "sensitive");
}

export function shapeEvidenceForStaffActor(evidence: readonly BusinessEvidence[], capabilities: ReadonlySet<SalesWorkspaceCapability>): BusinessEvidence[] {
  if (hasCapability(capabilities, "view_private_business_facts")) return [...evidence];
  // Evidence carries its own visibility column (owner_and_staff / staff_only), independent of
  // sensitivity — every staff role with base view_business_book access already sees staff_only
  // evidence; what's gated behind view_private_business_facts is content collected under a
  // stricter consent state (owner_declined / unknown), never surfaced without the extra capability.
  return evidence.filter((e) => e.consentState !== "unknown" && e.consentState !== "owner_declined");
}
