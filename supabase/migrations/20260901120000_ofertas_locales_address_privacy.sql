-- Globalization Build A3 — Ofertas Locales address-privacy adoption (RED #9).
-- Forward-only shape change: one new boolean column, safe default, no data rewrite, no RLS
-- change. Mirrors the same shared privacy contract already shipped for Servicios/Restaurantes/
-- Comida Local/Bienes Raíces/Rentas (app/lib/businessAddress/businessAddressPrivacy.ts) — this
-- migration only adds Ofertas Locales' own durable column for the same decision.
--
-- DEFAULT true preserves current behavior for every existing row: the exact address on file was
-- always shown before this column existed, so no existing listing's already-public address is
-- silently hidden by this migration. Going forward the owner can explicitly opt out per listing.

begin;

alter table public.ofertas_locales
  add column if not exists show_exact_address boolean not null default true;

comment on column public.ofertas_locales.show_exact_address is
  'Owner''s explicit choice to reveal the exact street address publicly and allow an '
  'address-derived "get directions" link. Defaults to true so every row that predates this '
  'column keeps its already-public address visible; the owner can turn it off going forward. '
  'Never conflated with address verification — this only gates visibility of the address '
  'already on file, it does not verify or alter it.';

commit;
