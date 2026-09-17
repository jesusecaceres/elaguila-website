/**
 * TEMPORARY — Gate SERVICIOS-RUNTIME-CONFIG-PROBE-DEPLOY-1.
 *
 * Pure, sanitized runtime-readiness classifier. Deliberately a pure function of an env-like
 * record so it can be unit-tested with fabricated sample values and never needs real secrets.
 *
 * SAFETY CONTRACT — this module may return ONLY:
 *   - booleans (is a variable set / does it equal an expected literal)
 *   - the Stripe mode CLASSIFICATION "test" | "live" | "unknown" (never the prefix itself)
 *   - the Supabase project ref parsed from the PUBLIC NEXT_PUBLIC_SUPABASE_URL hostname
 *   - the Vercel environment name and the Vercel-provided git commit SHA
 *
 * It must NEVER return a secret value, any characters of a key or token, a JWT or any decoded
 * claim, a Twilio SID, or the length of any secret. Every branch below returns a boolean or one
 * of a fixed set of literals — there is no code path that copies an env value into the output
 * except `projectRef`, which is a public identifier already present in the browser bundle.
 *
 * This is DIAGNOSTIC SCAFFOLDING, not product architecture. It is scheduled for removal
 * immediately after Servicios runtime certification and must not be copied to other categories.
 */

export type StripeModeClassification = "test" | "live" | "unknown";

export type ServiciosRuntimeReadinessReport = {
  ok: true;
  environment: {
    vercelEnv: "preview" | "production" | "development" | "unknown";
    gitCommitSha: string | null;
  };
  supabase: {
    urlSet: boolean;
    anonKeySet: boolean;
    serviceRoleSet: boolean;
    projectRef: string | null;
    allThreePresent: boolean;
  };
  servicios: {
    strictPublish: boolean;
    devPublishSet: boolean;
    moderationModeSet: boolean;
  };
  identity: { hashKeySet: boolean };
  twilio: {
    accountSidSet: boolean;
    authTokenSet: boolean;
    verifyServiceSidSet: boolean;
    allSet: boolean;
  };
  stripe: {
    secretSet: boolean;
    mode: StripeModeClassification;
    webhookSecretSet: boolean;
  };
  google: { mapsKeySet: boolean };
  blob: { tokenSet: boolean };
};

export type ReadinessEnvSource = Record<string, string | undefined>;

/** Presence only — the value itself never leaves this function. */
function isSet(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function classifyVercelEnv(
  value: string | undefined,
): ServiciosRuntimeReadinessReport["environment"]["vercelEnv"] {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "preview" || v === "production" || v === "development") return v;
  return "unknown";
}

/**
 * Classification ONLY. Returns one of three fixed literals and never any part of the key.
 * Anything that is not an unambiguous Stripe test/live secret key is "unknown" — including a
 * restricted key (rk_*) or a publishable key pasted by mistake, both of which deserve attention
 * rather than a confident-looking answer.
 */
export function classifyStripeMode(secret: string | undefined): StripeModeClassification {
  const s = (secret ?? "").trim();
  if (s.startsWith("sk_test_")) return "test";
  if (s.startsWith("sk_live_")) return "live";
  return "unknown";
}

/**
 * Parses the Supabase project ref from the PUBLIC url's hostname only — never by decoding a
 * token. Returns null for a self-hosted/custom host so the caller cannot mistake an unparsed
 * value for a verified ref.
 */
export function parseSupabaseProjectRef(url: string | undefined): string | null {
  const raw = (url ?? "").trim();
  if (!raw) return null;
  let host: string;
  try {
    host = new URL(raw).hostname;
  } catch {
    return null;
  }
  if (!host.endsWith(".supabase.co") && !host.endsWith(".supabase.in")) return null;
  const ref = host.split(".")[0] ?? "";
  // Supabase refs are lowercase alphanumeric; refuse anything else rather than echoing it back.
  return /^[a-z0-9]{16,32}$/.test(ref) ? ref : null;
}

export function buildServiciosRuntimeReadinessReport(
  env: ReadinessEnvSource,
): ServiciosRuntimeReadinessReport {
  const supabaseUrlSet = isSet(env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonSet = isSet(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const supabaseServiceRoleSet = isSet(env.SUPABASE_SERVICE_ROLE_KEY);

  const twilioAccountSidSet = isSet(env.TWILIO_ACCOUNT_SID);
  const twilioAuthTokenSet = isSet(env.TWILIO_AUTH_TOKEN);
  const twilioVerifyServiceSidSet = isSet(env.TWILIO_VERIFY_SERVICE_SID);

  return {
    ok: true,
    environment: {
      vercelEnv: classifyVercelEnv(env.VERCEL_ENV),
      gitCommitSha: isSet(env.VERCEL_GIT_COMMIT_SHA) ? String(env.VERCEL_GIT_COMMIT_SHA).trim() : null,
    },
    supabase: {
      urlSet: supabaseUrlSet,
      anonKeySet: supabaseAnonSet,
      serviceRoleSet: supabaseServiceRoleSet,
      projectRef: parseSupabaseProjectRef(env.NEXT_PUBLIC_SUPABASE_URL),
      allThreePresent: supabaseUrlSet && supabaseAnonSet && supabaseServiceRoleSet,
    },
    servicios: {
      // The launch requirement is the exact literal "1", not merely "set".
      strictPublish: (env.SERVICIOS_STRICT_PUBLISH ?? "").trim() === "1",
      // These two must be UNSET for certification, so presence is the interesting fact.
      devPublishSet: isSet(env.SERVICIOS_DEV_PUBLISH),
      moderationModeSet: isSet(env.SERVICIOS_MODERATION_MODE),
    },
    identity: { hashKeySet: isSet(env.LEONIX_IDENTITY_HASH_KEY) },
    twilio: {
      accountSidSet: twilioAccountSidSet,
      authTokenSet: twilioAuthTokenSet,
      verifyServiceSidSet: twilioVerifyServiceSidSet,
      allSet: twilioAccountSidSet && twilioAuthTokenSet && twilioVerifyServiceSidSet,
    },
    stripe: {
      secretSet: isSet(env.STRIPE_SECRET_KEY),
      mode: classifyStripeMode(env.STRIPE_SECRET_KEY),
      webhookSecretSet: isSet(env.STRIPE_WEBHOOK_SECRET),
    },
    google: { mapsKeySet: isSet(env.GOOGLE_MAPS_API_KEY) },
    blob: { tokenSet: isSet(env.BLOB_READ_WRITE_TOKEN) },
  };
}
