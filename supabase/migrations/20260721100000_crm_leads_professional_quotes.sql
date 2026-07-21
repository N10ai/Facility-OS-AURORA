-- Aurora v3.15: CRM leads and professional quotes
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  facility_type text,
  address text,
  source text,
  stage text not null default 'new' check (stage in ('new','contacted','walkthrough_scheduled','estimating','quote_sent','won','lost')),
  opportunity_value numeric(12,2) not null default 0,
  next_follow_up date,
  notes text,
  converted_customer_id uuid references public.customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_company_stage_idx on public.leads(company_id,stage,created_at desc);
alter table public.leads enable row level security;
drop policy if exists "leads company access" on public.leads;
create policy "leads company access" on public.leads for all
using (company_id = (select company_id from public.profiles where id = auth.uid()))
with check (company_id = (select company_id from public.profiles where id = auth.uid()));
grant select,insert,update,delete on public.leads to authenticated;

alter table public.quotes
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists customer_facing_notes text,
  add column if not exists scope_of_work text,
  add column if not exists exclusions text,
  add column if not exists payment_terms text,
  add column if not exists tax_rate numeric(7,4) not null default 0;

alter table public.quote_line_items enable row level security;
drop policy if exists "quote line items company access" on public.quote_line_items;
create policy "quote line items company access" on public.quote_line_items for all
using (company_id = (select company_id from public.profiles where id = auth.uid()))
with check (company_id = (select company_id from public.profiles where id = auth.uid()));
grant select,insert,update,delete on public.quote_line_items to authenticated;
