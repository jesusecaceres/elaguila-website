import { assertContains, assertNotContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const helper = read("app/lib/ofertas-locales/ofertasLocalesCleanupExecution.ts");
const route = read("app/api/ofertas-locales/admin/cleanup-queue/execute/route.ts");
const migration = read("supabase/migrations/20260801023000_ofertas_locales_renewal_operations_lifecycle.sql");

assertContains(helper, "validateOfertaLocalCleanupStoragePath", "safe path validation");
assertContains(helper, "processing_lease_id", "processing lease");
assertContains(helper, "lease_expires_at", "lease expiration");
assertContains(helper, "attempt_count", "attempt count increment");
assertContains(helper, "physicalDeletionPerformed: false", "no fake deletion completion");
assertContains(route, "authenticateOfertaLocalAdminOrWorker", "server/admin-or-worker authorization");
assertContains(route, "completed: false", "no completed claim without adapter");
assertContains(migration, "retry_after_at", "retry/backoff metadata");
assertNotContains(helper, ".storage.from", "no storage deletion call");
assertNotContains(route, ".storage.from", "no storage deletion route call");

pass("ofertas-cleanup-execution-audit");
