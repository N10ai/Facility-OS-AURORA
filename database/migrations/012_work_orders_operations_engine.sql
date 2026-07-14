create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  service_plan_id uuid references public.service_plans(id) on delete set null,
  assigned_to_profile_id uuid references public.profiles(id) on delete set null,
  title text not null default 'Cleaning Work Order',
  scheduled_date date not null,
  scheduled_time time,
  estimated_minutes integer default 90,
  priority text default 'normal',
  instructions text,
  status text not null default 'scheduled',
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.work_order_areas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  facility_area_id uuid,
  name text not null,
  sop text,
  sort_order integer default 1,
  status text default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.work_order_supply_usage (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  supply_item_id uuid references public.supply_items(id) on delete set null,
  quantity_used numeric not null default 0,
  recorded_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.work_order_time_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  entry_type text default 'work',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create index if not exists work_orders_company_date_idx on public.work_orders(company_id, scheduled_date);
create index if not exists work_orders_assignee_idx on public.work_orders(assigned_to_profile_id, scheduled_date);
create index if not exists work_order_areas_order_idx on public.work_order_areas(work_order_id, sort_order);

alter table public.work_orders enable row level security;
alter table public.work_order_areas enable row level security;
alter table public.work_order_supply_usage enable row level security;
alter table public.work_order_time_entries enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['work_orders','work_order_areas','work_order_supply_usage','work_order_time_entries']
  loop
    execute format('drop policy if exists "mvp authenticated access" on public.%I', table_name);
    execute format('create policy "mvp authenticated access" on public.%I for all to authenticated using (true) with check (true)', table_name);
    execute format('grant all on public.%I to authenticated', table_name);
  end loop;
end $$;

notify pgrst, 'reload schema';
