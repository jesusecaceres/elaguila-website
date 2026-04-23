-- Leonix-tracked public inquiries for approved Viajes staged listings (buyer → listing owner context).

create table if not exists public.viajes_public_inquiries (
  id uuid primary key default gen_random_uuid(),
  staged_listing_id uuid not null
    references public.viajes_staged_listings (id) on delete cascade,
  buyer_user_id uuid references auth.users (id) on delete set null,
  buyer_name text not null,
  buyer_email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint viajes_public_inquiries_message_len check (char_length(message) between 1 and 4000)
);

create index if not exists viajes_public_inquiries_listing_idx
  on public.viajes_public_inquiries (staged_listing_id, created_at desc);

comment on table public.viajes_public_inquiries is
  'Buyer inquiries against published Viajes staged listings; inserts via Next.js service role API.';

alter table public.viajes_public_inquiries enable row level security;

-- Listing owners can read inquiries for their own listings (dashboard / inbox patterns).
create policy "viajes_inquiries_select_owner"
  on public.viajes_public_inquiries
  for select
  using (
    exists (
      select 1
      from public.viajes_staged_listings v
      where v.id = viajes_public_inquiries.staged_listing_id
        and v.owner_user_id is not null
        and v.owner_user_id = auth.uid()
    )
  );

-- No anon/authenticated insert/delete/update — API uses service role.
