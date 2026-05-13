-- Run in Supabase SQL Editor (or psql) against the project that serves production Rentas.
-- 1) Exact definition of description_len_check
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'listings'
  and conname = 'description_len_check';

-- 2) All CHECK constraints on public.listings
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'listings'
  and contype = 'c'
order by conname;
