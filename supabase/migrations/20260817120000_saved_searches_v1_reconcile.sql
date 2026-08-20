-- Saved Search 01B — reconcile `saved_searches` into the normalized V1 storage contract.
--
-- Production truth (proven read-only against the connected project before writing this
-- migration): `public.saved_searches` does not exist there. This migration must still be safe
-- to replay against any OTHER environment that already ran the old
-- `20250313000002_saved_searches.sql` legacy migration (id, user_id, query, category, city,
-- created_at only — no filter_payload/fingerprint/is_active/updated_at, no dedup constraint).
--
-- Every statement below is written to be correct in BOTH cases:
--   A. table absent      → CREATE TABLE IF NOT EXISTS defines it fresh, V1-shaped from the start
--   B. legacy table present → left untouched by the CREATE TABLE (IF NOT EXISTS no-ops), then
--      safely evolved column-by-column with ADD COLUMN IF NOT EXISTS; no existing column or row
--      is ever dropped, truncated, or overwritten with fabricated data.
--
-- Fails closed (RAISE EXCEPTION) on an existing table whose pre-existing columns (id, user_id,
-- category, city, created_at) don't have the exact type/nullability/PK/FK properties this
-- migration relies on. `ADD COLUMN IF NOT EXISTS` alone only reconciles column *existence* — it
-- silently no-ops if a same-named column already exists with an incompatible shape. This block
-- proves the existing shape is safe (or a compliant superset of the legacy migration's own
-- declared contract) before any further statement runs, so an unexpectedly hand-edited/drifted
-- table can never be silently treated as compatible.
DO $$
DECLARE
  v_col_type text;
  v_col_nullable text;
  v_has_id_pk boolean;
  v_has_user_fk boolean;
BEGIN
  IF to_regclass('public.saved_searches') IS NULL THEN
    RETURN; -- Case A (table absent) — nothing to verify yet; CREATE TABLE below defines it fresh.
  END IF;

  -- id: uuid, and must be the table's primary key.
  SELECT data_type INTO v_col_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_searches' AND column_name = 'id';
  IF v_col_type IS DISTINCT FROM 'uuid' THEN
    RAISE EXCEPTION 'saved_searches reconciliation: existing id column is % (expected uuid) — unexpected incompatible schema, refusing to proceed.', COALESCE(v_col_type, 'MISSING');
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'public.saved_searches'::regclass AND c.contype = 'p' AND a.attname = 'id'
  ) INTO v_has_id_pk;
  IF NOT v_has_id_pk THEN
    RAISE EXCEPTION 'saved_searches reconciliation: existing id column is not the primary key — unexpected incompatible schema, refusing to proceed.';
  END IF;

  -- user_id: uuid, NOT NULL, and FK to auth.users(id) ON DELETE CASCADE (ownership is the
  -- single most security-critical property this table has — RLS depends on it entirely).
  SELECT data_type, is_nullable INTO v_col_type, v_col_nullable FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_searches' AND column_name = 'user_id';
  IF v_col_type IS DISTINCT FROM 'uuid' THEN
    RAISE EXCEPTION 'saved_searches reconciliation: existing user_id column is % (expected uuid) — unexpected incompatible schema, refusing to proceed.', COALESCE(v_col_type, 'MISSING');
  ELSIF v_col_nullable <> 'NO' THEN
    RAISE EXCEPTION 'saved_searches reconciliation: existing user_id column is nullable — every saved search must have a provable owner, refusing to proceed.';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'public.saved_searches'::regclass AND c.contype = 'f'
      AND c.confrelid = 'auth.users'::regclass AND c.confdeltype = 'c' AND a.attname = 'user_id'
  ) INTO v_has_user_fk;
  IF NOT v_has_user_fk THEN
    RAISE EXCEPTION 'saved_searches reconciliation: existing user_id column has no ON DELETE CASCADE foreign key to auth.users(id) — unexpected incompatible schema, refusing to proceed.';
  END IF;

  -- category: text, NOT NULL (its non-EMPTY-ness for new/normalized writes is enforced by the
  -- NOT VALID check constraint added below, deliberately, rather than here — see that
  -- constraint's comment for why legacy '' rows must not fail this migration).
  SELECT data_type, is_nullable INTO v_col_type, v_col_nullable FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_searches' AND column_name = 'category';
  IF v_col_type IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION 'saved_searches reconciliation: existing category column is % (expected text) — unexpected incompatible schema, refusing to proceed.', COALESCE(v_col_type, 'MISSING');
  ELSIF v_col_nullable <> 'NO' THEN
    RAISE EXCEPTION 'saved_searches reconciliation: existing category column is nullable — every saved search must belong to a real category, refusing to proceed.';
  END IF;

  -- city: text only. Deliberately NOT checked for NOT NULL/non-empty here: unlike category, an
  -- absent city is truthful search semantics ("no city filter"), not incomplete data — see the
  -- city DEFAULT reconciliation below and Gate 2 of Saved Search 01C for the full reasoning.
  SELECT data_type INTO v_col_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_searches' AND column_name = 'city';
  IF v_col_type IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION 'saved_searches reconciliation: existing city column is % (expected text) — unexpected incompatible schema, refusing to proceed.', COALESCE(v_col_type, 'MISSING');
  END IF;

  -- created_at: timestamptz only. Nullability/default drift here is a data-quality concern, not
  -- a security or correctness one, so it is not fail-closed — only the type is load-bearing.
  SELECT data_type INTO v_col_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_searches' AND column_name = 'created_at';
  IF v_col_type IS DISTINCT FROM 'timestamp with time zone' THEN
    RAISE EXCEPTION 'saved_searches reconciliation: existing created_at column is % (expected timestamptz) — unexpected incompatible schema, refusing to proceed.', COALESCE(v_col_type, 'MISSING');
  END IF;
END $$;

-- Case A only (no-op under IF NOT EXISTS when the legacy table already exists — the legacy
-- `query` column, if present, is never touched by this statement or any other in this file).
-- `category` intentionally has NO default (unlike the legacy migration's `DEFAULT ''`): a saved
-- search always concerns a real category, so every insert must supply one explicitly rather than
-- silently falling back to an empty, meaningless value. `city` keeps its legacy `DEFAULT ''`
-- deliberately — an absent city is truthful "no city filter" search semantics, not incomplete
-- data, so a single canonical empty-string sentinel (rather than also allowing NULL) keeps future
-- matcher/query logic simple: exactly one "no filter" representation for this field.
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  city text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Explicit DEFAULT reconciliation — safe/non-destructive either way (a column default only
-- affects future inserts that omit the column; it never rewrites existing row values), so these
-- run unconditionally rather than only inside the legacy-table branch above. This is what
-- actually makes a legacy table's DEFAULTs match the target contract, since `CREATE TABLE IF NOT
-- EXISTS` above is a no-op against it: legacy `category` loses its `DEFAULT ''` (matching the
-- "no fabricated category" correction) while `id`/`city`/`created_at` are confirmed to carry the
-- exact target defaults.
ALTER TABLE public.saved_searches ALTER COLUMN category DROP DEFAULT;
ALTER TABLE public.saved_searches ALTER COLUMN city SET DEFAULT '';
ALTER TABLE public.saved_searches ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.saved_searches ALTER COLUMN created_at SET DEFAULT now();

-- Normalized V1 columns — safe under both cases: brand new (added onto the table just created
-- above) and legacy (added onto the pre-existing table without touching its existing columns).
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS min_price integer;
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS max_price integer;
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS filter_payload jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- fingerprint starts nullable: any pre-existing legacy rows cannot satisfy a real semantic
-- fingerprint (their flat query/city shape isn't the normalized contract) until backfilled below.
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS fingerprint text;

-- Legacy-safe compatibility fingerprint: deterministic (same row id -> same value always),
-- collision-free (derived from the row's own uuid PK), and explicitly marked `legacy:` so it can
-- never be mistaken for a real normalized-search fingerprint. This does NOT pretend the old flat
-- query/city shape is equivalent to the new canonical (category, city, min_price, max_price,
-- filter_payload) semantic definition — it only satisfies storage integrity (NOT NULL, unique
-- with user_id+category) until the owner re-saves the search through Saved Search 02 application
-- logic, which computes the real canonical fingerprint. A no-op on a freshly created table (zero
-- rows to backfill).
UPDATE public.saved_searches SET fingerprint = 'legacy:' || id::text WHERE fingerprint IS NULL;

ALTER TABLE public.saved_searches ALTER COLUMN fingerprint SET NOT NULL;

-- Constraints — idempotent (skip if already present from a prior run of this same file).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_searches_min_price_nonneg_chk') THEN
    ALTER TABLE public.saved_searches
      ADD CONSTRAINT saved_searches_min_price_nonneg_chk CHECK (min_price IS NULL OR min_price >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_searches_max_price_nonneg_chk') THEN
    ALTER TABLE public.saved_searches
      ADD CONSTRAINT saved_searches_max_price_nonneg_chk CHECK (max_price IS NULL OR max_price >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_searches_price_range_chk') THEN
    ALTER TABLE public.saved_searches
      ADD CONSTRAINT saved_searches_price_range_chk
      CHECK (min_price IS NULL OR max_price IS NULL OR max_price >= min_price);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_searches_fingerprint_nonempty_chk') THEN
    -- Safe to VALIDATE immediately (not NOT VALID): every row was just backfilled above to a
    -- guaranteed non-empty value, fresh or legacy.
    ALTER TABLE public.saved_searches
      ADD CONSTRAINT saved_searches_fingerprint_nonempty_chk CHECK (length(trim(fingerprint)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_searches_category_nonempty_chk') THEN
    -- `category` is not a column this migration controls the history of — a legacy row from an
    -- unknown environment could hold '' (the old column's own default, now dropped above), and
    -- never fabricates a category for it; it simply keeps its existing (possibly empty) value
    -- until re-saved through Saved Search 02.
    --
    -- The exemption clause `fingerprint = 'legacy:' || id::text` is what makes that livable, not
    -- just tolerated at migration time: a plain "NOT VALID, category can stay blank forever"
    -- constraint would still re-run on every future UPDATE of that row (Postgres re-checks ALL
    -- CHECK constraints on a row whenever ANY column changes, not just the changed ones) — so a
    -- legacy row could never be paused/reactivated/otherwise touched again without first
    -- fabricating a category, which is exactly what this migration refuses to do. Tying the
    -- exemption to the row's own deterministic legacy marker instead means: a genuine preserved
    -- legacy row (fingerprint still exactly `legacy:<its own id>`) may keep an empty category
    -- through any future update — read, pause, reactivate, delete all keep working — while any
    -- row with a real (non-`legacy:`-prefixed) fingerprint, i.e. every new/normalized row and
    -- every legacy row Saved Search 02 has actually re-saved, must have a real category. A legacy
    -- row can only lose this exemption by being normalized (fingerprint no longer `legacy:<id>`),
    -- at which point Saved Search 02 is required to have supplied a real category too — the
    -- exemption and the normalization are the same event, by construction.
    -- Safe to VALIDATE immediately rather than NOT VALID: every existing row was just backfilled
    -- to `fingerprint = 'legacy:' || id::text` above if it didn't already have a real one, so the
    -- first OR-branch is satisfied for every row this migration didn't already require a real
    -- category from. Kept NOT VALID anyway as a zero-cost extra safety margin.
    ALTER TABLE public.saved_searches
      ADD CONSTRAINT saved_searches_category_nonempty_chk
      CHECK (
        fingerprint = 'legacy:' || id::text
        OR (category IS NOT NULL AND length(btrim(category)) > 0)
      ) NOT VALID;
  END IF;
END $$;

-- Dedup — unique index (equivalent enforcement to a UNIQUE table constraint, but supports
-- IF NOT EXISTS cleanly for safe replay). Collision-safe even against legacy rows: each legacy
-- fingerprint is derived from that row's own unique id.
CREATE UNIQUE INDEX IF NOT EXISTS saved_searches_owner_category_fingerprint_uidx
  ON public.saved_searches (user_id, category, fingerprint);

-- Owner lookup (matches the legacy index's purpose/name exactly — a no-op if it already exists).
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches (user_id);

-- Future matcher prefilter: `is_active` ordered before `city` because every matcher read will
-- filter to active searches first (paused searches are explicitly excluded from matching), then
-- narrow by city within the active set for a given category.
CREATE INDEX IF NOT EXISTS idx_saved_searches_category_active_city
  ON public.saved_searches (category, is_active, city);

-- updated_at: database-maintained (repo precedent: magazine_visual_assets_set_updated_at /
-- magazine_visual_assets_updated_at trigger). Saved Search is user-editable private data where a
-- truthful "last edited" timestamp matters regardless of whether every future application code
-- path remembers to set it — the storage layer guarantees it here.
CREATE OR REPLACE FUNCTION public.saved_searches_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saved_searches_updated_at ON public.saved_searches;

CREATE TRIGGER saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW
  EXECUTE PROCEDURE public.saved_searches_set_updated_at();

-- RLS — private user data. Owner-only, matching the legacy policy's exact predicate shape. The
-- DROP POLICY IF EXISTS below is scoped to this one named policy only — it does not touch, list,
-- or drop any other policy that might exist on this table, so a future additional policy (e.g. a
-- narrower service-role grant) is never silently removed by replaying this migration. No
-- anon/authenticated-other-user/public policy exists anywhere in this file; the only access path
-- for a row is `auth.uid() = user_id`, and the only bypass is the service_role key (which
-- bypasses RLS by Postgres/Supabase design and is never exposed to the browser) for the future
-- trusted server-side matcher.
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can manage own saved searches" ON public.saved_searches;

CREATE POLICY "User can manage own saved searches" ON public.saved_searches
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON COLUMN public.saved_searches.category IS
  'Required, non-empty for normalized rows (see saved_searches_category_nonempty_chk). No '
  'column DEFAULT — every insert must supply a real category. A preserved legacy row from '
  'before this migration may still hold '''' if that is what it already contained; it is never '
  'rewritten to a fabricated value, only left as pre-normalization until re-saved.';

COMMENT ON COLUMN public.saved_searches.fingerprint IS
  'Deterministic hash of the full canonical search (category, city, min_price, max_price, '
  'filter_payload — plus any future first-class matching field). Computed by Saved Search 02 '
  'application logic, not by the database. Legacy/pre-normalization rows carry a '
  '`legacy:<id>` compatibility placeholder until re-saved.';

COMMENT ON COLUMN public.saved_searches.filter_payload IS
  'Structured marketplace filter facets beyond category/city/min_price/max_price — same '
  'flexible-JSON convention as listings.detail_pairs. Defaults to empty object; never fabricated.';

COMMENT ON TABLE public.saved_searches IS
  'Saved Search V1 (normalized). Distinct from saved_listings (favorites) — untouched by this '
  'migration. Owner-scoped via RLS (auth.uid() = user_id); no anon/public policy. A pre-existing '
  'legacy `query` text column (from 20250313000002_saved_searches.sql), if present in this '
  'environment, is intentionally left in place, untouched and deprecated — never dropped here.';

-- Final post-reconciliation certification — runs AFTER every CREATE/ADD COLUMN/ALTER statement
-- above. `ADD COLUMN IF NOT EXISTS` only reconciles column *existence*: if an unexpected
-- environment already had, say, a `filter_payload text` column (wrong type) or an
-- already-nullable `is_active`, every ADD COLUMN statement above would have silently no-op'd
-- against it, leaving the wrong shape in place undetected. This block is the migration's actual
-- proof that the table is in the exact intended final shape — not an assumption. It fails closed
-- (RAISE EXCEPTION) rather than ever silently casting or accepting an incompatible column, for
-- all eleven canonical V1 columns, regardless of whether each one came from this migration's own
-- CREATE TABLE / ADD COLUMN statements or was somehow already present with the right name.
DO $$
DECLARE
  r record;
  v_type text;
  v_nullable text;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('id', 'uuid', true),
      ('user_id', 'uuid', true),
      ('category', 'text', true),
      ('city', 'text', true),
      ('min_price', 'integer', false),
      ('max_price', 'integer', false),
      ('filter_payload', 'jsonb', true),
      ('fingerprint', 'text', true),
      ('is_active', 'boolean', true),
      ('created_at', 'timestamp with time zone', true),
      ('updated_at', 'timestamp with time zone', true)
    ) AS expected(col_name, expected_type, must_be_not_null)
  LOOP
    SELECT data_type, is_nullable INTO v_type, v_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_searches' AND column_name = r.col_name;

    IF v_type IS NULL THEN
      RAISE EXCEPTION 'saved_searches post-reconciliation certification: column % is missing after reconciliation — refusing to proceed.', r.col_name;
    ELSIF v_type <> r.expected_type THEN
      RAISE EXCEPTION 'saved_searches post-reconciliation certification: column % is type % (expected %) — an unexpected incompatible column already occupied this name; refusing to silently cast or proceed.', r.col_name, v_type, r.expected_type;
    ELSIF r.must_be_not_null AND v_nullable <> 'NO' THEN
      RAISE EXCEPTION 'saved_searches post-reconciliation certification: column % must be NOT NULL but is nullable — refusing to proceed.', r.col_name;
    END IF;
  END LOOP;
  -- min_price / max_price are intentionally NOT checked for NOT NULL above (must_be_not_null =
  -- false) — an absent price bound is truthful "no bound" search semantics, same reasoning as
  -- city's empty-string sentinel; nullable is the correct, intended final state for both.
END $$;
