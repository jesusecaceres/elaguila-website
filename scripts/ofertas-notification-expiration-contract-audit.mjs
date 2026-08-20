import { assertContains, assertNotContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const events = read("app/lib/ofertas-locales/ofertasLocalesNotificationEvents.ts");
const migration = read("supabase/migrations/20260801023000_ofertas_locales_renewal_operations_lifecycle.sql");
const formatting = read("app/lib/ofertas-locales/ofertasLocalesFormatting.ts");

assertContains(events, "payment_authorized", "payment event");
assertContains(events, "renewal_scheduled", "scheduled renewal event");
assertContains(events, "renewal_activated", "activated renewal event");
assertContains(events, "expiring_soon", "expiration reminder event");
assertContains(events, "expired", "expired event");
assertContains(events, "idempotency_key", "notification idempotency");
assertContains(events, "deliveryAdapterImplemented: false", "no fake delivery adapter");
assertContains(migration, "ofertas_local_notification_events", "notification outbox table");
assertContains(formatting, "isOfertaLocalPublicTermActive", "public expiration truth");
assertNotContains(events, "sent_at: new Date", "no fake sent state");

pass("ofertas-notification-expiration-contract-audit");
