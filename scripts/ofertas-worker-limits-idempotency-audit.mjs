import { must, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const activation = read("app/api/ofertas-locales/admin/renewals/activate-due/route.ts");
const cleanup = read("app/api/ofertas-locales/admin/cleanup-queue/execute/route.ts");
const migration = read("supabase/migrations/20260801023000_ofertas_locales_renewal_operations_lifecycle.sql");

must(activation, "MAX_ACTIVATION_BATCH = 20", "activation batch max");
must(cleanup, "MAX_CLEANUP_BATCH = 25", "cleanup batch max");
must(activation, "invalid_batch_size", "activation rejects invalid batch");
must(cleanup, "invalid_batch_size", "cleanup rejects invalid batch");
must(migration, "ofertas_public_terms_renewal_once_idx", "term idempotency");
must(migration, "ofertas_renewal_one_open_attempt_idx", "open renewal idempotency");

pass("ofertas-worker-limits-idempotency-audit");
