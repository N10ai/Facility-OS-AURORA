create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  activity_type text not null default 'note' check (activity_type in ('note','call','email','meeting','status_change')),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  due_date date,
  status text not null default 'open' check (status in ('open','completed','cancelled')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_activities_lead_created_idx on public.lead_activities(lead_id, created_at desc);
create index if not exists lead_tasks_lead_status_idx on public.lead_tasks(lead_id, status, due_date);

alter table public.lead_activities enable row level security;
alter table public.lead_tasks enable row level security;

drop policy if exists "staff manage company lead activities" on public.lead_activities;
create policy "staff manage company lead activities" on public.lead_activities
for all to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() = any(array['owner','admin','manager','account_manager']))
with check (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() = any(array['owner','admin','manager','account_manager']));

drop policy if exists "staff manage company lead tasks" on public.lead_tasks;
create policy "staff manage company lead tasks" on public.lead_tasks
for all to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() = any(array['owner','admin','manager','account_manager']))
with check (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() = any(array['owner','admin','manager','account_manager']));

create or replace function public.set_lead_tasks_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists set_lead_tasks_updated_at on public.lead_tasks;
create trigger set_lead_tasks_updated_at before update on public.lead_tasks for each row execute function public.set_lead_tasks_updated_at();

revoke all on function public.set_lead_tasks_updated_at() from public, anon;
grant execute on function public.set_lead_tasks_updated_at() to authenticated, service_role;
