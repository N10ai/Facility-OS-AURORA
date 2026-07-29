create table if not exists public.service_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  customer_id uuid references public.customers(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  customer_name text not null,
  facility_name text not null,
  recipient_email text,
  service_date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  status text not null default 'draft' check (status in ('draft','completed','shared')),
  summary text,
  areas jsonb not null default '[]'::jsonb,
  inventory jsonb not null default '[]'::jsonb,
  issues jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  shared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_reports enable row level security;

drop policy if exists service_reports_company_access on public.service_reports;
create policy service_reports_company_access on public.service_reports
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.company_id = service_reports.company_id))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.company_id = service_reports.company_id));

create index if not exists service_reports_company_date_idx on public.service_reports(company_id, service_date desc);
create index if not exists service_reports_customer_idx on public.service_reports(customer_id);
create index if not exists service_reports_facility_idx on public.service_reports(facility_id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('service-report-photos','service-report-photos',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=10485760, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists service_report_photos_insert on storage.objects;
create policy service_report_photos_insert on storage.objects for insert to authenticated
with check (bucket_id='service-report-photos');

drop policy if exists service_report_photos_update on storage.objects;
create policy service_report_photos_update on storage.objects for update to authenticated
using (bucket_id='service-report-photos') with check (bucket_id='service-report-photos');

drop policy if exists service_report_photos_delete on storage.objects;
create policy service_report_photos_delete on storage.objects for delete to authenticated
using (bucket_id='service-report-photos');
