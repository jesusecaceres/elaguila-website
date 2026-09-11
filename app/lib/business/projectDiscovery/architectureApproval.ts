/**
 * Client Discovery & Project Blueprint Engine, Gate 4 — persistence for an APPROVED architecture
 * decision (MD <technical_decision_truth>: "DISCOVERY TRUTH -> DETERMINISTIC RECOMMENDATION ->
 * LEONIX ARCHITECTURE REVIEW -> APPROVE / MODIFY -> TECHNICAL_DECISION discovery items").
 *
 * A recommendation from architectureDecisionEngine.ts is NOT itself a Technical Decision — it only
 * becomes one when this function is called, which only ever happens from the architecture-review
 * API route after a real review_project_discovery-capable actor approves it. This file is the
 * ONLY place that ever writes truthClass "technical_decision" for architecture fields; it reuses
 * Gate 1's own captureProjectDiscoveryItem() upsert — no new repository primitive, no bypass of the
 * "never silently collapsed" truth/completeness contract.
 */
import "server-only";

import { captureProjectDiscoveryItem } from "./repository";
import type { CaptureItemResult } from "./repository";
import type { ProjectDiscoveryActor } from "./types";
import type { WebsiteArchitectureDecisionPacket } from "./architectureDecisionEngine";
import { getPlatform } from "./platformRegistry";

function platformLabel(key: string | null): string {
  if (!key) return "N/A";
  const platform = getPlatform(key);
  return platform ? `${platform.nameEs} / ${platform.nameEn}` : key;
}

function summarizeInScope(packet: WebsiteArchitectureDecisionPacket): string {
  const parts: string[] = [`${packet.architectureClass.replace(/_/g, " ")}`];
  if (packet.frontend.status === "required") parts.push(`Frontend: ${platformLabel(packet.frontend.platformKey)}`);
  if (packet.hosting.status === "required") parts.push(`Hosting: ${platformLabel(packet.hosting.platformKey)}`);
  if (packet.cms.decision === "REQUIRED") parts.push(`CMS: ${platformLabel(packet.cms.platformKey)}`);
  if (packet.formsEmail.status === "required") parts.push(`Forms/Email: ${platformLabel(packet.formsEmail.platformKey)}`);
  if (packet.database.decision === "REQUIRED") parts.push("Database: Supabase");
  if (packet.auth.decision === "REQUIRED") parts.push("Auth: Supabase");
  for (const integration of packet.externalIntegrations) parts.push(`Integration: ${platformLabel(integration.platformKey)}`);
  if (packet.preserveExistingPlatformKey) parts.push(`Preserve: ${platformLabel(packet.preserveExistingPlatformKey)}`);
  return parts.join("; ");
}

function summarizeOutOfScope(packet: WebsiteArchitectureDecisionPacket): string {
  const parts: string[] = [];
  if (packet.cms.decision === "NOT_NEEDED") parts.push("CMS");
  if (packet.database.decision === "NOT_NEEDED") parts.push("Database");
  if (packet.auth.decision === "NOT_NEEDED") parts.push("Authentication / user accounts");
  if (packet.storage.decision === "NOT_NEEDED") parts.push("Protected file storage");
  if (packet.formsEmail.status === "not_needed") parts.push("Transactional email");
  return parts.length > 0 ? `Not included: ${parts.join(", ")}` : "No explicit exclusions beyond the standard scope.";
}

export type PersistArchitectureDecisionResult = { ok: true } | { ok: false; reason: string };

/**
 * Persists the approved (or reviewer-overridden) packet as the discovery's real TECHNICAL_DECISION
 * items, resolving Gate 2's own two general-catalog needs_leonix_decision fields
 * (cms_architecture_decision, backend_database_needed) so readiness recomputes correctly on the
 * very next read (MD <readiness_integration>) — no bypass of Gate 3.1's server readiness guard,
 * only real data the guard already knows how to read.
 */
export async function persistApprovedArchitectureDecision(
  businessId: string,
  discoveryId: string,
  projectIntentId: string,
  packet: WebsiteArchitectureDecisionPacket,
  actor: ProjectDiscoveryActor,
): Promise<PersistArchitectureDecisionResult> {
  const notes = packet.isOverride ? `Reviewer override: ${packet.overrideReasonEs ?? ""} / ${packet.overrideReasonEn ?? ""}` : null;

  const writes: Promise<CaptureItemResult>[] = [
    captureProjectDiscoveryItem(
      {
        discoveryId, businessId, projectIntentId, section: "scope", fieldKey: "website_architecture_decision",
        value: packet as unknown as Record<string, unknown>,
        displayValue: `${packet.architectureClass.replace(/_/g, " ")} — ${platformLabel(packet.frontend.platformKey ?? packet.preserveExistingPlatformKey)} / ${platformLabel(packet.hosting.platformKey)}`,
        valueType: "other", truthClass: "technical_decision", completenessClass: "needs_leonix_decision", notes,
      },
      actor,
    ),
    captureProjectDiscoveryItem(
      {
        discoveryId, businessId, projectIntentId, section: "cms", fieldKey: "cms_architecture_decision",
        value: packet.cms.platformKey ?? packet.cms.decision.toLowerCase(),
        displayValue: `${packet.cms.decision}${packet.cms.platformKey ? `: ${platformLabel(packet.cms.platformKey)}` : ""}`,
        valueType: "text", truthClass: "technical_decision", completenessClass: "needs_leonix_decision", notes,
      },
      actor,
    ),
    // NEEDS_REVIEW resolves to "not required for now" by default — the reviewer who wanted a
    // different outcome uses Modify Decision, which re-runs this same approval with an override.
    captureProjectDiscoveryItem(
      {
        discoveryId, businessId, projectIntentId, section: "backend_database_auth", fieldKey: "backend_database_needed",
        value: packet.database.decision === "REQUIRED",
        displayValue: packet.database.decision === "REQUIRED" ? "Sí / Yes" : "No / No",
        valueType: "boolean", truthClass: "technical_decision", completenessClass: "needs_leonix_decision", notes,
      },
      actor,
    ),
    captureProjectDiscoveryItem(
      {
        discoveryId, businessId, projectIntentId, section: "scope", fieldKey: "in_scope_summary",
        value: summarizeInScope(packet), displayValue: summarizeInScope(packet),
        valueType: "text", truthClass: "technical_decision", completenessClass: "required_before_build",
      },
      actor,
    ),
    captureProjectDiscoveryItem(
      {
        discoveryId, businessId, projectIntentId, section: "scope", fieldKey: "out_of_scope_summary",
        value: summarizeOutOfScope(packet), displayValue: summarizeOutOfScope(packet),
        valueType: "text", truthClass: "technical_decision", completenessClass: "required_before_build",
      },
      actor,
    ),
  ];

  if (packet.requiresCommercialReview) {
    writes.push(
      captureProjectDiscoveryItem(
        {
          discoveryId, businessId, projectIntentId, section: "scope", fieldKey: "custom_platform_commercial_review",
          value: "pending_review",
          displayValue: "Pendiente de revisión comercial / Pending commercial review",
          valueType: "text", truthClass: "technical_decision", completenessClass: "needs_leonix_decision",
          notes: "No canonical commercial-approval domain exists yet in this codebase — this is a truthfully-reported placeholder blocker (MD <custom_platform_guard>).",
        },
        actor,
      ),
    );
  }

  const results = await Promise.all(writes);
  const failed = results.find((r) => !r.ok);
  if (failed) return { ok: false, reason: "insert_failed" };
  return { ok: true };
}
