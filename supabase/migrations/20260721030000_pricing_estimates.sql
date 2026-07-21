create table if not exists public.pricing_estimates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  prospect_name text,
  status text not null default 'draft' check (status in ('draft','quoted','archived')),
  facility_type text not null,
  size_band text not null,
  approximate_sqft numeric,
  employees integer not null default 0,
  desks integer not null default 0,
  restrooms integer not null default 0,
  kitchens integer not null default 0,
  conference_rooms integer not null default 0,
  warehouse_size text not null default 'none',
  floor_type text not null,
  service_frequency text not null,
  current_condition text not null,
  estimated_hours numeric not null,
  suggested_crew integer not null,
  estimated_supply_cost numeric not null,
  estimated_cost numeric not null,
  minimum_price numeric not null,
  recommended_price numeric not null,
  premium_price numeric not null,
  estimated_monthly_revenue numeric not null,
  estimated_margin numeric not null,
  confidence_score integer not null,
  quote_id uuid references public.quotes(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pricing_estimates_company_idx on public.pricing_estimates(company_id, created_at desc);
create index if not exists pricing_estimates_customer_idx on public.pricing_estimates(customer_id);

alter table public.pricing_estimates enable row level security;

drop policy if exists "pricing estimates company access" on public.pricing_estimates;
create policy "pricing estimates company access"
on public.pricing_estimates
for all
using (
  company_id = (select company_id from public.profiles where id = auth.uid())
)
with check (
  company_id = (select company_id from public.profiles where id = auth.uid())
);
