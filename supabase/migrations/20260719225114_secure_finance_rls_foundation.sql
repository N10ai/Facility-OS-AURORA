-- Aurora v3.24: production finance row-level security foundation
-- Mirrors migration applied to Supabase project Facility OS.

create schema if not exists app_private;

create or replace function app_private.current_profile_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.company_id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.status = 'active'
  limit 1
$$;

create or replace function app_private.current_profile_customer_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.customer_id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.status = 'active'
  limit 1
$$;

create or replace function app_private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.status = 'active'
  limit 1
$$;

revoke all on function app_private.current_profile_company_id() from public;
revoke all on function app_private.current_profile_customer_id() from public;
revoke all on function app_private.current_profile_role() from public;
grant execute on function app_private.current_profile_company_id() to authenticated;
grant execute on function app_private.current_profile_customer_id() to authenticated;
grant execute on function app_private.current_profile_role() to authenticated;

-- Remove development/MVP bypass policies from finance tables.
drop policy if exists "dev quotes all" on public.quotes;
drop policy if exists "mvp authenticated access" on public.quotes;
drop policy if exists "dev invoices all" on public.invoices;
drop policy if exists "mvp authenticated access" on public.invoices;
drop policy if exists "mvp authenticated access" on public.payments;
drop policy if exists "mvp authenticated access" on public.billing_subscriptions;
drop policy if exists "dev expenses all" on public.expenses;
drop policy if exists "mvp authenticated access" on public.expenses;
drop policy if exists "mvp authenticated access" on public.payroll_entries;

-- Quotes
create policy "staff view company quotes"
on public.quotes for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager','sales_rep','account_manager')
);

create policy "customers view own quotes"
on public.quotes for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and customer_id = app_private.current_profile_customer_id()
  and app_private.current_profile_role() = 'customer'
);

create policy "staff create company quotes"
on public.quotes for insert to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager','sales_rep','account_manager')
);

create policy "staff update company quotes"
on public.quotes for update to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager','sales_rep','account_manager')
)
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager','sales_rep','account_manager')
);

create policy "staff delete company quotes"
on public.quotes for delete to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
);

-- Invoices
create policy "staff view company invoices"
on public.invoices for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager','account_manager')
);

create policy "customers view own invoices"
on public.invoices for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and customer_id = app_private.current_profile_customer_id()
  and app_private.current_profile_role() = 'customer'
);

create policy "finance staff create invoices"
on public.invoices for insert to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
);

create policy "finance staff update invoices"
on public.invoices for update to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
)
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
);

create policy "finance staff delete invoices"
on public.invoices for delete to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin')
);

-- Payments
create policy "staff view company payments"
on public.payments for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager','account_manager')
);

create policy "customers view own payments"
on public.payments for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and customer_id = app_private.current_profile_customer_id()
  and app_private.current_profile_role() = 'customer'
);

create policy "finance staff create payments"
on public.payments for insert to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
);

create policy "finance staff update payments"
on public.payments for update to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
)
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
);

create policy "finance staff delete payments"
on public.payments for delete to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin')
);

-- Billing subscriptions
create policy "staff view company subscriptions"
on public.billing_subscriptions for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager','account_manager')
);

create policy "customers view own subscriptions"
on public.billing_subscriptions for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and customer_id = app_private.current_profile_customer_id()
  and app_private.current_profile_role() = 'customer'
);

create policy "finance staff create subscriptions"
on public.billing_subscriptions for insert to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
);

create policy "finance staff update subscriptions"
on public.billing_subscriptions for update to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
)
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
);

create policy "finance staff delete subscriptions"
on public.billing_subscriptions for delete to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin')
);

-- Expenses
create policy "finance staff view expenses"
on public.expenses for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
);

create policy "finance staff create expenses"
on public.expenses for insert to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
);

create policy "finance staff update expenses"
on public.expenses for update to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
)
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin','manager')
);

create policy "finance staff delete expenses"
on public.expenses for delete to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin')
);

-- Payroll
create policy "owners and admins view payroll"
on public.payroll_entries for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin')
);

create policy "owners and admins create payroll"
on public.payroll_entries for insert to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin')
);

create policy "owners and admins update payroll"
on public.payroll_entries for update to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin')
)
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin')
);

create policy "owners and admins delete payroll"
on public.payroll_entries for delete to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() in ('owner','admin')
);
