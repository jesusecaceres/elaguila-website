import { existsSync } from "node:fs";
import { join } from "node:path";
import { must, pass, read, ROOT } from "./ofertas-package-9-audit-utils.mjs";

const helper = read("scripts/ofertas-staging-harness-utils.mjs");
const scripts = [
  "ofertas-staging-preflight.mjs",
  "ofertas-staging-schema-verification.mjs",
  "ofertas-staging-flyer-smoke.mjs",
  "ofertas-staging-coupon-smoke.mjs",
  "ofertas-staging-renewal-smoke.mjs",
  "ofertas-staging-worker-smoke.mjs",
];
for (const script of scripts) {
  if (!existsSync(join(ROOT, "scripts", script))) throw new Error(`Missing staging harness ${script}`);
}
must(helper, "BLOCKED — STAGING EXECUTION NOT AUTHORIZED", "blocked by default");
must(helper, "OFERTAS_STAGING_EXECUTE", "explicit execution flag");
must(helper, "OFERTAS_STAGING_EXECUTION_ENV", "staging env guard");
must(helper, "No network call. No DB call. No Stripe call. No Gemini call. No storage call. No browser action.", "no default external work");
must(helper, /production|prod|leonixmedia\.com/, "production rejection");

pass("ofertas-staging-harness-safety-audit");
