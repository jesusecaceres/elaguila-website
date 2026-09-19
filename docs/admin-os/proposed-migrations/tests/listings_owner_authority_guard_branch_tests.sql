-- =====================================================================================================
-- BRANCH-DATABASE TEST for 20260920122000_listings_owner_authority_guard.sql.
-- RUN ONLY ON A SUPABASE BRANCH / THROWAWAY COPY, never on production. Everything runs in ONE transaction that ends
-- with ROLLBACK, so nothing persists even on a branch. Run as the `postgres` role (SQL editor / psql), AFTER applying
-- the guard migration to that branch.
--
-- Method: rows are created as postgres (guard bypassed), then `set local role authenticated` + a JWT `sub` claim is set so
-- auth.uid() = the row owner and the guard sees current_user = 'authenticated'. Each check prints `PASS [label]` or raises
-- `TEST FAILED [label]` (aborting the transaction). Expected values: OK = statement succeeded and changed >= 1 row,
-- 42501 = rejected by the guard, ZERO_ROWS = RLS filtered the row.
-- ARCHIVE switch: the guard ships with c_owner_may_archive = false (owners never write INTO 'removed'). If you flip it to true for the
-- Stage-1 interim, run the session with   set leonix.test_owner_may_archive = 'on';   so the archive expectations flip to OK.
-- =====================================================================================================
begin;

create or replace function public._t_expect(p_label text, p_sql text, p_expect text) returns void
language plpgsql as $$
declare
  v_got text := 'OK';
  v_rows int;
begin
  begin
    execute p_sql;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then v_got := 'ZERO_ROWS'; end if;
  exception when others then
    v_got := sqlstate;
  end;
  if v_got is distinct from p_expect then
    raise exception 'TEST FAILED [%]: expected %, got % -- %', p_label, p_expect, v_got, p_sql;
  end if;
  raise notice 'PASS [%] -> %', p_label, v_got;
end
$$;
grant execute on function public._t_expect(text, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------- fixtures (as postgres: guard is bypassed) ------------
-- owner U1 = b0000000-0000-0000-0000-000000000001
insert into public.listings (id, owner_id, category, status, is_published, is_free, title, description, published_at, expires_at) values
 -- paid lane
 ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','rentas','pending', false,false,'Rentas pending row','Descripcion suficientemente larga para el check',null,null),
 ('a0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','rentas','active',  true, false,'Rentas active row', 'Descripcion suficientemente larga para el check',now()-interval '5 days',now()+interval '20 days'),
 ('a0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001','rentas','paused',  false,false,'Rentas paused row', 'Descripcion suficientemente larga para el check',now()-interval '5 days',now()+interval '20 days'),
 ('a0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000001','rentas','flagged', false,false,'Rentas flagged row','Descripcion suficientemente larga para el check',now()-interval '5 days',now()+interval '20 days'),
 ('a0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000001','rentas','removed', false,false,'Rentas removed row','Descripcion suficientemente larga para el check',now()-interval '5 days',now()+interval '20 days'),
 ('a0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000001','bienes-raices','pending',false,false,'BR pending row','Descripcion suficientemente larga para el check',now(),null),
 ('a0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000001','rentas','pending', false,false,'Rentas pending row 2','Descripcion suficientemente larga para el check',null,null),
 ('a0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000001','rentas','active',  true, false,'Rentas active row 2','Descripcion suficientemente larga para el check',now()-interval '5 days',now()+interval '20 days'),
 ('a0000000-0000-0000-0000-000000000009','b0000000-0000-0000-0000-000000000001','rentas','sold',    false,false,'Rentas sold row',   'Descripcion suficientemente larga para el check',now()-interval '5 days',now()+interval '20 days'),
 -- clases
 ('a0000000-0000-0000-0000-000000000010','b0000000-0000-0000-0000-000000000001','clases','pending',false,false,'Clases paid pending','Descripcion suficientemente larga para el check',null,null),
 ('a0000000-0000-0000-0000-000000000011','b0000000-0000-0000-0000-000000000001','clases','draft',  false,true, 'Clases free draft',  'Descripcion suficientemente larga para el check',null,null),
 ('a0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000001','clases','pending',false,false,'Clases paid pending 2','Descripcion suficientemente larga para el check',null,null),
 -- free lane
 ('a0000000-0000-0000-0000-000000000020','b0000000-0000-0000-0000-000000000001','en-venta','draft',  false,false,'En Venta draft',  'Descripcion suficientemente larga para el check',null,null),
 ('a0000000-0000-0000-0000-000000000021','b0000000-0000-0000-0000-000000000001','en-venta','active', true, false,'En Venta active', 'Descripcion suficientemente larga para el check',now(),null),
 ('a0000000-0000-0000-0000-000000000022','b0000000-0000-0000-0000-000000000001','en-venta','flagged',false,false,'En Venta flagged','Descripcion suficientemente larga para el check',now(),null),
 ('a0000000-0000-0000-0000-000000000023','b0000000-0000-0000-0000-000000000001','en-venta','removed',false,false,'En Venta removed','Descripcion suficientemente larga para el check',now(),null),
 ('a0000000-0000-0000-0000-000000000024','b0000000-0000-0000-0000-000000000001','en-venta','active', false,false,'En Venta active hidden','Descripcion suficientemente larga para el check',now(),null),
 ('a0000000-0000-0000-0000-000000000025','b0000000-0000-0000-0000-000000000001','busco','draft',    false,true, 'Busco draft',    'Descripcion suficientemente larga para el check',null,null),
 ('a0000000-0000-0000-0000-000000000026','b0000000-0000-0000-0000-000000000001','en-venta','sold',   true, false,'En Venta sold',   'Descripcion suficientemente larga para el check',now(),null),
 -- staff-held / server-owned terminal states (incident: SALE-2026-000067 = flagged -> removed by staff -> sold by the owner)
 ('a0000000-0000-0000-0000-000000000027','b0000000-0000-0000-0000-000000000001','en-venta','expired', false,false,'En Venta expired','Descripcion suficientemente larga para el check',now(),null),
 ('a0000000-0000-0000-0000-000000000028','b0000000-0000-0000-0000-000000000001','rentas','expired',   false,false,'Rentas expired',  'Descripcion suficientemente larga para el check',now()-interval '40 days',now()-interval '10 days'),
 ('a0000000-0000-0000-0000-000000000029','b0000000-0000-0000-0000-000000000001','en-venta','rejected',false,false,'En Venta rejected','Descripcion suficientemente larga para el check',null,null),
 ('a0000000-0000-0000-0000-00000000002a','b0000000-0000-0000-0000-000000000001','bienes-raices','suspended',false,false,'BR suspended payment','Descripcion suficientemente larga para el check',now(),null),
 ('a0000000-0000-0000-0000-00000000002b','b0000000-0000-0000-0000-000000000001','en-venta','removed', false,false,'En Venta staff removed','Descripcion suficientemente larga para el check',now(),null),
 ('a0000000-0000-0000-0000-00000000002c','b0000000-0000-0000-0000-000000000001','en-venta','active',  true, false,'En Venta active b','Descripcion suficientemente larga para el check',now(),null),
 ('a0000000-0000-0000-0000-00000000002d','b0000000-0000-0000-0000-000000000001','en-venta','active',  true, false,'En Venta active c','Descripcion suficientemente larga para el check',now(),null),
 ('a0000000-0000-0000-0000-00000000002e','b0000000-0000-0000-0000-000000000001','rentas','active',  true, false,'Rentas active c','Descripcion suficientemente larga para el check',now()-interval '2 days',now()+interval '28 days');

-- ---------------------------------------------------------------- owner (authenticated) -------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- ===== PAID LANE: Rentas / Bienes / paid Clases ==========================================================================
select public._t_expect('rentas pending -> active BLOCKED',        $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000001'$q$, '42501');
select public._t_expect('rentas pending -> paused BLOCKED',        $q$update public.listings set status='paused' where id='a0000000-0000-0000-0000-000000000001'$q$, '42501');
select public._t_expect('rentas pending -> sold BLOCKED',          $q$update public.listings set status='sold' where id='a0000000-0000-0000-0000-000000000001'$q$, '42501');
select public._t_expect('rentas pending -> draft BLOCKED',         $q$update public.listings set status='draft' where id='a0000000-0000-0000-0000-000000000001'$q$, '42501');
select public._t_expect('rentas pending is_published=true (status kept) BLOCKED', $q$update public.listings set is_published=true where id='a0000000-0000-0000-0000-000000000001'$q$, '42501');
select public._t_expect('rentas pending content edit OK',          $q$update public.listings set title='Rentas pending edited' where id='a0000000-0000-0000-0000-000000000001'$q$, 'OK');
select public._t_expect('rentas pending expires_at write BLOCKED', $q$update public.listings set expires_at=now()+interval '99 days' where id='a0000000-0000-0000-0000-000000000001'$q$, '42501');
select public._t_expect('bienes-raices pending -> active BLOCKED', $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000006'$q$, '42501');
select public._t_expect('rentas pending -> removed (owner archive; BLOCKED unless c_owner_may_archive)', $q$update public.listings set status='removed', is_published=false where id='a0000000-0000-0000-0000-000000000007'$q$, case when coalesce(current_setting('leonix.test_owner_may_archive', true), 'off') = 'on' then 'OK' else '42501' end);
select public._t_expect('rentas removed -> active BLOCKED',        $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000007'$q$, '42501');

select public._t_expect('rentas active -> paused OK',              $q$update public.listings set status='paused', is_published=false where id='a0000000-0000-0000-0000-000000000002'$q$, 'OK');
select public._t_expect('rentas paused -> active resume OK',       $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000002'$q$, 'OK');
select public._t_expect('rentas paused (fixture) -> active OK',    $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000003'$q$, 'OK');
select public._t_expect('rentas active -> sold OK',                $q$update public.listings set status='sold' where id='a0000000-0000-0000-0000-000000000008'$q$, 'OK');
select public._t_expect('rentas sold -> active (relist within paid term) OK', $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000009'$q$, 'OK');
select public._t_expect('rentas active expires_at = null BLOCKED', $q$update public.listings set expires_at=null where id='a0000000-0000-0000-0000-000000000002'$q$, '42501');
select public._t_expect('rentas active expires_at = 2099 BLOCKED', $q$update public.listings set expires_at='2099-01-01' where id='a0000000-0000-0000-0000-000000000002'$q$, '42501');
select public._t_expect('rentas republish bookkeeping OK',         $q$update public.listings set republished_at=now(), republish_count=1, last_republished_source='dashboard' where id='a0000000-0000-0000-0000-000000000002'$q$, 'OK');
select public._t_expect('rentas category change BLOCKED',          $q$update public.listings set category='en-venta' where id='a0000000-0000-0000-0000-000000000002'$q$, '42501');

select public._t_expect('rentas flagged -> active BLOCKED (staff hold)', $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000004'$q$, '42501');
select public._t_expect('rentas flagged -> removed BLOCKED',       $q$update public.listings set status='removed' where id='a0000000-0000-0000-0000-000000000004'$q$, '42501');
select public._t_expect('rentas flagged -> paused BLOCKED',        $q$update public.listings set status='paused' where id='a0000000-0000-0000-0000-000000000004'$q$, '42501');
select public._t_expect('rentas removed -> draft BLOCKED',         $q$update public.listings set status='draft' where id='a0000000-0000-0000-0000-000000000005'$q$, '42501');
select public._t_expect('rentas removed -> pending BLOCKED (removed is terminal for owners)', $q$update public.listings set status='pending' where id='a0000000-0000-0000-0000-000000000005'$q$, '42501');

select public._t_expect('staff flag admin_promoted BLOCKED',       $q$update public.listings set admin_promoted=true where id='a0000000-0000-0000-0000-000000000002'$q$, '42501');
select public._t_expect('staff flag leonix_verified BLOCKED',      $q$update public.listings set leonix_verified=true where id='a0000000-0000-0000-0000-000000000002'$q$, '42501');
select public._t_expect('staff flag boost_until BLOCKED',          $q$update public.listings set boost_until=now()+interval '30 days' where id='a0000000-0000-0000-0000-000000000002'$q$, '42501');
select public._t_expect('staff flag suspended_reason BLOCKED',     $q$update public.listings set suspended_reason='x' where id='a0000000-0000-0000-0000-000000000002'$q$, '42501');
select public._t_expect('staff flag republish_override BLOCKED',   $q$update public.listings set republish_override=true where id='a0000000-0000-0000-0000-000000000002'$q$, '42501');

-- INSERTs (paid lane)
select public._t_expect('rentas INSERT pending OK',                $q$insert into public.listings (owner_id,category,status,is_published,title,description) values ('b0000000-0000-0000-0000-000000000001','rentas','pending',false,'Nuevo rentas pend','Descripcion suficientemente larga para el check')$q$, 'OK');
select public._t_expect('rentas INSERT active BLOCKED',            $q$insert into public.listings (owner_id,category,status,is_published,title,description) values ('b0000000-0000-0000-0000-000000000001','rentas','active',true,'Nuevo rentas act','Descripcion suficientemente larga para el check')$q$, '42501');
select public._t_expect('rentas INSERT with omitted status (default active) BLOCKED', $q$insert into public.listings (owner_id,category,title,description) values ('b0000000-0000-0000-0000-000000000001','rentas','Nuevo rentas def','Descripcion suficientemente larga para el check')$q$, '42501');
select public._t_expect('rentas INSERT pending + expires_at BLOCKED', $q$insert into public.listings (owner_id,category,status,is_published,expires_at,title,description) values ('b0000000-0000-0000-0000-000000000001','rentas','pending',false,now()+interval '30 days','Nuevo rentas exp','Descripcion suficientemente larga para el check')$q$, '42501');
select public._t_expect('rentas INSERT admin_promoted BLOCKED',    $q$insert into public.listings (owner_id,category,status,is_published,admin_promoted,title,description) values ('b0000000-0000-0000-0000-000000000001','rentas','pending',false,true,'Nuevo rentas adm','Descripcion suficientemente larga para el check')$q$, '42501');
select public._t_expect('bienes-raices INSERT pending OK',         $q$insert into public.listings (owner_id,category,status,is_published,seller_type,title,description) values ('b0000000-0000-0000-0000-000000000001','bienes-raices','pending',false,'business','Nuevo BR pending','Descripcion suficientemente larga para el check')$q$, 'OK');
select public._t_expect('unknown category INSERT active BLOCKED (fail closed)', $q$insert into public.listings (owner_id,category,status,is_published,title,description) values ('b0000000-0000-0000-0000-000000000001','mystery','active',true,'Nuevo mystery','Descripcion suficientemente larga para el check')$q$, '42501');

-- ===== CLASES: free vs paid ==============================================================================================
select public._t_expect('clases PAID pending -> active BLOCKED',   $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000010'$q$, '42501');
select public._t_expect('clases PAID pending re-declared free BLOCKED', $q$update public.listings set is_free=true where id='a0000000-0000-0000-0000-000000000010'$q$, '42501');
select public._t_expect('clases PAID pending -> draft BLOCKED',    $q$update public.listings set status='draft' where id='a0000000-0000-0000-0000-000000000012'$q$, '42501');
select public._t_expect('clases PAID pending content edit OK',     $q$update public.listings set title='Clases paid edited' where id='a0000000-0000-0000-0000-000000000010'$q$, 'OK');
select public._t_expect('clases FREE draft -> active OK',          $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000011'$q$, 'OK');
select public._t_expect('clases INSERT free draft OK',             $q$insert into public.listings (owner_id,category,status,is_published,is_free,title,description) values ('b0000000-0000-0000-0000-000000000001','clases','draft',false,true,'Nueva clase gratis','Descripcion suficientemente larga para el check')$q$, 'OK');
select public._t_expect('clases INSERT paid pending OK',           $q$insert into public.listings (owner_id,category,status,is_published,is_free,title,description) values ('b0000000-0000-0000-0000-000000000001','clases','pending',false,false,'Nueva clase pagada','Descripcion suficientemente larga para el check')$q$, 'OK');
select public._t_expect('clases INSERT paid ACTIVE BLOCKED',       $q$insert into public.listings (owner_id,category,status,is_published,is_free,title,description) values ('b0000000-0000-0000-0000-000000000001','clases','active',true,false,'Nueva clase act','Descripcion suficientemente larga para el check')$q$, '42501');

-- ===== FREE LANE: En Venta / Busco / Comunidad / Mascotas ================================================================
select public._t_expect('en-venta draft -> active OK',             $q$update public.listings set status='active', is_published=true, published_at=now() where id='a0000000-0000-0000-0000-000000000020'$q$, 'OK');
select public._t_expect('en-venta active -> paused OK',            $q$update public.listings set status='paused', is_published=false where id='a0000000-0000-0000-0000-000000000021'$q$, 'OK');
select public._t_expect('en-venta paused -> active OK',            $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000021'$q$, 'OK');
select public._t_expect('en-venta active -> sold (is_published untouched) OK', $q$update public.listings set status='sold' where id='a0000000-0000-0000-0000-000000000021'$q$, 'OK');
select public._t_expect('en-venta sold -> active relist OK',       $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000021'$q$, 'OK');
select public._t_expect('en-venta sold(fixture) -> active OK',     $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000026'$q$, 'OK');
select public._t_expect('en-venta flagged -> active BLOCKED',      $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000022'$q$, '42501');
select public._t_expect('en-venta flagged -> removed BLOCKED',     $q$update public.listings set status='removed' where id='a0000000-0000-0000-0000-000000000022'$q$, '42501');
select public._t_expect('en-venta flagged -> draft BLOCKED',       $q$update public.listings set status='draft' where id='a0000000-0000-0000-0000-000000000022'$q$, '42501');
select public._t_expect('en-venta flagged is_published=true BLOCKED', $q$update public.listings set is_published=true where id='a0000000-0000-0000-0000-000000000022'$q$, '42501');
select public._t_expect('en-venta removed -> active BLOCKED',      $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000023'$q$, '42501');
select public._t_expect('en-venta removed -> draft BLOCKED (removed is terminal for owners)', $q$update public.listings set status='draft', is_published=false where id='a0000000-0000-0000-0000-000000000023'$q$, '42501');
select public._t_expect('en-venta removed (still) -> active BLOCKED', $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000023'$q$, '42501');
select public._t_expect('en-venta active(hidden) is_published false->true OK', $q$update public.listings set is_published=true where id='a0000000-0000-0000-0000-000000000024'$q$, 'OK');
select public._t_expect('busco draft -> active OK',                $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000025'$q$, 'OK');
select public._t_expect('en-venta status -> pending BLOCKED',      $q$update public.listings set status='pending' where id='a0000000-0000-0000-0000-000000000021'$q$, '42501');
select public._t_expect('en-venta staff flag BLOCKED',             $q$update public.listings set admin_promoted=true where id='a0000000-0000-0000-0000-000000000021'$q$, '42501');
select public._t_expect('en-venta INSERT draft OK',                $q$insert into public.listings (owner_id,category,status,is_published,title,description) values ('b0000000-0000-0000-0000-000000000001','en-venta','draft',false,'Nuevo en venta d','Descripcion suficientemente larga para el check')$q$, 'OK');
select public._t_expect('en-venta INSERT pending BLOCKED',         $q$insert into public.listings (owner_id,category,status,is_published,title,description) values ('b0000000-0000-0000-0000-000000000001','en-venta','pending',false,'Nuevo en venta p','Descripcion suficientemente larga para el check')$q$, '42501');
select public._t_expect('mascotas INSERT draft OK',                $q$insert into public.listings (owner_id,category,status,is_published,is_free,title,description) values ('b0000000-0000-0000-0000-000000000001','mascotas-y-perdidos','draft',false,true,'Nueva mascota','Descripcion suficientemente larga para el check')$q$, 'OK');

-- ===== STAFF-HELD / TERMINAL STATES ARE TERMINAL FOR OWNERS (incident SALE-2026-000067: removed -> sold by the owner) ==========
select public._t_expect('INCIDENT removed -> sold BLOCKED', $q$update public.listings set status='sold' where id='a0000000-0000-0000-0000-00000000002b'$q$, '42501');
select public._t_expect('INCIDENT removed -> sold (+is_published) BLOCKED', $q$update public.listings set status='sold', is_published=false where id='a0000000-0000-0000-0000-00000000002b'$q$, '42501');
select public._t_expect('INCIDENT removed -> active BLOCKED', $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-00000000002b'$q$, '42501');
select public._t_expect('INCIDENT removed -> paused BLOCKED', $q$update public.listings set status='paused' where id='a0000000-0000-0000-0000-00000000002b'$q$, '42501');
select public._t_expect('INCIDENT removed -> draft BLOCKED', $q$update public.listings set status='draft' where id='a0000000-0000-0000-0000-00000000002b'$q$, '42501');
select public._t_expect('removed content edit (status unchanged) OK', $q$update public.listings set title='En Venta staff removed edit' where id='a0000000-0000-0000-0000-00000000002b'$q$, 'OK');
select public._t_expect('expired (free) -> active BLOCKED', $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000027'$q$, '42501');
select public._t_expect('expired (paid Rentas) -> active BLOCKED', $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000028'$q$, '42501');
select public._t_expect('expired (paid Rentas) -> paused BLOCKED', $q$update public.listings set status='paused' where id='a0000000-0000-0000-0000-000000000028'$q$, '42501');
select public._t_expect('rejected -> draft BLOCKED', $q$update public.listings set status='draft' where id='a0000000-0000-0000-0000-000000000029'$q$, '42501');
select public._t_expect('rejected -> active BLOCKED', $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000029'$q$, '42501');
select public._t_expect('suspended (payment engine) -> active BLOCKED', $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-00000000002a'$q$, '42501');
select public._t_expect('suspended (payment engine) -> paused BLOCKED', $q$update public.listings set status='paused' where id='a0000000-0000-0000-0000-00000000002a'$q$, '42501');
select public._t_expect('suspended -> removed BLOCKED', $q$update public.listings set status='removed' where id='a0000000-0000-0000-0000-00000000002a'$q$, '42501');
-- never INTO a staff / server-owned status
select public._t_expect('active -> flagged BLOCKED (owner self-flag)', $q$update public.listings set status='flagged', is_published=false where id='a0000000-0000-0000-0000-00000000002c'$q$, '42501');
select public._t_expect('active -> suspended BLOCKED', $q$update public.listings set status='suspended' where id='a0000000-0000-0000-0000-00000000002c'$q$, '42501');
select public._t_expect('active -> expired BLOCKED', $q$update public.listings set status='expired' where id='a0000000-0000-0000-0000-00000000002c'$q$, '42501');
select public._t_expect('active -> rejected BLOCKED', $q$update public.listings set status='rejected' where id='a0000000-0000-0000-0000-00000000002c'$q$, '42501');
select public._t_expect('free active -> removed (owner archive; BLOCKED unless c_owner_may_archive)', $q$update public.listings set status='removed', is_published=false where id='a0000000-0000-0000-0000-00000000002d'$q$, case when coalesce(current_setting('leonix.test_owner_may_archive', true), 'off') = 'on' then 'OK' else '42501' end);
select public._t_expect('paid active -> removed (owner archive; BLOCKED unless c_owner_may_archive)', $q$update public.listings set status='removed', is_published=false where id='a0000000-0000-0000-0000-00000000002e'$q$, case when coalesce(current_setting('leonix.test_owner_may_archive', true), 'off') = 'on' then 'OK' else '42501' end);
select public._t_expect('status -> NULL BLOCKED', $q$update public.listings set status=null where id='a0000000-0000-0000-0000-00000000002c'$q$, '42501');
select public._t_expect('INSERT with status removed BLOCKED', $q$insert into public.listings (owner_id,category,status,is_published,title,description) values ('b0000000-0000-0000-0000-000000000001','en-venta','removed',false,'Nuevo removed','Descripcion suficientemente larga para el check')$q$, '42501');
select public._t_expect('INSERT with status flagged BLOCKED', $q$insert into public.listings (owner_id,category,status,is_published,title,description) values ('b0000000-0000-0000-0000-000000000001','en-venta','flagged',false,'Nuevo flagged','Descripcion suficientemente larga para el check')$q$, '42501');

-- ===== another owner (RLS) ================================================================================================
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select public._t_expect('other owner cannot touch row (RLS zero rows)', $q$update public.listings set title='hijack title' where id='a0000000-0000-0000-0000-000000000021'$q$, 'ZERO_ROWS');

-- ===== server roles are NOT restricted ====================================================================================
reset role;
set local role service_role;
select public._t_expect('service_role rentas pending -> active OK',   $q$update public.listings set status='active', is_published=true, published_at=now(), expires_at=now()+interval '30 days' where id='a0000000-0000-0000-0000-000000000006'$q$, 'OK');
select public._t_expect('service_role flagged -> active OK',          $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000004'$q$, 'OK');
select public._t_expect('service_role staff flags OK',                $q$update public.listings set admin_promoted=true, leonix_verified=true where id='a0000000-0000-0000-0000-000000000004'$q$, 'OK');
reset role;
select public._t_expect('postgres (SQL editor / definer) unrestricted OK', $q$update public.listings set status='active', is_published=true where id='a0000000-0000-0000-0000-000000000012'$q$, 'OK');

-- ===== SECURITY DEFINER capacity RPC path is unaffected by the guard (current_user = definer inside the function) =========
-- Fixture: a pending BR Negocio main row. Before migration 5 the RPC activates it; after migration 5 (no entitlement in this
-- fixture) it must answer blocked_reason = 'commercial_authority_required'. Either way the guard must NOT raise 42501.
insert into public.listings (id, owner_id, category, status, is_published, seller_type, inventory_role, title, description)
values ('a0000000-0000-0000-0000-000000000030','b0000000-0000-0000-0000-000000000001','bienes-raices','pending',false,'business','main','BR negocio rpc row','Descripcion suficientemente larga para el check');
do $t$
declare r record;
begin
  select * into r from public.br_negocio_activate_listing('a0000000-0000-0000-0000-000000000030','b0000000-0000-0000-0000-000000000001','pending');
  raise notice 'RPC result: activated=% blocked_reason=% (guard did not interfere)', r.activated, r.blocked_reason;
end
$t$;

drop function public._t_expect(text, text, text);
rollback;   -- nothing persists
