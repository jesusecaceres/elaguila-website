import { must, mustNot, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const contract = read("app/lib/ofertas-locales/ofertasLocalesEnvironmentContract.ts");
const validator = read("app/lib/ofertas-locales/ofertasLocalesEnvironmentValidator.ts");

for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "GEMINI_API_KEY", "BLOB_READ_WRITE_TOKEN", "OFERTAS_INTERNAL_WORKER_SECRET"]) {
  must(contract, name, `env var ${name}`);
}
must(contract, "clientSafe", "client-safe classification");
must(contract, "secret", "secret classification");
must(validator, "exposesValues: false", "no values returned");
mustNot(validator, /console\.log\(.*process\.env/s, "env value logging");

pass("ofertas-environment-contract-audit");
