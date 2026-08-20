-- LEO-16 Scheduled watches + owner push notification persistence.
-- Service-role / server-only. RLS enabled with zero public policies.

BEGIN;

CREATE TABLE IF NOT EXISTS public.leo_watch_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_auth_user_id text NOT NULL
    CHECK (char_length(btrim(owner_auth_user_id)) > 0 AND char_length(owner_auth_user_id) <= 200),

  watch_kind text NOT NULL
    CHECK (watch_kind IN (
      'MORNING_BRIEF', 'CLIENT_CARE', 'COMMUNICATION', 'COMMITMENTS',
      'ACTION_RECEIPTS', 'ATTENTION', 'PROJECT_HEALTH', 'SYSTEM_HEALTH'
    )),

  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,

  status text NOT NULL
    CHECK (status IN ('OK', 'UNAVAILABLE', 'DEGRADED', 'SKIPPED')),

  severity text NOT NULL
    CHECK (severity IN ('CRITICAL', 'HIGH', 'NORMAL', 'INFORMATIONAL')),

  fingerprint text NOT NULL
    CHECK (char_length(btrim(fingerprint)) > 0 AND char_length(fingerprint) <= 512),

  changed boolean NOT NULL DEFAULT false,
  should_notify boolean NOT NULL DEFAULT false,

  headline text NULL
    CHECK (headline IS NULL OR char_length(headline) <= 200),
  summary text NULL
    CHECK (summary IS NULL OR char_length(summary) <= 1000),
  deep_link text NOT NULL DEFAULT '/admin/leo'
    CHECK (char_length(deep_link) <= 200),

  error_class text NULL
    CHECK (error_class IS NULL OR char_length(error_class) <= 120),

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leo_watch_runs_owner_kind_created_idx
  ON public.leo_watch_runs (owner_auth_user_id, watch_kind, created_at DESC);

CREATE INDEX IF NOT EXISTS leo_watch_runs_owner_fingerprint_idx
  ON public.leo_watch_runs (owner_auth_user_id, fingerprint, created_at DESC);

COMMENT ON TABLE public.leo_watch_runs IS
  'LEO-16 scheduled watch receipts — bounded headlines only. No Gmail bodies or OAuth material.';

ALTER TABLE public.leo_watch_runs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.leo_notification_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_auth_user_id text NOT NULL
    CHECK (char_length(btrim(owner_auth_user_id)) > 0 AND char_length(owner_auth_user_id) <= 200),

  endpoint text NOT NULL
    CHECK (char_length(endpoint) > 0 AND char_length(endpoint) <= 2048),
  p256dh text NOT NULL
    CHECK (char_length(p256dh) > 0 AND char_length(p256dh) <= 512),
  auth text NOT NULL
    CHECK (char_length(auth) > 0 AND char_length(auth) <= 512),

  user_agent text NULL
    CHECK (user_agent IS NULL OR char_length(user_agent) <= 400),

  enabled boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_success_at timestamptz NULL,
  last_failure_at timestamptz NULL,

  CONSTRAINT leo_notification_subscriptions_endpoint_unique UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS leo_notification_subscriptions_owner_enabled_idx
  ON public.leo_notification_subscriptions (owner_auth_user_id, enabled)
  WHERE enabled = true;

COMMENT ON TABLE public.leo_notification_subscriptions IS
  'LEO-16 owner push subscriptions — server-only secrets. Never expose p256dh/auth to clients after storage.';

ALTER TABLE public.leo_notification_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.leo_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_auth_user_id text NOT NULL
    CHECK (char_length(btrim(owner_auth_user_id)) > 0 AND char_length(owner_auth_user_id) <= 200),

  watch_kind text NULL
    CHECK (watch_kind IS NULL OR watch_kind IN (
      'MORNING_BRIEF', 'CLIENT_CARE', 'COMMUNICATION', 'COMMITMENTS',
      'ACTION_RECEIPTS', 'ATTENTION', 'PROJECT_HEALTH', 'SYSTEM_HEALTH'
    )),

  fingerprint text NOT NULL
    CHECK (char_length(btrim(fingerprint)) > 0 AND char_length(fingerprint) <= 512),

  delivery_state text NOT NULL
    CHECK (delivery_state IN (
      'PREPARED', 'ATTEMPTED', 'DELIVERED_TO_PUSH_PROVIDER', 'FAILED'
    )),

  title text NOT NULL
    CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  body text NOT NULL
    CHECK (char_length(body) > 0 AND char_length(body) <= 500),

  severity text NOT NULL
    CHECK (severity IN ('CRITICAL', 'HIGH', 'NORMAL', 'INFORMATIONAL')),

  test boolean NOT NULL DEFAULT false,
  subscription_id uuid NULL
    REFERENCES public.leo_notification_subscriptions (id),

  error_class text NULL
    CHECK (error_class IS NULL OR char_length(error_class) <= 120),

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leo_notification_deliveries_owner_fingerprint_idx
  ON public.leo_notification_deliveries (owner_auth_user_id, fingerprint, created_at DESC);

CREATE INDEX IF NOT EXISTS leo_notification_deliveries_owner_created_idx
  ON public.leo_notification_deliveries (owner_auth_user_id, created_at DESC);

COMMENT ON TABLE public.leo_notification_deliveries IS
  'LEO-16 notification delivery truth — provider acceptance only, not user-open claims.';

ALTER TABLE public.leo_notification_deliveries ENABLE ROW LEVEL SECURITY;

COMMIT;
