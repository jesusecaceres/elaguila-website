import { must, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const activation = read("app/api/ofertas-locales/admin/renewals/activate-due/route.ts");
const cleanup = read("app/api/ofertas-locales/admin/cleanup-queue/execute/route.ts");

must(activation, "dryRun", "activation dry-run");
must(activation, "mutated: false", "activation dry-run no mutation");
must(cleanup, "dryRun", "cleanup dry-run");
must(cleanup, "externalCalls: false", "cleanup dry-run no external call");
must(cleanup, "mutated: false", "cleanup dry-run no mutation");

pass("ofertas-worker-dry-run-audit");
