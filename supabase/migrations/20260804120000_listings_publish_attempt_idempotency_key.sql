-- Globalization Package A Gate 3 — quick-listing publish idempotency key.
--
-- Closes the ledger's long-open concurrent double-submit race (En Venta / Busco / Clases /
-- Comunidad / Mascotas): two truly simultaneous submit clicks could both reach the INSERT
-- branch before either round-tripped a row id, creating two rows. The client-side session
-- heuristic (quickListingIdempotency.ts, I.6B) only protected retry/refresh of an
-- already-known row — it explicitly did not claim concurrency safety.
--
-- Mechanism: the publisher stamps each logical submission with a session-stable attempt key
-- (client-generated UUID, persisted per category in sessionStorage). Two racing inserts carry
-- the SAME key; the partial unique index below rejects the second with 23505, and the client
-- recovers by fetching its own row by key (owner-scoped) instead of creating a duplicate.
--
-- Additive and idempotent: nullable column, partial unique index (nulls unaffected), no
-- backfill, no destructive DDL. Rows published by older clients (key absent) behave exactly
-- as before.

alter table public.listings
  add column if not exists publish_attempt_key text;

create unique index if not exists listings_owner_publish_attempt_key_uidx
  on public.listings (owner_id, publish_attempt_key)
  where publish_attempt_key is not null;

comment on column public.listings.publish_attempt_key is
  'Globalization Package A Gate 3: client-generated per-submission idempotency key; unique per owner via listings_owner_publish_attempt_key_uidx. Nullable — legacy clients omit it.';
