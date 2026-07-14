-- FacilityOS v1.2 Operational Core
-- Additive migration: editable customer contacts.

create table if not exists customer_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  full_name text not null,
  title text,
  email text,
  phone text,
  receives_reports boolean default false,
  receives_invoices boolean default false,
  receives_quotes boolean default false,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table customer_contacts enable row level security;

drop policy if exists "mvp authenticated access" on customer_contacts;
create policy "mvp authenticated access"
on customer_contacts for all to authenticated
using (true) with check (true);

grant all on customer_contacts to authenticated;
