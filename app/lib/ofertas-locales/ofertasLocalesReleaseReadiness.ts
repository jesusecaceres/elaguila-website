import { OFERTAS_LOCALES_MIGRATION_MANIFEST } from "./ofertasLocalesMigrationManifest";
import type { OfertaLocalEnvironmentReadiness } from "./ofertasLocalesEnvironmentValidator";

export type OfertaLocalReleaseState =
  | "repository_ready"
  | "blocked_configuration"
  | "ready_for_migration_application"
  | "ready_for_staging_validation"
  | "staging_validation_failed"
  | "staging_certified"
  | "production_activation_pending"
  | "production_ready";

export type OfertaLocalReleaseReadiness = {
  state: OfertaLocalReleaseState;
  blockers: string[];
  repository: "ready";
  schema: "static_valid_database_unchecked";
  environment: "ready" | "missing" | "malformed";
  externalValidation: "not_run";
  stagingCertified: false;
  productionReady: false;
};

export function evaluateOfertaLocalReleaseReadiness(input: {
  environment: OfertaLocalEnvironmentReadiness;
}): OfertaLocalReleaseReadiness {
  const blockers: string[] = [];
  for (const [subsystem, status] of Object.entries(input.environment.summary)) {
    if (status === "missing" || status === "malformed") blockers.push(`${subsystem}:${status}`);
  }
  const migrationChainReady = OFERTAS_LOCALES_MIGRATION_MANIFEST.length === 6;
  if (!migrationChainReady) blockers.push("migration_manifest_incomplete");

  const envStatus = blockers.some((b) => b.endsWith(":malformed"))
    ? "malformed"
    : blockers.length
      ? "missing"
      : "ready";

  return {
    state: envStatus === "ready" ? "ready_for_migration_application" : "repository_ready",
    blockers,
    repository: "ready",
    schema: "static_valid_database_unchecked",
    environment: envStatus,
    externalValidation: "not_run",
    stagingCertified: false,
    productionReady: false,
  };
}
