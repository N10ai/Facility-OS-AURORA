drop policy if exists "operations managers create work orders" on public.work_orders;

create policy "active company users create work orders"
on public.work_orders
for insert
to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and (
    app_private.can_manage_operations()
    or assigned_to_profile_id = auth.uid()
    or assigned_to_profile_id is null
  )
);
