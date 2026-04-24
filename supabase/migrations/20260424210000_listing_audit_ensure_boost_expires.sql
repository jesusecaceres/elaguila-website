-- Fixes UPDATE failures when `listings.boost_expires` was never added but the audit
-- trigger (20260423180000) references OLD.boost_expires ("record old has no field").
-- Uses JSON extraction so missing columns behave as NULL; still adds column when absent.

alter table public.listings add column if not exists boost_expires timestamptz null;

create or replace function public.log_listing_lifecycle_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  act text;
  meta jsonb;
  st_old text;
  st_new text;
  old_boost jsonb;
  new_boost jsonb;
begin
  uid := auth.uid();

  if tg_op = 'INSERT' then
    meta := jsonb_build_object(
      'category', NEW.category,
      'status', NEW.status,
      'is_published', NEW.is_published
    );
    insert into public.listing_audit_event (listing_id, actor_user_id, action, meta)
    values (NEW.id, uid, 'listing_created', meta);
    return NEW;
  end if;

  if tg_op = 'UPDATE' then
    old_boost := to_jsonb(OLD) -> 'boost_expires';
    new_boost := to_jsonb(NEW) -> 'boost_expires';

    if OLD.status is not distinct from NEW.status
       and OLD.is_published is not distinct from NEW.is_published
       and old_boost is not distinct from new_boost then
      return NEW;
    end if;

    st_old := lower(coalesce(OLD.status, ''));
    st_new := lower(coalesce(NEW.status, ''));

    act := 'listing_lifecycle_changed';
    if st_new = 'removed' and st_old is distinct from 'removed' then
      act := 'listing_status_removed';
    elsif (NEW.is_published = false or st_new = 'unpublished')
          and (OLD.is_published is distinct from NEW.is_published or OLD.status is distinct from NEW.status) then
      act := 'listing_unpublished';
    elsif NEW.is_published = true and (OLD.is_published = false or OLD.is_published is null) then
      act := 'listing_published';
    elsif st_new = 'sold' and st_old is distinct from 'sold' then
      act := 'listing_marked_sold';
    elsif old_boost is distinct from new_boost then
      act := 'listing_boost_changed';
    end if;

    meta := jsonb_build_object(
      'before', jsonb_build_object(
        'status', OLD.status,
        'is_published', OLD.is_published,
        'boost_expires', old_boost
      ),
      'after', jsonb_build_object(
        'status', NEW.status,
        'is_published', NEW.is_published,
        'boost_expires', new_boost
      )
    );

    insert into public.listing_audit_event (listing_id, actor_user_id, action, meta)
    values (NEW.id, uid, act, meta);
  end if;

  return NEW;
end;
$$;
