-- FacilityOS Operations Core — Finance lifecycle foundation
-- Apply in Supabase SQL editor after the existing FacilityOS schema.

create extension if not exists pgcrypto;

alter table if exists quotes
  add column if not exists contact_id uuid,
  add column if not exists service_start_date date,
  add column if not exists frequency text,
  add column if not exists subtotal numeric(12,2) not null default 0,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists tax_amount numeric(12,2) not null default 0,
  add column if not exists total_amount numeric(12,2) not null default 0,
  add column if not exists recurring_amount numeric(12,2) not null default 0,
  add column if not exists annual_value numeric(12,2) not null default 0,
  add column if not exists accepted_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists converted_invoice_id uuid,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists quote_line_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  quote_id uuid not null references quotes(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit text not null default 'service',
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) generated always as (quantity * unit_price) stored,
  is_optional boolean not null default false,
  is_selected boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_line_items_quote_id_idx on quote_line_items(quote_id);
create index if not exists quote_line_items_company_id_idx on quote_line_items(company_id);

alter table if exists invoices
  add column if not exists quote_id uuid references quotes(id) on delete set null,
  add column if not exists work_order_id uuid,
  add column if not exists subtotal numeric(12,2) not null default 0,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists tax_amount numeric(12,2) not null default 0,
  add column if not exists total_amount numeric(12,2) not null default 0,
  add column if not exists amount_paid numeric(12,2) not null default 0,
  add column if not exists balance_due numeric(12,2) not null default 0,
  add column if not exists issued_date date,
  add column if not exists paid_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit text not null default 'service',
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) generated always as (quantity * unit_price) stored,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists invoice_line_items_invoice_id_idx on invoice_line_items(invoice_id);

alter table if exists payments
  add column if not exists reference_number text,
  add column if not exists notes text,
  add column if not exists payment_type text not null default 'payment',
  add column if not exists created_at timestamptz not null default now();

alter table if exists expenses
  add column if not exists customer_id uuid,
  add column if not exists facility_id uuid,
  add column if not exists work_order_id uuid,
  add column if not exists employee_profile_id uuid,
  add column if not exists receipt_url text,
  add column if not exists payment_method text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists payroll_entries
  add column if not exists work_order_id uuid,
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

create or replace function recalculate_quote_totals(target_quote_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  selected_subtotal numeric(12,2);
  current_discount numeric(12,2);
  current_tax numeric(12,2);
begin
  select coalesce(sum(line_total),0)
    into selected_subtotal
  from quote_line_items
  where quote_id = target_quote_id
    and (not is_optional or is_selected);

  select coalesce(discount_amount,0), coalesce(tax_amount,0)
    into current_discount, current_tax
  from quotes
  where id = target_quote_id;

  update quotes
  set subtotal = selected_subtotal,
      total_amount = greatest(0, selected_subtotal - current_discount + current_tax),
      amount = greatest(0, selected_subtotal - current_discount + current_tax),
      annual_value = case
        when frequency = 'weekly' then recurring_amount * 52
        when frequency = 'biweekly' then recurring_amount * 26
        when frequency = 'monthly' then recurring_amount * 12
        when frequency = 'quarterly' then recurring_amount * 4
        else total_amount
      end,
      updated_at = now()
  where id = target_quote_id;
end;
$$;

create or replace function recalculate_invoice_balance(target_invoice_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  invoice_total numeric(12,2);
  paid_total numeric(12,2);
begin
  select coalesce(nullif(total_amount,0), amount, 0)
    into invoice_total
  from invoices
  where id = target_invoice_id;

  select coalesce(sum(case when payment_type = 'refund' then -amount else amount end),0)
    into paid_total
  from payments
  where invoice_id = target_invoice_id
    and status in ('received','completed');

  update invoices
  set amount_paid = paid_total,
      balance_due = greatest(0, invoice_total - paid_total),
      status = case
        when paid_total <= 0 then status
        when paid_total < invoice_total then 'partially_paid'
        else 'paid'
      end,
      paid_at = case when paid_total >= invoice_total and invoice_total > 0 then coalesce(paid_at, now()) else null end,
      updated_at = now()
  where id = target_invoice_id;
end;
$$;
