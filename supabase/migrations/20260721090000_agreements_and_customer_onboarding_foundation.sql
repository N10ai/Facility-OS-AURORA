create table if not exists public.agreement_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  agreement_type text not null default 'janitorial_services',
  description text,
  body_template text not null default '',
  status text not null default 'active',
  is_default boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  template_id uuid references public.agreement_templates(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  agreement_number text not null,
  title text not null,
  agreement_type text not null default 'janitorial_services',
  body_content text not null default '',
  status text not null default 'draft',
  effective_date date,
  expiration_date date,
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  signer_name text,
  signer_email text,
  signature_data text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, agreement_number)
);

create table if not exists public.onboarding_checklists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,
  agreement_id uuid references public.agreements(id) on delete set null,
  title text not null default 'Customer onboarding',
  status text not null default 'not_started',
  progress integer not null default 0,
  target_start_date date,
  service_start_date date,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  onboarding_id uuid not null references public.onboarding_checklists(id) on delete cascade,
  item_key text not null,
  title text not null,
  category text not null default 'general',
  description text,
  status text not null default 'pending',
  required boolean not null default true,
  sort_order integer not null default 0,
  document_id uuid references public.documents(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(onboarding_id, item_key)
);

alter table public.documents
  add column if not exists customer_id uuid references public.customers(id) on delete cascade,
  add column if not exists facility_id uuid references public.facilities(id) on delete cascade,
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists agreement_id uuid references public.agreements(id) on delete set null,
  add column if not exists category text not null default 'general',
  add column if not exists expiration_date date,
  add column if not exists signature_status text not null default 'not_required',
  add column if not exists version integer not null default 1;

alter table public.agreement_templates enable row level security;
alter table public.agreements enable row level security;
alter table public.onboarding_checklists enable row level security;
alter table public.onboarding_items enable row level security;

grant select, insert, update, delete on public.agreement_templates to authenticated;
grant select, insert, update, delete on public.agreements to authenticated;
grant select, insert, update, delete on public.onboarding_checklists to authenticated;
grant select, insert, update, delete on public.onboarding_items to authenticated;

create policy "agreement templates company access" on public.agreement_templates for all to authenticated using (company_id = (select company_id from public.profiles where id = auth.uid())) with check (company_id = (select company_id from public.profiles where id = auth.uid()));
create policy "agreements company access" on public.agreements for all to authenticated using (company_id = (select company_id from public.profiles where id = auth.uid())) with check (company_id = (select company_id from public.profiles where id = auth.uid()));
create policy "onboarding checklists company access" on public.onboarding_checklists for all to authenticated using (company_id = (select company_id from public.profiles where id = auth.uid())) with check (company_id = (select company_id from public.profiles where id = auth.uid()));
create policy "onboarding items company access" on public.onboarding_items for all to authenticated using (company_id = (select company_id from public.profiles where id = auth.uid())) with check (company_id = (select company_id from public.profiles where id = auth.uid()));
