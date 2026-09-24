-- Iglesias Gate 16 — additive support for custom/free-text church languages beyond
-- the canonical es/en/bilingual set. Does not change the existing `languages` column,
-- its check constraint, or any RLS policy: `churches` is already `grant select ... to
-- anon, authenticated` at the table level, so a new column is public-readable exactly
-- like every other church column without any additional grant.

alter table public.churches
  add column if not exists other_languages text[] not null default '{}'::text[];

comment on column public.churches.other_languages is
  'Free-text additional languages the church offers (e.g. Vietnamese, Tagalog), beyond the'
  ' canonical es/en/bilingual set used for search filtering. Display-only, never filtered on.';

alter table public.churches
  add constraint churches_other_languages_bounded
    check (cardinality(other_languages) <= 8);
