/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — blueprint review lifecycle guidance (MD
 * <review_lifecycle>) and material-change classification (MD <change_request_flow>). Pure
 * functions only. Reuses Gate 5's EXACT 5-state BlueprintStatus — never a second lifecycle.
 */
import type { BlueprintStatus } from "./blueprintEngine";
import type { DiscoveryCompletenessClass } from "./types";

export type ReviewActor = "STAFF" | "CLIENT" | "NONE";

export interface BlueprintReviewStateInfo {
  status: BlueprintStatus;
  whatThisMeansEs: string;
  whatThisMeansEn: string;
  whoNeedsToAct: ReviewActor;
  nextActionEs: string;
  nextActionEn: string;
}

/**
 * Turns a raw BlueprintStatus into staff-operational guidance. `unresolvedClientCount` lets the
 * CLIENT_CONFIRMATION_NEEDED case name what is actually still outstanding, rather than a generic
 * "waiting on client" message (MD <review_lifecycle> example: "Waiting on: client approval of logo
 * direction; client confirmation of final phone number").
 */
export function describeBlueprintReviewState(status: BlueprintStatus, unresolvedClientCount: number): BlueprintReviewStateInfo {
  switch (status) {
    case "draft":
      return {
        status,
        whatThisMeansEs: "Este plan del proyecto es un borrador — todavía no ha sido revisado internamente.",
        whatThisMeansEn: "This project blueprint is a draft — it has not been internally reviewed yet.",
        whoNeedsToAct: "STAFF",
        nextActionEs: "Complete la revisión interna.",
        nextActionEn: "Complete internal review.",
      };
    case "internal_review":
      return {
        status,
        whatThisMeansEs: "La revisión interna de Leonix está en curso.",
        whatThisMeansEn: "Leonix's internal review is underway.",
        whoNeedsToAct: "STAFF",
        nextActionEs: "Revise con el cliente, o apruebe directamente si no se requiere confirmación separada.",
        nextActionEn: "Review with the client, or approve directly if separate confirmation isn't required.",
      };
    case "client_confirmation_needed":
      return {
        status,
        whatThisMeansEs: unresolvedClientCount > 0
          ? `Esperando ${unresolvedClientCount} confirmación(es) del cliente.`
          : "Esperando la confirmación del cliente.",
        whatThisMeansEn: unresolvedClientCount > 0
          ? `Waiting on ${unresolvedClientCount} client confirmation(s).`
          : "Waiting on client confirmation.",
        whoNeedsToAct: "CLIENT",
        nextActionEs: "Programe una revisión con el cliente o registre su retroalimentación.",
        nextActionEn: "Schedule a client review or record their feedback.",
      };
    case "approved_for_build":
      return {
        status,
        whatThisMeansEs: "Este plan del proyecto está aprobado para construcción — es el contrato de construcción vigente.",
        whatThisMeansEn: "This project blueprint is approved for build — it is the current build contract.",
        whoNeedsToAct: "STAFF",
        nextActionEs: "Ejecute el trabajo, luego realice el control de calidad contra este plan.",
        nextActionEn: "Execute the work, then run QA against this blueprint.",
      };
    case "superseded":
      return {
        status,
        whatThisMeansEs: "Esta versión fue reemplazada por una versión más reciente.",
        whatThisMeansEn: "This version was superseded by a newer one.",
        whoNeedsToAct: "NONE",
        nextActionEs: "Consulte la versión actual del plan del proyecto.",
        nextActionEn: "Refer to the current project blueprint version.",
      };
  }
}

// ---------------------------------------------------------------------------------------------
// Material-change classification (MD <change_request_flow>) — a small explicit allowlist (the
// mission's own named examples) UNION any field whose catalog completeness class is itself
// build-blocking or a Leonix architecture decision. A field is NEVER classified material merely
// because it changed; classification is always driven by the catalog's own declared meaning.
// ---------------------------------------------------------------------------------------------
const MATERIAL_FIELD_KEYS: ReadonlySet<string> = new Set([
  "primary_cta_type", "colors_liked", "colors_disliked", "logo_project_kind", "required_pages_sections",
  "campaign_desired_channels", "print_dimensions_known", "has_existing_domain", "domain_owner",
  "wants_online_booking", "wants_native_checkout", "backend_database_needed", "website_architecture_decision",
]);

const MATERIAL_COMPLETENESS_CLASSES: ReadonlySet<DiscoveryCompletenessClass> = new Set(["required_before_build", "needs_leonix_decision"]);

export function isMaterialChangeFieldKey(fieldKey: string, completenessClass?: DiscoveryCompletenessClass): boolean {
  if (MATERIAL_FIELD_KEYS.has(fieldKey)) return true;
  return completenessClass ? MATERIAL_COMPLETENESS_CLASSES.has(completenessClass) : false;
}
