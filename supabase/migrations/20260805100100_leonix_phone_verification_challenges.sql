-- Package C Build 2 (C4) — ephemeral phone-verification challenge/attempt log.
--
-- Twilio Verify Service SID reference only; NEVER stores a raw OTP value (Twilio generates,
-- stores, and checks the code itself). Doubles as the rate-limit ledger via atomic unique-slot
-- reservations, NOT a COUNT(*)-then-INSERT pattern — the latter has a race window where two
-- concurrent requests can both count under the limit and both insert, overshooting it. Every
-- OTP request/check attempts to claim a `(rate_subject, rate_window_kind, rate_window_start,
-- rate_slot)` unique slot via a single-row INSERT; exhausting all slots for a window (all real
-- 23505s) IS the rate-limit rejection, atomically, with no separate decision query.
--
-- Raw IP is never stored — only its sha256 hash, prefixed to distinguish it from a phone-number
-- rate_subject.
--
-- Additive only. RLS enabled, service-role only, no public policies.

CREATE TABLE IF NOT EXISTS public.leonix_phone_verification_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  owner_user_id uuid,
  phone_e164 text NOT NULL,
  request_ip_hash text,

  provider text NOT NULL DEFAULT 'twilio_verify'
    CONSTRAINT leonix_phone_verification_challenges_provider_chk CHECK (
      provider IN ('twilio_verify')
    ),
  provider_verification_sid text,
  channel text NOT NULL DEFAULT 'sms'
    CONSTRAINT leonix_phone_verification_challenges_channel_chk CHECK (
      channel IN ('sms', 'call')
    ),

  attempt_kind text NOT NULL
    CONSTRAINT leonix_phone_verification_challenges_kind_chk CHECK (
      attempt_kind IN ('request', 'check')
    ),
  outcome text NOT NULL DEFAULT 'pending'
    CONSTRAINT leonix_phone_verification_challenges_outcome_chk CHECK (
      outcome IN ('pending', 'approved', 'denied', 'expired', 'canceled', 'error')
    ),

  -- Atomic rate-limit slot claim (decision 14 in the plan). rate_subject is either the raw
  -- phone_e164 or 'ip:'||sha256(ip). rate_window_kind distinguishes the four limits enforced:
  -- request_cooldown (60s, single slot), request_hourly (5/phone/hr and 20/ip/hr, same kind,
  -- different subjects), check_ten_min (5/phone/10min).
  rate_subject text,
  rate_window_kind text
    CONSTRAINT leonix_phone_verification_challenges_rate_kind_chk CHECK (
      rate_window_kind IS NULL OR rate_window_kind IN ('request_cooldown', 'request_hourly', 'check_ten_min')
    ),
  rate_window_start timestamptz,
  rate_slot integer,

  -- One in-flight OTP request per phone at a time (distinct from the rate-limit slots above).
  reservation_key text,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS leonix_phone_verification_challenges_phone_idx
  ON public.leonix_phone_verification_challenges (phone_e164);
CREATE INDEX IF NOT EXISTS leonix_phone_verification_challenges_owner_idx
  ON public.leonix_phone_verification_challenges (owner_user_id);
CREATE INDEX IF NOT EXISTS leonix_phone_verification_challenges_created_at_idx
  ON public.leonix_phone_verification_challenges (created_at);

CREATE UNIQUE INDEX IF NOT EXISTS leonix_phone_verification_challenges_open_reservation_uidx
  ON public.leonix_phone_verification_challenges (reservation_key)
  WHERE reservation_key IS NOT NULL AND outcome = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS leonix_phone_verification_challenges_rate_slot_uidx
  ON public.leonix_phone_verification_challenges (rate_subject, rate_window_kind, rate_window_start, rate_slot)
  WHERE rate_subject IS NOT NULL;

ALTER TABLE public.leonix_phone_verification_challenges ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: access via service role only.

COMMENT ON TABLE public.leonix_phone_verification_challenges IS
  'Package C Build 2 (C4) — ephemeral OTP challenge log (Twilio Verify SID only, no raw OTP) and atomic unique-slot rate-limit ledger. Never trust for durable "is this phone verified" truth — see leonix_verified_phone_identities.';
COMMENT ON COLUMN public.leonix_phone_verification_challenges.rate_subject IS
  'phone_e164 for phone-scoped limits, or ''ip:''||sha256(ip) for the IP-scoped limit. Raw IP is never stored.';
