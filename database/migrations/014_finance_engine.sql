-- Aurora v3.5 Finance Engine
-- Additive/idempotent safeguards for existing finance tables.

create table if not exists public.quotes (
 id uuid primary key default gen_random_uuid(),
 company_id uuid references public.companies(id) on delete cascade,
 customer_id uuid references public.customers(id) on delete set null,
 facility_id uuid references public.facilities(id) on delete set null,
 quote_number text, title text not null, amount numeric default 0,
 status text default 'draft', valid_until date, notes text,
 created_at timestamptz default now()
);

create table if not exists public.invoices (
 id uuid primary key default gen_random_uuid(),
 company_id uuid references public.companies(id) on delete cascade,
 customer_id uuid references public.customers(id) on delete set null,
 facility_id uuid references public.facilities(id) on delete set null,
 invoice_number text, amount numeric default 0, due_date date,
 status text default 'draft', notes text, created_at timestamptz default now()
);

create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(),
 company_id uuid references public.companies(id) on delete cascade,
 invoice_id uuid references public.invoices(id) on delete set null,
 customer_id uuid references public.customers(id) on delete set null,
 amount numeric default 0, payment_date date default current_date,
 method text, status text default 'received', created_at timestamptz default now()
);

create table if not exists public.payroll_entries (
 id uuid primary key default gen_random_uuid(),
 company_id uuid references public.companies(id) on delete cascade,
 employee_profile_id uuid references public.profiles(id) on delete set null,
 period_start date, period_end date, hours numeric default 0,
 hourly_rate numeric default 0, gross_pay numeric default 0,
 status text default 'draft', created_at timestamptz default now()
);

create table if not exists public.expenses (
 id uuid primary key default gen_random_uuid(),
 company_id uuid references public.companies(id) on delete cascade,
 category text, vendor text, amount numeric default 0,
 expense_date date default current_date, notes text,
 status text default 'recorded', created_at timestamptz default now()
);

do $$
declare t text;
begin
  foreach t in array array['quotes','invoices','payments','payroll_entries','expenses']
  loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists "mvp authenticated access" on public.%I',t);
    execute format('create policy "mvp authenticated access" on public.%I for all to authenticated using (true) with check (true)',t);
    execute format('grant all on public.%I to authenticated',t);
  end loop;
end $$;

notify pgrst, 'reload schema';
