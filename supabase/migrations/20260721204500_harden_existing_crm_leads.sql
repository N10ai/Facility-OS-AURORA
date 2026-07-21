alter table public.leads add column if not exists industry text;
alter table public.leads add column if not exists facility_count integer not null default 1 check (facility_count >= 0);
alter table public.leads add column if not exists created_by uuid references public.profiles(id) on delete set null;

update public.leads set stage='new' where stage is null;
alter table public.leads alter column stage set default 'new';
alter table public.leads alter column stage set not null;

create index if not exists leads_company_stage_idx on public.leads(company_id,stage);
create index if not exists leads_company_follow_up_idx on public.leads(company_id,next_follow_up);

alter table public.leads enable row level security;
drop policy if exists "leads company access" on public.leads;

create policy "staff view company leads" on public.leads
for select to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() = any(array['owner','admin','manager','account_manager']));

create policy "staff create company leads" on public.leads
for insert to authenticated
with check (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() = any(array['owner','admin','manager','account_manager']));

create policy "staff update company leads" on public.leads
for update to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() = any(array['owner','admin','manager','account_manager']))
with check (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() = any(array['owner','admin','manager','account_manager']));

create policy "leaders delete company leads" on public.leads
for delete to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() = any(array['owner','admin']));

create or replace function public.set_leads_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at before update on public.leads for each row execute function public.set_leads_updated_at();
revoke all on function public.set_leads_updated_at() from public, anon;
grant execute on function public.set_leads_updated_at() to authenticated, service_role;