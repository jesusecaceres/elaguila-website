import { assertContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const migration = read("supabase/migrations/20260801023000_ofertas_locales_renewal_operations_lifecycle.sql");
const adminRoute = read("app/api/ofertas-locales/admin/[id]/renewals/route.ts");
const dueRoute = read("app/api/ofertas-locales/admin/renewals/activate-due/route.ts");
const renewals = read("app/lib/ofertas-locales/ofertasLocalesRenewals.ts");

assertContains(renewals, "Math.max(input.approvalTime.getTime(), currentMs)", "no-day-loss formula");
assertContains(migration, "activate_due_oferta_local_renewal", "activation RPC");
assertContains(migration, "greatest(now(), coalesce(v_parent.expires_at, now()))", "database no-day-loss scheduling");
assertContains(migration, "+ interval '30 days'", "30-day renewed term");
assertContains(adminRoute, "renewal_entitlement_required", "paid entitlement required before activation");
assertContains(adminRoute, "renewal_courtesy_required", "courtesy provenance required before activation");
assertContains(dueRoute, ".eq(\"state\", \"approved_scheduled\")", "due scheduled renewals only");
assertContains(dueRoute, ".lte(\"scheduled_activation_at\"", "server due-time selection");

pass("ofertas-renewal-activation-audit");
