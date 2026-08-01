import { must, mustNot, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const auth = read("app/lib/ofertas-locales/ofertasLocalesInternalWorkerAuth.ts");
const adminWorker = read("app/lib/ofertas-locales/ofertasLocalesAdminWorkerAuth.ts");
const activation = read("app/api/ofertas-locales/admin/renewals/activate-due/route.ts");
const cleanup = read("app/api/ofertas-locales/admin/cleanup-queue/execute/route.ts");

must(auth, "timingSafeEqual", "constant-time comparison");
must(auth, "authorization", "authorization header");
must(auth, "OFERTAS_INTERNAL_WORKER_SECRET", "worker secret name");
must(adminWorker, "requireAdminCookie", "admin cookie auth");
must(adminWorker, "authenticateOfertaLocalInternalWorker", "worker auth composition");
must(activation, "authenticateOfertaLocalAdminOrWorker", "activation worker auth");
must(cleanup, "authenticateOfertaLocalAdminOrWorker", "cleanup worker auth");
mustNot(auth, "nextUrl.searchParams", "no query-string secret");

pass("ofertas-worker-auth-security-audit");
