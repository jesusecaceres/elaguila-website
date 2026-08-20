export type OfertaLocalMigrationPackage =
  | "4A"
  | "4B"
  | "5"
  | "6"
  | "7"
  | "8";

export type OfertaLocalMigrationManifestEntry = {
  order: number;
  packageId: OfertaLocalMigrationPackage;
  filename: string;
  requiredPredecessors: string[];
  creates: string[];
  alters: string[];
  functions: string[];
  policies: string[];
  runtimeRequires: string[];
  irreversibleOperations: string[];
  risk: "low" | "medium" | "high";
  appliedStatus: "UNKNOWN/UNAPPLIED BY THIS SESSION";
};

export const OFERTAS_LOCALES_MIGRATION_MANIFEST: readonly OfertaLocalMigrationManifestEntry[] = [
  {
    order: 1,
    packageId: "4A",
    filename: "20260616130000_ofertas_locales_ai_production_bootstrap.sql",
    requiredPredecessors: [],
    creates: ["oferta_local_scan_jobs", "oferta_local_items"],
    alters: ["ofertas_locales provider compatibility"],
    functions: [],
    policies: [],
    runtimeRequires: ["Gemini-compatible scan provider values", "AI scan job persistence"],
    irreversibleOperations: [],
    risk: "medium",
    appliedStatus: "UNKNOWN/UNAPPLIED BY THIS SESSION",
  },
  {
    order: 2,
    packageId: "4B",
    filename: "20260731222500_ofertas_locales_30_day_public_term.sql",
    requiredPredecessors: ["20260616130000_ofertas_locales_ai_production_bootstrap.sql"],
    creates: [],
    alters: ["ofertas_locales.published_at", "ofertas_locales.expires_at"],
    functions: [],
    policies: [],
    runtimeRequires: ["public term filtering", "owner/admin term display"],
    irreversibleOperations: [],
    risk: "low",
    appliedStatus: "UNKNOWN/UNAPPLIED BY THIS SESSION",
  },
  {
    order: 3,
    packageId: "5",
    filename: "20260731235500_ofertas_locales_commercial_activation_identity.sql",
    requiredPredecessors: ["20260731222500_ofertas_locales_30_day_public_term.sql"],
    creates: [],
    alters: [
      "ofertas_locales.leonix_ad_id",
      "ofertas_locales.commercial_product_key",
      "ofertas_locales.payment_status",
      "ofertas_locales.package_entitlement_id",
    ],
    functions: [],
    policies: [],
    runtimeRequires: ["Revenue OS checkout", "webhook fulfillment", "submission entitlement gate"],
    irreversibleOperations: [],
    risk: "medium",
    appliedStatus: "UNKNOWN/UNAPPLIED BY THIS SESSION",
  },
  {
    order: 4,
    packageId: "6",
    filename: "20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql",
    requiredPredecessors: ["20260731235500_ofertas_locales_commercial_activation_identity.sql"],
    creates: [
      "ofertas_local_partner_organizations",
      "ofertas_local_partner_assignments",
      "ofertas_local_source_assets",
      "ofertas_local_asset_cleanup_queue",
    ],
    alters: ["ofertas_locales partner/source/asset lifecycle fields", "oferta_local_items source version fields"],
    functions: [],
    policies: ["owner/admin source and partner policies"],
    runtimeRequires: ["partner courtesy", "source versioning", "replacement", "cleanup queue"],
    irreversibleOperations: [],
    risk: "medium",
    appliedStatus: "UNKNOWN/UNAPPLIED BY THIS SESSION",
  },
  {
    order: 5,
    packageId: "7",
    filename: "20260801013000_ofertas_locales_ai_scan_review_publication.sql",
    requiredPredecessors: ["20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql"],
    creates: ["oferta_local_scan_pages"],
    alters: [
      "oferta_local_scan_jobs page progress fields",
      "oferta_local_items price/bbox/crop/source lifecycle fields",
    ],
    functions: ["activate_oferta_local_reviewed_source"],
    policies: ["scan/review source-version policies"],
    runtimeRequires: ["page progress", "decimal prices", "bbox/crop", "review/public parity"],
    irreversibleOperations: [],
    risk: "medium",
    appliedStatus: "UNKNOWN/UNAPPLIED BY THIS SESSION",
  },
  {
    order: 6,
    packageId: "8",
    filename: "20260801023000_ofertas_locales_renewal_operations_lifecycle.sql",
    requiredPredecessors: ["20260801013000_ofertas_locales_ai_scan_review_publication.sql"],
    creates: ["ofertas_local_renewal_attempts", "ofertas_local_public_terms", "ofertas_local_notification_events"],
    alters: ["ofertas_local_asset_cleanup_queue lease/retry fields"],
    functions: ["activate_due_oferta_local_renewal"],
    policies: ["renewal owner read", "term owner read", "notification owner read"],
    runtimeRequires: ["renewal", "term history", "scheduled activation", "cleanup lease", "notification outbox"],
    irreversibleOperations: [],
    risk: "medium",
    appliedStatus: "UNKNOWN/UNAPPLIED BY THIS SESSION",
  },
];

export function getOfertasMigrationFilenames(): string[] {
  return OFERTAS_LOCALES_MIGRATION_MANIFEST.map((entry) => entry.filename);
}
