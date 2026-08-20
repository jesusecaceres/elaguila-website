import { must, mustNot, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const route = read("app/api/ofertas-locales/admin/readiness/route.ts");

must(route, "authenticateOfertaLocalAdminOrWorker", "admin-or-worker auth");
must(route, "databaseConnectionPerformed: false", "no DB check");
must(route, "externalServiceCalled: false", "no external call");
must(route, "secretValuesReturned: false", "no secret values");
mustNot(route, "SUPABASE_SERVICE_ROLE_KEY", "no secret variable returned");
mustNot(route, "STRIPE_SECRET_KEY", "no Stripe secret returned");

pass("ofertas-readiness-endpoint-security-audit");
