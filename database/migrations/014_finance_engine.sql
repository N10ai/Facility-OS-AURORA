-- Aurora v3.5/v3.6 Finance Engine
-- Additive and idempotent. Supports pre-existing tables.

create table if not exists public.quotes (
 id uuid primary key default gen_random_uuid(),
 company_id uuid references public.companies(id) on delete cascade,
 customer_id uuid references public.customers(id) on delete set null,
 facility_id uuid references public.facilities(id) on delete set null,
 quote_number text, title text, amount numeric default 0,
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

alter table public.quotes
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists facility_id uuid references public.facilities(id) on delete set null,
  add column if not exists quote_number text,
  add column if not exists title text,
  add column if not exists amount numeric default 0,
  add column if not exists status text default 'draft',
  add column if not exists valid_until date,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

alter table public.invoices
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists facility_id uuid references public.facilities(id) on delete set null,
  add column if not exists invoice_number text,
  add column if not exists amount numeric default 0,
  add column if not exists due_date date,
  add column if not exists status text default 'draft',
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

alter table public.payments
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists invoice_id uuid references public.invoices(id) on delete set null,
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists amount numeric default 0,
  add column if not exists payment_date date default current_date,
  add column if not exists method text,
  add column if not exists status text default 'received',
  add column if not exists created_at timestamptz default now();

alter table public.expenses
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists category text,
  add column if not exists vendor text,
  add column if not exists amount numeric default 0,
  add column if not exists expense_date date default current_date,
  add column if not exists notes text,
  add column if not exists status text default 'recorded',
  add column if not exists created_at timestamptz default now();

alter table public.payroll_entries
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists employee_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists hours numeric default 0,
  add column if not exists hourly_rate numeric default 0,
  add column if not exists gross_pay numeric default 0,
  add column if not exists status text default 'draft',
  add column if not exists created_at timestamptz default now();

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
