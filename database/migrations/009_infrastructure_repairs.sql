-- FacilityOS v1.3 Infrastructure Ready
-- Safe repair for pre-existing contacts table and schema cache refresh.

create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid()
);

alter table public.customer_contacts
add column if not exists company_id uuid references public.companies(id) on delete cascade,
add column if not exists customer_id uuid references public.customers(id) on delete cascade,
add column if not exists full_name text,
add column if not exists title text,
add column if not exists email text,
add column if not exists phone text,
add column if not exists receives_reports boolean default false,
add column if not exists receives_invoices boolean default false,
add column if not exists receives_quotes boolean default false,
add column if not exists status text default 'active',
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

update public.customer_contacts set status='active' where status is null;

alter table public.customer_contacts enable row level security;
drop policy if exists "mvp authenticated access" on public.customer_contacts;
create policy "mvp authenticated access" on public.customer_contacts
for all to authenticated using (true) with check (true);
grant all on public.customer_contacts to authenticated;

insert into storage.buckets (id,name,public)
values ('proof-photos','proof-photos',true)
on conflict (id) do update set public=true;

notify pgrst, 'reload schema';
