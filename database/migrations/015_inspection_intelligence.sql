-- Aurora v3.7.2 Inspection Intelligence
-- Additive and idempotent. Supports both fresh and pre-existing installations.

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  inspector_profile_id uuid references public.profiles(id) on delete set null,
  title text default 'Quality Inspection',
  status text default 'draft',
  overall_score numeric default 0,
  summary text,
  inspected_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inspection_areas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  inspection_id uuid references public.inspections(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  area_name text not null,
  status text default 'pending',
  score numeric default 0,
  visual_impact text default 'medium',
  notes text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  inspection_area_id uuid references public.inspection_areas(id) on delete cascade,
  title text not null,
  status text default 'pending',
  score numeric default 0,
  requires_photo boolean default false,
  notes text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inspection_photos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  inspection_id uuid references public.inspections(id) on delete cascade,
  inspection_area_id uuid references public.inspection_areas(id) on delete cascade,
  uploaded_by_profile_id uuid references public.profiles(id) on delete set null,
  photo_type text default 'after',
  file_url text not null,
  caption text,
  created_at timestamptz default now()
);

-- Repair installations where an older inspections table already existed.
alter table public.inspections
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists facility_id uuid references public.facilities(id) on delete set null,
  add column if not exists work_order_id uuid references public.work_orders(id) on delete set null,
  add column if not exists inspector_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists overall_score numeric default 0,
  add column if not exists summary text,
  add column if not exists inspected_at timestamptz;

-- Preserve values from legacy inspection columns when present.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inspections' and column_name='score') then
    execute 'update public.inspections set overall_score = coalesce(overall_score, score, 0)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inspections' and column_name='notes') then
    execute 'update public.inspections set summary = coalesce(summary, notes)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inspections' and column_name='created_by') then
    execute 'update public.inspections set inspector_profile_id = coalesce(inspector_profile_id, created_by)';
  end if;
end $$;

alter table public.facilities
  add column if not exists quality_score numeric default 0,
  add column if not exists first_impression_score numeric default 0;

alter table public.profiles
  add column if not exists quality_score numeric default 0,
  add column if not exists completed_inspections integer default 0;

do $$
declare table_name text;
begin
  foreach table_name in array array['inspections','inspection_areas','inspection_items','inspection_photos']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "mvp authenticated access" on public.%I', table_name);
    execute format('create policy "mvp authenticated access" on public.%I for all to authenticated using (true) with check (true)', table_name);
    execute format('grant all on public.%I to authenticated', table_name);
  end loop;
end $$;

insert into storage.buckets (id,name,public)
values ('inspection-photos','inspection-photos',true)
on conflict (id) do update set public=true;

drop policy if exists "inspection photos authenticated upload" on storage.objects;
create policy "inspection photos authenticated upload"
on storage.objects for insert to authenticated
with check (bucket_id='inspection-photos');

drop policy if exists "inspection photos public read" on storage.objects;
create policy "inspection photos public read"
on storage.objects for select to public
using (bucket_id='inspection-photos');

notify pgrst, 'reload schema';
