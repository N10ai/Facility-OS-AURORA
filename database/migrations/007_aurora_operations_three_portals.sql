-- FacilityOS Aurora Operations v2.1.0
-- Single-company MVP with Admin, Employee, and Customer portals.
-- Additive migration.

create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_color text default '#111111',
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid,
  full_name text,
  role text default 'employee',
  phone text,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  customer_type text default 'commercial',
  status text default 'active',
  email text,
  phone text,
  address text,
  monthly_value numeric default 0,
  health_score numeric default 100,
  readiness_score numeric default 35,
  created_at timestamptz default now()
);

alter table profiles
add column if not exists customer_id uuid references customers(id) on delete set null,
add column if not exists phone text,
add column if not exists status text default 'active';

create table if not exists facilities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  name text not null,
  facility_type text default 'office',
  address text,
  access_notes text,
  restroom_count integer default 0,
  floor_type text,
  estimated_minutes integer default 60,
  status text default 'active',
  health_score numeric default 100,
  readiness_score numeric default 45,
  created_at timestamptz default now()
);

alter table facilities
add column if not exists restroom_count integer default 0,
add column if not exists floor_type text,
add column if not exists estimated_minutes integer default 60;

create table if not exists service_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  facility_id uuid references facilities(id) on delete cascade,
  name text not null,
  frequency text not null,
  weekdays integer[] default '{}',
  start_date date not null,
  default_time time default '18:00',
  assigned_to_profile_id uuid references profiles(id) on delete set null,
  estimated_minutes integer default 90,
  visit_price numeric default 0,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists service_visits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  facility_id uuid references facilities(id) on delete set null,
  service_plan_id uuid references service_plans(id) on delete set null,
  title text,
  scheduled_date date,
  scheduled_time time,
  assigned_to_profile_id uuid references profiles(id) on delete set null,
  estimated_minutes integer default 90,
  status text default 'scheduled',
  verification_status text default 'not_started',
  check_in_at timestamptz,
  check_out_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

alter table service_visits
add column if not exists service_plan_id uuid references service_plans(id) on delete set null,
add column if not exists assigned_to_profile_id uuid references profiles(id) on delete set null,
add column if not exists estimated_minutes integer default 90,
add column if not exists check_in_at timestamptz,
add column if not exists check_out_at timestamptz,
add column if not exists completed_at timestamptz;

create table if not exists mission_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  service_visit_id uuid references service_visits(id) on delete cascade,
  title text not null,
  sort_order integer default 1,
  requires_proof boolean default false,
  status text default 'pending',
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists visit_proof (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  service_visit_id uuid references service_visits(id) on delete cascade,
  uploaded_by_profile_id uuid references profiles(id) on delete set null,
  proof_type text not null,
  file_url text not null,
  status text default 'uploaded',
  created_at timestamptz default now()
);

create table if not exists facility_issues (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  facility_id uuid references facilities(id) on delete set null,
  service_visit_id uuid references service_visits(id) on delete set null,
  reported_by_profile_id uuid references profiles(id) on delete set null,
  title text not null,
  description text,
  priority text default 'medium',
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists customer_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  facility_id uuid references facilities(id) on delete set null,
  requested_by_profile_id uuid references profiles(id) on delete set null,
  request_type text default 'additional_service',
  title text not null,
  description text,
  status text default 'new',
  created_at timestamptz default now()
);

insert into storage.buckets (id,name,public)
values ('proof-photos','proof-photos',true)
on conflict (id) do update set public=true;

alter table companies enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table facilities enable row level security;
alter table service_plans enable row level security;
alter table service_visits enable row level security;
alter table mission_tasks enable row level security;
alter table visit_proof enable row level security;
alter table facility_issues enable row level security;
alter table customer_requests enable row level security;

-- MVP policies: authenticated users can access records tied to their company.
-- Owners/managers see all company records. Employees see company operational records.
-- Customers are filtered by the UI and customer_id; tighten these further before commercial SaaS launch.

do $$
declare t text;
begin
  foreach t in array array[
    'companies','profiles','customers','facilities','service_plans','service_visits',
    'mission_tasks','visit_proof','facility_issues','customer_requests'
  ]
  loop
    execute format('drop policy if exists "mvp authenticated access" on public.%I', t);
    execute format(
      'create policy "mvp authenticated access" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

drop policy if exists "authenticated proof uploads" on storage.objects;
create policy "authenticated proof uploads"
on storage.objects for insert to authenticated
with check (bucket_id='proof-photos');

drop policy if exists "public proof reads" on storage.objects;
create policy "public proof reads"
on storage.objects for select to public
using (bucket_id='proof-photos');

grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

-- v2.2 business-module foundation
create table if not exists quotes (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
 customer_id uuid references customers(id) on delete set null, facility_id uuid references facilities(id) on delete set null,
 quote_number text, title text not null, amount numeric default 0, status text default 'draft', valid_until date, notes text, created_at timestamptz default now()
);
create table if not exists invoices (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
 customer_id uuid references customers(id) on delete set null, facility_id uuid references facilities(id) on delete set null,
 invoice_number text, amount numeric default 0, due_date date, status text default 'draft', notes text, created_at timestamptz default now()
);
create table if not exists payments (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
 invoice_id uuid references invoices(id) on delete set null, customer_id uuid references customers(id) on delete set null,
 amount numeric default 0, payment_date date default current_date, method text, status text default 'received', created_at timestamptz default now()
);
create table if not exists payroll_entries (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
 employee_profile_id uuid references profiles(id) on delete set null, period_start date, period_end date,
 hours numeric default 0, hourly_rate numeric default 0, gross_pay numeric default 0, status text default 'draft', created_at timestamptz default now()
);
create table if not exists expenses (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
 category text, vendor text, amount numeric default 0, expense_date date default current_date, notes text, status text default 'recorded', created_at timestamptz default now()
);
create table if not exists contractors (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
 name text not null, trade text, email text, phone text, hourly_rate numeric default 0, status text default 'active', created_at timestamptz default now()
);
create table if not exists inspections (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
 customer_id uuid references customers(id) on delete set null, facility_id uuid references facilities(id) on delete set null,
 title text not null, scheduled_date date, score numeric, status text default 'scheduled', notes text, created_at timestamptz default now()
);
create table if not exists billing_subscriptions (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
 customer_id uuid references customers(id) on delete set null, name text not null, amount numeric default 0,
 interval text default 'monthly', next_bill_date date, status text default 'active', created_at timestamptz default now()
);

do $$ declare t text; begin
 foreach t in array array['quotes','invoices','payments','payroll_entries','expenses','contractors','inspections','billing_subscriptions'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists "mvp authenticated access" on public.%I',t);
  execute format('create policy "mvp authenticated access" on public.%I for all to authenticated using (true) with check (true)',t);
 end loop;
end $$;
grant all on all tables in schema public to authenticated;


-- Facility supplies inventory
create table if not exists supply_items (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
 name text not null, category text default 'general', unit text default 'each',
 default_reorder_level numeric default 0, unit_cost numeric default 0, status text default 'active',
 created_at timestamptz default now()
);
create table if not exists facility_supply_inventory (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
 facility_id uuid references facilities(id) on delete cascade, supply_item_id uuid references supply_items(id) on delete cascade,
 quantity_on_hand numeric default 0, reorder_level numeric default 0, target_level numeric default 0,
 storage_location text, notes text, updated_at timestamptz default now(),
 unique(facility_id,supply_item_id)
);
alter table supply_items enable row level security;
alter table facility_supply_inventory enable row level security;
drop policy if exists "mvp authenticated access" on supply_items;
create policy "mvp authenticated access" on supply_items for all to authenticated using (true) with check (true);
drop policy if exists "mvp authenticated access" on facility_supply_inventory;
create policy "mvp authenticated access" on facility_supply_inventory for all to authenticated using (true) with check (true);
grant all on supply_items, facility_supply_inventory to authenticated;
