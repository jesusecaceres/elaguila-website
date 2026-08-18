export type OfertaLocalEnvironmentSubsystem =
  | "database"
  | "stripe"
  | "gemini"
  | "storage"
  | "workers"
  | "notifications"
  | "public_site";

export type OfertaLocalEnvironmentVariableContract = {
  name: string;
  subsystem: OfertaLocalEnvironmentSubsystem;
  requiredInDevelopment: boolean;
  requiredInStaging: boolean;
  requiredInProduction: boolean;
  clientSafe: boolean;
  secret: boolean;
  validator: "presence" | "url" | "stripe_secret_prefix" | "stripe_publishable_prefix" | "positive_integer" | "enum" | "optional";
  missingBehavior: string;
};

export const OFERTAS_ENVIRONMENT_CONTRACT: readonly OfertaLocalEnvironmentVariableContract[] = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", subsystem: "database", requiredInDevelopment: true, requiredInStaging: true, requiredInProduction: true, clientSafe: true, secret: false, validator: "url", missingBehavior: "Supabase browser/server clients fail closed." },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", subsystem: "database", requiredInDevelopment: true, requiredInStaging: true, requiredInProduction: true, clientSafe: true, secret: false, validator: "presence", missingBehavior: "Owner auth/browser reads unavailable." },
  { name: "SUPABASE_SERVICE_ROLE_KEY", subsystem: "database", requiredInDevelopment: false, requiredInStaging: true, requiredInProduction: true, clientSafe: false, secret: true, validator: "presence", missingBehavior: "Server mutations/readiness return admin unconfigured." },
  { name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", subsystem: "stripe", requiredInDevelopment: false, requiredInStaging: true, requiredInProduction: true, clientSafe: true, secret: false, validator: "stripe_publishable_prefix", missingBehavior: "Checkout UI cannot initialize client payment components." },
  { name: "STRIPE_SECRET_KEY", subsystem: "stripe", requiredInDevelopment: false, requiredInStaging: true, requiredInProduction: true, clientSafe: false, secret: true, validator: "stripe_secret_prefix", missingBehavior: "Revenue OS checkout refuses to create sessions." },
  { name: "STRIPE_WEBHOOK_SECRET", subsystem: "stripe", requiredInDevelopment: false, requiredInStaging: true, requiredInProduction: true, clientSafe: false, secret: true, validator: "presence", missingBehavior: "Webhook verification fails closed." },
  { name: "GEMINI_API_KEY", subsystem: "gemini", requiredInDevelopment: false, requiredInStaging: true, requiredInProduction: true, clientSafe: false, secret: true, validator: "presence", missingBehavior: "Gemini provider remains unavailable; scan fails safely." },
  { name: "OFERTAS_GEMINI_MODEL", subsystem: "gemini", requiredInDevelopment: false, requiredInStaging: false, requiredInProduction: false, clientSafe: false, secret: false, validator: "optional", missingBehavior: "Runtime uses safe default only where implemented." },
  { name: "BLOB_READ_WRITE_TOKEN", subsystem: "storage", requiredInDevelopment: false, requiredInStaging: true, requiredInProduction: true, clientSafe: false, secret: true, validator: "presence", missingBehavior: "Upload/delete adapters fail closed." },
  { name: "OFERTAS_INTERNAL_WORKER_SECRET", subsystem: "workers", requiredInDevelopment: false, requiredInStaging: true, requiredInProduction: true, clientSafe: false, secret: true, validator: "presence", missingBehavior: "Internal worker routes reject worker auth." },
  { name: "OFERTAS_ACTIVATION_BATCH_SIZE", subsystem: "workers", requiredInDevelopment: false, requiredInStaging: false, requiredInProduction: false, clientSafe: false, secret: false, validator: "positive_integer", missingBehavior: "Conservative default is used." },
  { name: "OFERTAS_CLEANUP_BATCH_SIZE", subsystem: "workers", requiredInDevelopment: false, requiredInStaging: false, requiredInProduction: false, clientSafe: false, secret: false, validator: "positive_integer", missingBehavior: "Conservative default is used." },
  { name: "OFERTAS_NOTIFICATION_DELIVERY_ENABLED", subsystem: "notifications", requiredInDevelopment: false, requiredInStaging: false, requiredInProduction: false, clientSafe: false, secret: false, validator: "enum", missingBehavior: "Outbox remains pending; no sent state is claimed." },
  { name: "NEXT_PUBLIC_SITE_URL", subsystem: "public_site", requiredInDevelopment: false, requiredInStaging: true, requiredInProduction: true, clientSafe: true, secret: false, validator: "url", missingBehavior: "Success/cancel/public origins require manual verification." },
  { name: "VERCEL_ENV", subsystem: "public_site", requiredInDevelopment: false, requiredInStaging: true, requiredInProduction: true, clientSafe: false, secret: false, validator: "enum", missingBehavior: "Readiness reports environment as unknown." },
];
