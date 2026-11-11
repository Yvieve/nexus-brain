\set ON_ERROR_STOP on
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
insert into public.personal_agents(id,name,department) values('10000000-0000-0000-0000-000000000001','A private','财务');
do $$begin if (select count(*) from public.personal_agents) <> 1 then raise exception 'owner read failed';end if;end$$;
update public.personal_agents set name='A revision2' where id='10000000-0000-0000-0000-000000000001' and revision=1;
do $$declare changed int;begin
 if (select revision from public.personal_agents limit 1) <> 2 then raise exception 'revision failed';end if;
 update public.personal_agents set name='stale overwrite' where id='10000000-0000-0000-0000-000000000001' and revision=1;
 get diagnostics changed = row_count;
 if changed <> 0 then raise exception 'stale revision overwrote data';end if;
end$$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$declare changed int;begin
 if (select count(*) from public.personal_agents) <> 0 then raise exception 'cross-user read leaked';end if;
 update public.personal_agents set name='attack' where id='10000000-0000-0000-0000-000000000001';get diagnostics changed = row_count;
 if changed<>0 then raise exception 'cross-user update succeeded';end if;
 delete from public.personal_agents where id='10000000-0000-0000-0000-000000000001';get diagnostics changed = row_count;
 if changed<>0 then raise exception 'cross-user delete succeeded';end if;
 begin
  insert into public.personal_agents(owner_id,name,department) values('00000000-0000-0000-0000-000000000001','spoof owner','财务');
  raise exception 'owner spoof unexpectedly allowed';
 exception when insufficient_privilege then null;end;
 begin
  insert into public.github_daily_digest(day,payload) values(current_date,'{}');
  raise exception 'employee could write shared digest';
 exception when insufficient_privilege then null;end;
end$$;
insert into public.personal_agents(name,department) values('B private','行政');
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
do $$declare changed int;begin
 if (select count(*) from public.personal_agents)<>1 then raise exception 'user A isolation lost';end if;
 begin
  update public.personal_agents set owner_id='00000000-0000-0000-0000-000000000002';
 exception when raise_exception or insufficient_privilege then null;end;
 if not exists(select 1 from public.personal_agents where owner_id=auth.uid()) then raise exception 'owner changed';end if;
 delete from public.personal_agents where owner_id=auth.uid();get diagnostics changed = row_count;
 if changed<>1 then raise exception 'own delete failed';end if;
end$$;
reset role;
set role anon;
do $$begin
 begin perform count(*) from public.personal_agents;raise exception 'anonymous read allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
set role service_role;
insert into public.github_daily_digest(day,payload) values(current_date,'{"departments":{}}');
reset role;
set role authenticated;
do $$begin if (select count(*) from public.github_daily_digest) <> 1 then raise exception 'authenticated digest read failed';end if;end$$;
reset role;
select 'PASS RLS: owner-only CRUD, spoof rejection, anonymous denial, optimistic revision, service-only digest writes and employee reads' as result;
