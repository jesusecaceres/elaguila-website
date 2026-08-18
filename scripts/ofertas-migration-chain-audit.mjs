import { existsSync } from "node:fs";
import { join } from "node:path";
import { must, mustNot, pass, read, ROOT } from "./ofertas-package-9-audit-utils.mjs";

const manifest = read("app/lib/ofertas-locales/ofertasLocalesMigrationManifest.ts");
const doc = read("docs/OFERTAS_PACKAGE_9_INTEGRATION_READINESS.md");
const files = [
  "20260616130000_ofertas_locales_ai_production_bootstrap.sql",
  "20260731222500_ofertas_locales_30_day_public_term.sql",
  "20260731235500_ofertas_locales_commercial_activation_identity.sql",
  "20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql",
  "20260801013000_ofertas_locales_ai_scan_review_publication.sql",
  "20260801023000_ofertas_locales_renewal_operations_lifecycle.sql",
];
for (const file of files) {
  if (!existsSync(join(ROOT, "supabase/migrations", file))) throw new Error(`Missing migration ${file}`);
  must(manifest, file, `manifest includes ${file}`);
}
must(manifest, "requiredPredecessors", "dependency graph");
must(manifest, "UNKNOWN/UNAPPLIED BY THIS SESSION", "truthful applied status");
must(doc, "No Package 9 migration required", "no Package 9 migration decision");
const combined = files.map((file) => read(`supabase/migrations/${file}`)).join("\n");
mustNot(combined, /\bdrop\s+table\b/i, "drop table");
mustNot(combined, /\btruncate\b/i, "truncate");
mustNot(combined, /\bdelete\s+from\b/i, "broad delete");

pass("ofertas-migration-chain-audit");
