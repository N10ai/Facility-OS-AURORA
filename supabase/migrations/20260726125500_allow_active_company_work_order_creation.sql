drop policy if exists "active company users create work orders" on public.work_orders;
create policy "active company users create work orders"
on public.work_orders
for insert
to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() <> 'customer'
);

drop policy if exists "operations create work order areas" on public.work_order_areas;
create policy "operations create work order areas"
on public.work_order_areas
for insert
to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.current_profile_role() <> 'customer'
  and exists (
    select 1 from public.work_orders wo
    where wo.id = work_order_id
      and wo.company_id = app_private.current_profile_company_id()
  )
);
