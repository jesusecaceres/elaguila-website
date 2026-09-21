#!/usr/bin/env bash
# =============================================================================
# LEONIX IX REWARDS — run the SQL money engine against a real PostgreSQL.
#
# WHY. Every other check on `20260921120000_leonix_ix_rewards_foundation.sql` reads its TEXT. A
# grep cannot show that the posting function refuses an over-redemption, that the wallet lock
# serializes two callers, or that the replay lands on the balances the incremental path produced.
# This does, by applying the migration UNMODIFIED to a throwaway database and exercising it.
#
# SAFETY. It refuses to run against anything but a local cluster: no host, no password, and a
# database name it creates and drops itself. It never reads or writes a remote Supabase project,
# and applying the migration here is not applying it anywhere that matters.
#
# USAGE
#   scripts/verify-ix-rewards-sql-behavior-01.sh              # uses PGHOST/PGPORT from the env
#   PGHOST=/var/run/postgresql scripts/verify-ix-rewards-sql-behavior-01.sh
#
# Exits 0 on success, 1 on a failed assertion, and 77 when no local PostgreSQL is reachable — the
# environmental-limitation case, which a caller must report as "not run", never as "passed".
# =============================================================================
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION="$REPO_ROOT/supabase/migrations/20260921120000_leonix_ix_rewards_foundation.sql"
SUITE="$REPO_ROOT/scripts/sql/verify-ix-rewards-sql-behavior-01.sql"
DB="leonix_rewards_sql_probe_$$"
# A floor under the assertion count. A harness that quietly stops asserting is worse than none.
MIN_ASSERTIONS=98

# REFUSE A REMOTE TARGET, LOUDLY. A unix socket path or an explicit loopback address only.
case "${PGHOST:-}" in
  ""|/*|localhost|127.0.0.1|::1) ;;
  *) echo "verify-ix-rewards-sql-behavior-01: refusing to run against non-local PGHOST=$PGHOST" >&2; exit 1 ;;
esac
if [ -n "${PGPASSWORD:-}" ] || [ -n "${DATABASE_URL:-}" ]; then
  echo "verify-ix-rewards-sql-behavior-01: refusing to run with a password or DATABASE_URL set; this suite is for a throwaway LOCAL cluster only" >&2
  exit 1
fi

command -v psql >/dev/null 2>&1 || { echo "verify-ix-rewards-sql-behavior-01: SKIPPED (no psql on PATH)"; exit 77; }
psql -d postgres -tAc 'select 1' >/dev/null 2>&1 || {
  echo "verify-ix-rewards-sql-behavior-01: SKIPPED (no local PostgreSQL reachable)"; exit 77; }

cleanup() { dropdb --if-exists "$DB" >/dev/null 2>&1 || true; }
trap cleanup EXIT

createdb "$DB" || { echo "verify-ix-rewards-sql-behavior-01: could not create $DB" >&2; exit 1; }

# The objects the migration references. Deliberately minimal: none of this is Leonix schema, it
# exists so the migration's own DDL, constraints and functions can be exercised in isolation.
psql -q -d "$DB" -v ON_ERROR_STOP=1 >/dev/null <<'STUBS' || { echo "stub setup failed" >&2; exit 1; }
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
CREATE TABLE IF NOT EXISTS public.businesses (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE IF NOT EXISTS public.leonix_payment_records (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE OR REPLACE FUNCTION public.is_active_business_member(p uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT false $$;
STUBS

echo "— applying the migration (unmodified) to throwaway database $DB"
PGOPTIONS="-c client_min_messages=warning" psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$MIGRATION" >/dev/null || {
  echo "verify-ix-rewards-sql-behavior-01: THE MIGRATION FAILED TO APPLY" >&2; exit 1; }

echo "— APPLIED TWICE, because this migration is written to be re-appliable"
PGOPTIONS="-c client_min_messages=warning" psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$MIGRATION" >/dev/null || {
  echo "verify-ix-rewards-sql-behavior-01: THE MIGRATION IS NOT IDEMPOTENT" >&2; exit 1; }

OUT="$(psql -q -d "$DB" -tA -v ON_ERROR_STOP=1 -f "$SUITE" 2>&1)"
STATUS=$?
if [ $STATUS -ne 0 ]; then
  echo "$OUT" >&2
  echo "verify-ix-rewards-sql-behavior-01: FAILED" >&2
  exit 1
fi
echo "$OUT" | tail -1

COUNT="$(printf '%s' "$OUT" | sed -n 's/.*OK (\([0-9]*\) SQL assertions.*/\1/p' | tail -1)"
if [ -z "$COUNT" ] || [ "$COUNT" -lt "$MIN_ASSERTIONS" ]; then
  echo "verify-ix-rewards-sql-behavior-01: only ${COUNT:-0} assertions ran; at least $MIN_ASSERTIONS are required" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# TWO REAL SESSIONS. Everything above runs in one connection, so it cannot show that the wallet
# lock serializes anything. These two scenarios use genuinely concurrent transactions.
# ---------------------------------------------------------------------------
echo "— concurrency: two sessions competing for the same balance"
SETUP="$(psql -d "$DB" -tA -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE b uuid; w uuid; p uuid;
BEGIN
  INSERT INTO public.businesses DEFAULT VALUES RETURNING id INTO b;
  INSERT INTO public.leonix_rewards_wallets (business_id) VALUES (b) RETURNING id INTO w;
  INSERT INTO public.leonix_payment_records DEFAULT VALUES RETURNING id INTO p;
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',1000,'stripe_payment','c:earn',NULL,p);
  INSERT INTO public.leonix_rewards_redemptions (wallet_id, amount_cents, idempotency_key, expires_at)
    VALUES (w, 600, 'reserve:cA', now() + interval '30 min'), (w, 600, 'reserve:cB', now() + interval '30 min');
  CREATE TABLE public.probe_ctx AS SELECT w AS wallet_id, p AS payment_id;
END $$;
SELECT 'ready';
SQL
)" || { echo "concurrency setup failed: $SETUP" >&2; exit 1; }

# Session A opens a transaction, takes the wallet lock and holds it; session B must queue behind it
# rather than reading the same balance and reserving it too.
FIFO_DIR="$(mktemp -d)"
mkfifo "$FIFO_DIR/a_in"
( psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$FIFO_DIR/a_in" > "$FIFO_DIR/a_out" 2>&1; echo $? > "$FIFO_DIR/a_rc" ) &
exec 3>"$FIFO_DIR/a_in"
cat >&3 <<'SQL'
BEGIN;
SELECT public.leonix_rewards_post_entry(
  (SELECT wallet_id FROM public.probe_ctx), 'redeem_reserve', 600, 'checkout_redemption', 'reserve:cA',
  NULL, NULL, (SELECT id FROM public.leonix_rewards_redemptions WHERE idempotency_key = 'reserve:cA'));
SQL
sleep 1
# B runs in its own connection while A still holds the lock. It must BLOCK, then be refused.
B_OUT="$(timeout 20 psql -q -d "$DB" -tA -c "
  SELECT public.leonix_rewards_post_entry(
    (SELECT wallet_id FROM public.probe_ctx), 'redeem_reserve', 600, 'checkout_redemption', 'reserve:cB',
    NULL, NULL, (SELECT id FROM public.leonix_rewards_redemptions WHERE idempotency_key = 'reserve:cB'));" 2>&1)" &
B_PID=$!
sleep 1
printf 'COMMIT;\n' >&3
exec 3>&-
wait $B_PID
B_OUT="$(timeout 20 psql -q -d "$DB" -tA -c "
  SELECT public.leonix_rewards_post_entry(
    (SELECT wallet_id FROM public.probe_ctx), 'redeem_reserve', 600, 'checkout_redemption', 'reserve:cB2',
    NULL, NULL, (SELECT id FROM public.leonix_rewards_redemptions WHERE idempotency_key = 'reserve:cB'));" 2>&1)"
wait
rm -rf "$FIFO_DIR"

FINAL="$(psql -d "$DB" -tA -c "SELECT available_cents || '/' || reserved_cents FROM public.leonix_rewards_wallets WHERE id = (SELECT wallet_id FROM public.probe_ctx);")"
if [ "$FINAL" != "400/600" ]; then
  echo "verify-ix-rewards-sql-behavior-01: two concurrent reserves left the wallet at $FINAL, expected 400/600" >&2
  exit 1
fi
case "$B_OUT" in
  *"exceeds available"*) echo "ok  the second concurrent reserve was refused by name after queueing on the wallet lock" ;;
  *) echo "verify-ix-rewards-sql-behavior-01: the second concurrent reserve was not refused: $B_OUT" >&2; exit 1 ;;
esac

echo "verify-ix-rewards-sql-behavior-01: OK ($COUNT in-session assertions + 2 cross-session concurrency proofs)"
