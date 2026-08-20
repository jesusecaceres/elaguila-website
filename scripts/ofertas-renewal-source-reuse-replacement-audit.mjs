import { assertContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const ownerRoute = read("app/api/ofertas-locales/owner/[id]/renewal/route.ts");
const renewals = read("app/lib/ofertas-locales/ofertasLocalesRenewals.ts");
const migration = read("supabase/migrations/20260801023000_ofertas_locales_renewal_operations_lifecycle.sql");

assertContains(ownerRoute, "sourceAssetVersionId", "source selection in owner renewal route");
assertContains(ownerRoute, "parent.public_source_asset_id || parent.active_source_asset_id", "reuse current approved content");
assertContains(ownerRoute, "blocking_scan_pages", "scan gate before renewal submission");
assertContains(ownerRoute, "unresolved_review_items", "review gate before renewal submission");
assertContains(renewals, "blocked_source", "replacement-pending source blocks eligibility");
assertContains(migration, "source_asset_version_id uuid references public.ofertas_local_source_assets", "renewal source identity");
assertContains(migration, "source_asset_version_id = v_attempt.source_asset_version_id", "exact source activation");

pass("ofertas-renewal-source-reuse-replacement-audit");
