-- Additive migration. Does not modify existing auth, resources, profiles or storage.
begin;
create table if not exists public.github_daily_digest (
  day date primary key,
  generated_at timestamptz not null default now(),
  payload jsonb not null check (jsonb_typeof(payload) = 'object')
);
alter table public.github_daily_digest enable row level security;
revoke all on public.github_daily_digest from anon, authenticated;
grant select on public.github_daily_digest to authenticated;
grant all on public.github_daily_digest to service_role;
drop policy if exists github_digest_read on public.github_daily_digest;
create policy github_digest_read on public.github_daily_digest for select to authenticated using (true);

create table if not exists public.personal_agents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  kind text not null default 'skill' check (kind in ('skill','agent')),
  department text not null check (length(department) between 1 and 80),
  status text not null default 'draft' check (status in ('draft','ready')),
  spec jsonb not null default '{}' check (jsonb_typeof(spec) = 'object'),
  messages jsonb not null default '[]' check (jsonb_typeof(messages) = 'array' and jsonb_array_length(messages) <= 300),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (octet_length(messages::text) + octet_length(spec::text) <= 500000)
);
create index if not exists personal_agents_owner_updated on public.personal_agents(owner_id, updated_at desc);
alter table public.personal_agents enable row level security;
revoke all on public.personal_agents from anon, authenticated;
grant select, insert, update, delete on public.personal_agents to authenticated;
grant all on public.personal_agents to service_role;
drop policy if exists personal_agents_select on public.personal_agents;
drop policy if exists personal_agents_insert on public.personal_agents;
drop policy if exists personal_agents_update on public.personal_agents;
drop policy if exists personal_agents_delete on public.personal_agents;
create policy personal_agents_select on public.personal_agents for select to authenticated using (owner_id = auth.uid());
create policy personal_agents_insert on public.personal_agents for insert to authenticated with check (owner_id = auth.uid());
create policy personal_agents_update on public.personal_agents for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy personal_agents_delete on public.personal_agents for delete to authenticated using (owner_id = auth.uid());
create or replace function public.nexus_personal_agent_revision() returns trigger language plpgsql set search_path = public as $$
begin
  if new.owner_id is distinct from old.owner_id then raise exception 'owner cannot change'; end if;
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists personal_agent_revision on public.personal_agents;
create trigger personal_agent_revision before update on public.personal_agents for each row execute function public.nexus_personal_agent_revision();
commit;
