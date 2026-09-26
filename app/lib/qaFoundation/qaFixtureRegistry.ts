/**
 * Canonical QA fixture registry.
 *
 * As of 2026-09-25 Leonix uses ONE Supabase project:
 *   Leonix Media (xuieateniufcrsfdomwl)
 *
 * The former Leonix Media Staging and Leonix Certification projects were retired and deleted
 * after their useful QA/certification evidence was preserved in the repository. No executable
 * code may treat those retired projects as targets or fallbacks.
 *
 * This registry intentionally stores no production customer identifiers. Any production QA that
 * could mutate real data requires an explicit, scoped owner-approved runbook and cleanup plan.
 */
export type QaFixtureCategory =
  | "servicios"
  | "restaurantes"
  | "comida-local"
  | "ofertas-locales"
  | "autos-dealer"
  | "autos-privado"
  | "bienes-raices"
  | "rentas";

export type QaFixtureEnvironment = "production";

export type QaFixtureStatus = "ready" | "pending" | "schema_missing" | "unknown";

export type QaFixtureEntry = {
  category: QaFixtureCategory;
  environment: QaFixtureEnvironment;
  supabaseProjectRef: string;
  qaAccountEmail: string | null;
  qaAccountRole: "seller_owner" | "buyer_visitor" | "admin" | null;
  applicationOrListingId: string | null;
  status: QaFixtureStatus;
  notes: string;
  lastVerifiedAt: string;
};

const CANONICAL_PROJECT_REF = "xuieateniufcrsfdomwl";

const productionUnknown = (category: QaFixtureCategory): QaFixtureEntry => ({
  category,
  environment: "production",
  supabaseProjectRef: CANONICAL_PROJECT_REF,
  qaAccountEmail: null,
  qaAccountRole: null,
  applicationOrListingId: null,
  status: "unknown",
  notes:
    "Single-project model: Leonix Media is the only Supabase target. This registry deliberately " +
    "does not invent or persist production QA identities. Use an explicit owner-approved QA " +
    "runbook before any test that could write production data.",
  lastVerifiedAt: "2026-09-25",
});

export const QA_FIXTURE_REGISTRY: readonly QaFixtureEntry[] = [
  productionUnknown("servicios"),
  productionUnknown("restaurantes"),
  productionUnknown("comida-local"),
  productionUnknown("ofertas-locales"),
  productionUnknown("autos-dealer"),
  productionUnknown("autos-privado"),
  productionUnknown("bienes-raices"),
  productionUnknown("rentas"),
] as const;

export function getQaFixture(
  category: QaFixtureCategory,
  environment: QaFixtureEnvironment,
): QaFixtureEntry | null {
  return (
    QA_FIXTURE_REGISTRY.find((e) => e.category === category && e.environment === environment) ??
    null
  );
}
