-- Aurora v3.12 contractor and vendor management
create table if not exists public.contractors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  business_name text not null,
  contact_name text,
  contractor_type text default 'cleaning',
  email text,
  phone text,
  service_area text,
  hourly_rate numeric default 0,
  minimum_charge numeric default 0,
  insurance_status text default 'unknown',
  insurance_expires_on date,
  w9_status text default 'missing',
  notes text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contractors enable row level security;
drop policy if exists "contractors authenticated access" on public.contractors;
create policy "contractors authenticated access" on public.contractors
for all to authenticated using (true) with check (true);
grant all on public.contractors to authenticated;
create index if not exists contractors_company_idx on public.contractors(company_id);
notify pgrst, 'reload schema';