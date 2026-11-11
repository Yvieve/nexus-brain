set role authenticated;
do $$begin
 begin perform public.reserve_nexus_ai_call('00000000-0000-0000-0000-000000000001');raise exception 'employee quota RPC access allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
set role service_role;
do $$begin
 if not public.reserve_nexus_ai_call('00000000-0000-0000-0000-000000000001') then raise exception 'reservation failed';end if;
 if not public.reserve_nexus_ai_call('00000000-0000-0000-0000-000000000001') then raise exception 'reservation failed';end if;
 if not public.reserve_nexus_ai_call('00000000-0000-0000-0000-000000000001') then raise exception 'reservation failed';end if;
 if public.reserve_nexus_ai_call('00000000-0000-0000-0000-000000000001') then raise exception 'rate cap failed';end if;
end$$;
reset role;
insert into public.nexus_ai_calls(owner_id,created_at) select '00000000-0000-0000-0000-000000000002',now()-interval '1 day' from generate_series(1,57);
set role service_role;
do $$begin if public.reserve_nexus_ai_call('00000000-0000-0000-0000-000000000002') then raise exception 'global cap failed';end if;end$$;
reset role;
select 'PASS quota: employee RPC denied, 3/minute enforced, 60 total enforced' as result;
