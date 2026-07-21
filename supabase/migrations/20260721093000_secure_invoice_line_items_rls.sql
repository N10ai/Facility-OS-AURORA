alter table public.invoice_line_items enable row level security;

drop policy if exists "staff view company invoice line items" on public.invoice_line_items;
create policy "staff view company invoice line items"
on public.invoice_line_items for select
to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() = any (array['owner','admin','manager','account_manager']::text[])
);

drop policy if exists "customers view own invoice line items" on public.invoice_line_items;
create policy "customers view own invoice line items"
on public.invoice_line_items for select
to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() = 'customer'
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_line_items.invoice_id
      and i.company_id = app_private.current_profile_company_id()
      and i.customer_id = app_private.current_profile_customer_id()
  )
);

drop policy if exists "finance staff create invoice line items" on public.invoice_line_items;
create policy "finance staff create invoice line items"
on public.invoice_line_items for insert
to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() = any (array['owner','admin','manager']::text[])
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_line_items.invoice_id
      and i.company_id = app_private.current_profile_company_id()
  )
);

drop policy if exists "finance staff update invoice line items" on public.invoice_line_items;
create policy "finance staff update invoice line items"
on public.invoice_line_items for update
to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() = any (array['owner','admin','manager']::text[])
)
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() = any (array['owner','admin','manager']::text[])
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_line_items.invoice_id
      and i.company_id = app_private.current_profile_company_id()
  )
);

drop policy if exists "finance staff delete invoice line items" on public.invoice_line_items;
create policy "finance staff delete invoice line items"
on public.invoice_line_items for delete
to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() = any (array['owner','admin']::text[])
);

alter function public.recalculate_quote_totals(uuid) set search_path = public, pg_temp;
alter function public.recalculate_invoice_balance(uuid) set search_path = public, pg_temp;

revoke execute on function public.create_default_onboarding_items() from anon;
revoke execute on function public.recalculate_quote_totals(uuid) from anon;
revoke execute on function public.recalculate_invoice_balance(uuid) from anon;
