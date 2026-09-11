/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — deterministic project release readiness
 * (MD <release_readiness>). Pure function only — never infers a paid/contracted state when
 * unavailable, never a full build/typecheck/live-round-trip, just a decision over already-computed
 * inputs the caller assembles from real canonical sources.
 */
import type { BlueprintStatus } from "./blueprintEngine";
import type { ChecklistSummary } from "./blueprintChecklistEngine";
import type { BlockingDependencySummary } from "./specializedBlueprintEngine";

export type ReleaseReadinessState =
  | "READY_FOR_RELEASE"
  | "NOT_READY"
  | "NEEDS_CLIENT_ACTION"
  | "NEEDS_LEONIX_ACTION"
  | "BLOCKED_BY_DEPENDENCY"
  | "NEEDS_COMMERCIAL_RESOLUTION";

export interface ReleaseReadinessReason {
  es: string;
  en: string;
}

export interface ReleaseReadinessResult {
  state: ReleaseReadinessState;
  reasonEs: string;
  reasonEn: string;
  blockingReasons: readonly ReleaseReadinessReason[];
}

export interface ReleaseReadinessInput {
  blueprintStatus: BlueprintStatus;
  isStale: boolean;
  staleExplicitlyAcknowledged: boolean;
  requiresClientConfirmation: boolean;
  clientConfirmationComplete: boolean;
  blockingDependencies: readonly BlockingDependencySummary[];
  executionExists: boolean;
  qaSummary: ChecklistSummary;
  launchSummary: ChecklistSummary;
  requiresCommercialReview: boolean;
  commercialReviewResolved: boolean;
}

function result(state: ReleaseReadinessState, es: string, en: string, blockingReasons: ReleaseReadinessReason[] = []): ReleaseReadinessResult {
  return { state, reasonEs: es, reasonEn: en, blockingReasons };
}

export function evaluateProjectReleaseReadiness(input: ReleaseReadinessInput): ReleaseReadinessResult {
  if (input.blueprintStatus !== "approved_for_build") {
    return result("NOT_READY", "El plan del proyecto todavía no está aprobado para construcción.", "The project blueprint is not yet approved for build.");
  }

  if (input.requiresCommercialReview && !input.commercialReviewResolved) {
    return result("NEEDS_COMMERCIAL_RESOLUTION", "Se requiere resolver la revisión comercial de Plataforma Personalizada antes de lanzar.", "The Custom Platform commercial review must be resolved before release.");
  }

  if (input.requiresClientConfirmation && !input.clientConfirmationComplete) {
    return result("NEEDS_CLIENT_ACTION", "Se requiere la confirmación del cliente antes de lanzar.", "Client confirmation is required before release.");
  }

  if (input.blockingDependencies.length > 0) {
    return result(
      "BLOCKED_BY_DEPENDENCY",
      "Este proyecto está esperando a que otro proyecto termine primero.",
      "This project is waiting on another project to finish first.",
      input.blockingDependencies.map((d) => ({ es: `${d.dependsOnTitle}: ${d.reasonEs}`, en: `${d.dependsOnTitle}: ${d.reasonEn}` })),
    );
  }

  if (!input.executionExists) {
    return result("NEEDS_LEONIX_ACTION", "Aún no se ha creado el trabajo de ejecución para este proyecto.", "Execution work has not been created for this project yet.");
  }

  if (!input.qaSummary.readyForRelease) {
    return result(
      "NEEDS_LEONIX_ACTION",
      `Hay ${input.qaSummary.blockingItems.length} elemento(s) de control de calidad requerido(s) sin aprobar.`,
      `${input.qaSummary.blockingItems.length} required QA item(s) are not yet passing.`,
      input.qaSummary.blockingItems.map((i) => ({ es: i.itemKey, en: i.itemKey })),
    );
  }

  if (!input.launchSummary.readyForRelease) {
    return result(
      "NEEDS_LEONIX_ACTION",
      `Hay ${input.launchSummary.blockingItems.length} elemento(s) de la lista de lanzamiento sin completar.`,
      `${input.launchSummary.blockingItems.length} launch checklist item(s) are not yet complete.`,
      input.launchSummary.blockingItems.map((i) => ({ es: i.itemKey, en: i.itemKey })),
    );
  }

  if (input.isStale && !input.staleExplicitlyAcknowledged) {
    return result("NOT_READY", "El plan del proyecto puede estar desactualizado y no ha sido revisado.", "The project blueprint may be stale and has not been reviewed.");
  }

  return result("READY_FOR_RELEASE", "Todo lo requerido está resuelto — listo para lanzamiento.", "Everything required is resolved — ready for release.");
}
