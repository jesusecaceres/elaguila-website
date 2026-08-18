import { must, mustNot, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const contract = read("app/lib/ofertas-locales/ofertasLocalesEnvironmentContract.ts");
const commercial = read("app/lib/ofertas-locales/ofertasLocalesCommercial.ts");
const docs = read("docs/OFERTAS_PACKAGE_9_INTEGRATION_READINESS.md");

must(contract, "STRIPE_SECRET_KEY", "Stripe secret contract");
must(contract, "STRIPE_WEBHOOK_SECRET", "Stripe webhook contract");
must(commercial, "OFERTAS_LOCALES_FLYER_PRICE_CENTS", "flyer price");
must(commercial, "OFERTAS_LOCALES_COUPONS_PRICE_CENTS", "coupon price");
must(docs, "EXTERNAL VALIDATION NOT RUN", "truthful Stripe external validation");
mustNot(docs, "Stripe operational", "no fake Stripe operational claim");

pass("ofertas-stripe-readiness-audit");
