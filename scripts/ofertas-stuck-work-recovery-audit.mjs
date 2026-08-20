import { assertContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const recovery = read("app/lib/ofertas-locales/ofertasLocalesOperationalRecovery.ts");

assertContains(recovery, "scan_processing_stale", "stale scan detection");
assertContains(recovery, "webhook_pending", "webhook/payment pending detection");
assertContains(recovery, "renewal_authorized_not_prepared", "authorized renewal recovery");
assertContains(recovery, "scheduled_activation_overdue", "scheduled activation recovery");
assertContains(recovery, "retryEligible", "explicit retry truth");
assertContains(recovery, "Do not retry blindly", "owner duplicate-charge guidance");

pass("ofertas-stuck-work-recovery-audit");
