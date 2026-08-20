import { must, mustNot, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const events = read("app/lib/ofertas-locales/ofertasLocalesNotificationEvents.ts");
const migration = read("supabase/migrations/20260801023000_ofertas_locales_renewal_operations_lifecycle.sql");
const contract = read("app/lib/ofertas-locales/ofertasLocalesEnvironmentContract.ts");

must(migration, "ofertas_local_notification_events", "notification outbox migration");
must(events, "idempotency_key", "event idempotency");
must(events, "deliveryAdapterImplemented: false", "no fake adapter");
must(contract, "OFERTAS_NOTIFICATION_DELIVERY_ENABLED", "notification delivery flag");
mustNot(events, "sent_at: new Date", "no fake sent state");

pass("ofertas-notification-readiness-audit");
