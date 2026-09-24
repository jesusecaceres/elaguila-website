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
MIN_ASSERTIONS=142

# THE CONCURRENCY PROOF'S TIMING FLOOR, AND A GUARD ON THE FLOOR ITSELF.
#
# The two cross-session races below are only proofs because the racing session is MEASURED waiting
# on the wallet lock. An independent reviewer set `MIN_MS=0` and left both suites green: with the
# floor at zero, "queued on the lock" reverts to a caption over a number nobody checks — the exact
# failure the block's own comment says it exists to prevent. `HOLD_SECONDS=0` did the same through
# a plausible-looking constant tweak.
#
# So the floor is derived, and then CHECKED, before anything else runs. `LEONIX_HOLD_SECONDS` exists
# so a test can hand this guard a degenerate value and watch it refuse — which is how the guard is
# itself proven, rather than asserted.
HOLD_SECONDS="${LEONIX_HOLD_SECONDS:-3}"
MIN_MS=$(( (HOLD_SECONDS - 1) * 1000 ))
if [ "$HOLD_SECONDS" -lt 2 ] || [ "$MIN_MS" -lt 1000 ]; then
  echo "verify-ix-rewards-sql-behavior-01: degenerate concurrency timing floor (HOLD_SECONDS=${HOLD_SECONDS}, MIN_MS=${MIN_MS}); the race would be asserted by caption, not by measurement" >&2
  exit 1
fi

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
# TWO REAL SESSIONS.
#
# Everything above runs in one connection, so it cannot show that the wallet lock serializes
# anything. These scenarios use genuinely concurrent transactions.
#
# THE FIRST VERSION OF THIS BLOCK PROVED NOTHING, and an adversarial review demonstrated it by
# deleting session A's reserve entirely and watching the runner still print "refused after queueing
# on the wallet lock". Three defects: the racing session's output was captured into a variable
# inside a BACKGROUND SUBSHELL (so the parent never saw it), the variable was then OVERWRITTEN by a
# second, entirely sequential call, and session A's own exit code was written to a file nobody read.
#
# So now: every session writes to a FILE, every exit code is read, and the racing call is timed —
# if B did not actually wait on A's lock, its duration is short and the check fails. That timing
# assertion is what makes "queued on the lock" a measurement rather than a caption.
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

WORK="$(mktemp -d)"
cleanup_work() { rm -rf "$WORK"; }
trap 'cleanup_work; cleanup' EXIT

# --- Session A: takes the wallet lock and HOLDS it for HOLD_SECONDS before committing.
mkfifo "$WORK/a_in"
(
  psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$WORK/a_in" > "$WORK/a_out" 2>&1
  echo "$?" > "$WORK/a_rc"
) &
A_PID=$!
exec 3>"$WORK/a_in"
cat >&3 <<'SQL'
BEGIN;
SELECT public.leonix_rewards_post_entry(
  (SELECT wallet_id FROM public.probe_ctx), 'redeem_reserve', 600, 'checkout_redemption', 'reserve:cA',
  NULL, NULL, (SELECT id FROM public.leonix_rewards_redemptions WHERE idempotency_key = 'reserve:cA'));
SQL

# Give A time to take the lock before B asks for it.
sleep 1

# --- Session B: the racing reserve. Its output and its duration go to FILES, from inside the
#     subshell that actually runs it, so the parent reads what the race produced.
(
  B_START="$(date +%s%N)"
  timeout 30 psql -q -d "$DB" -tA -c "
    SELECT public.leonix_rewards_post_entry(
      (SELECT wallet_id FROM public.probe_ctx), 'redeem_reserve', 600, 'checkout_redemption', 'reserve:cB',
      NULL, NULL, (SELECT id FROM public.leonix_rewards_redemptions WHERE idempotency_key = 'reserve:cB'));" \
    > "$WORK/b_out" 2>&1
  echo "$?" > "$WORK/b_rc"
  echo $(( ($(date +%s%N) - B_START) / 1000000 )) > "$WORK/b_ms"
) &
B_PID=$!

# A holds the lock for a measurable interval, then commits.
sleep "$HOLD_SECONDS"
printf 'COMMIT;\n' >&3
exec 3>&-
wait "$A_PID"
wait "$B_PID"

A_RC="$(cat "$WORK/a_rc" 2>/dev/null || echo missing)"
B_RC="$(cat "$WORK/b_rc" 2>/dev/null || echo missing)"
B_OUT="$(cat "$WORK/b_out" 2>/dev/null || true)"
B_MS="$(cat "$WORK/b_ms" 2>/dev/null || echo 0)"

# A must have SUCCEEDED. If it did not, there was no lock and nothing below means anything.
if [ "$A_RC" != "0" ]; then
  echo "verify-ix-rewards-sql-behavior-01: the holding session failed (rc=$A_RC)" >&2
  cat "$WORK/a_out" >&2
  exit 1
fi
grep -q '600' "$WORK/a_out" || {
  echo "verify-ix-rewards-sql-behavior-01: the holding session did not reserve anything" >&2
  cat "$WORK/a_out" >&2
  exit 1
}

# B must have BLOCKED for most of the hold. A short duration means it never queued, which is the
# exact way the previous version of this check passed while proving nothing.
# An EMPTY `B_MS` used to make `[ "$B_MS" -lt "$MIN_MS" ]` return 2, which `if` treats as false —
# a silent pass on a session that produced no measurement at all. Defaulted, so it reads as 0.
B_MS="${B_MS:-0}"
if [ "$B_MS" -lt "$MIN_MS" ]; then
  echo "verify-ix-rewards-sql-behavior-01: the racing session returned in ${B_MS}ms without waiting for the lock (expected at least ${MIN_MS}ms)" >&2
  exit 1
fi

# ...and then been refused by name, because the balance was gone by the time it got the lock.
case "$B_OUT" in
  *"exceeds available"*) : ;;
  *) echo "verify-ix-rewards-sql-behavior-01: the racing reserve was not refused: $B_OUT" >&2; exit 1 ;;
esac
[ "$B_RC" != "0" ] || {
  echo "verify-ix-rewards-sql-behavior-01: the racing reserve reported success" >&2; exit 1; }

FINAL="$(psql -d "$DB" -tA -c "SELECT available_cents || '/' || reserved_cents FROM public.leonix_rewards_wallets WHERE id = (SELECT wallet_id FROM public.probe_ctx);")"
if [ "$FINAL" != "400/600" ]; then
  echo "verify-ix-rewards-sql-behavior-01: two concurrent reserves left the wallet at $FINAL, expected 400/600" >&2
  exit 1
fi
echo "ok  the racing reserve queued ${B_MS}ms on the wallet lock and was then refused by name"

# --- And a second race on the same lock, in the other direction: while A holds the wallet, a
#     RECOMPUTE must queue behind it rather than reading a half-applied wallet.
psql -q -d "$DB" -tA -c "
  INSERT INTO public.leonix_rewards_redemptions (wallet_id, amount_cents, idempotency_key, expires_at)
  VALUES ((SELECT wallet_id FROM public.probe_ctx), 100, 'reserve:cC', now() + interval '30 min');" >/dev/null

mkfifo "$WORK/c_in"
(
  psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$WORK/c_in" > "$WORK/c_out" 2>&1
  echo "$?" > "$WORK/c_rc"
) &
C_PID=$!
exec 4>"$WORK/c_in"
cat >&4 <<'SQL'
BEGIN;
SELECT public.leonix_rewards_post_entry(
  (SELECT wallet_id FROM public.probe_ctx), 'redeem_reserve', 100, 'checkout_redemption', 'reserve:cC',
  NULL, NULL, (SELECT id FROM public.leonix_rewards_redemptions WHERE idempotency_key = 'reserve:cC'));
SQL
sleep 1
(
  D_START="$(date +%s%N)"
  timeout 30 psql -q -d "$DB" -tA -c "
    SELECT available_cents || '/' || reserved_cents FROM public.leonix_rewards_recompute_wallet(
      (SELECT wallet_id FROM public.probe_ctx));" > "$WORK/d_out" 2>&1
  echo "$?" > "$WORK/d_rc"
  echo $(( ($(date +%s%N) - D_START) / 1000000 )) > "$WORK/d_ms"
) &
D_PID=$!
sleep "$HOLD_SECONDS"
printf 'COMMIT;\n' >&4
exec 4>&-
wait "$C_PID"
wait "$D_PID"

C_RC="$(cat "$WORK/c_rc" 2>/dev/null || echo missing)"
D_RC="$(cat "$WORK/d_rc" 2>/dev/null || echo missing)"
D_MS="$(cat "$WORK/d_ms" 2>/dev/null || echo 0)"
D_OUT="$(tr -d ' \n' < "$WORK/d_out" 2>/dev/null || true)"
[ "$C_RC" = "0" ] || { echo "the holding session failed (rc=$C_RC)" >&2; cat "$WORK/c_out" >&2; exit 1; }
[ "$D_RC" = "0" ] || { echo "the recompute failed (rc=$D_RC)" >&2; cat "$WORK/d_out" >&2; exit 1; }
D_MS="${D_MS:-0}"
if [ "$D_MS" -lt "$MIN_MS" ]; then
  echo "verify-ix-rewards-sql-behavior-01: the recompute returned in ${D_MS}ms without waiting for the wallet lock" >&2
  exit 1
fi
if [ "$D_OUT" != "300/700" ]; then
  echo "verify-ix-rewards-sql-behavior-01: the recompute saw $D_OUT, expected 300/700 — it read a half-applied wallet" >&2
  exit 1
fi
echo "ok  a recompute queued ${D_MS}ms on the same lock and replayed the COMMITTED wallet, not a partial one"

echo "verify-ix-rewards-sql-behavior-01: OK ($COUNT in-session assertions + 2 timed cross-session concurrency proofs)"
