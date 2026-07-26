drop policy if exists "active company users create work orders" on public.work_orders;
drop policy if exists "operations managers create work orders" on public.work_orders;
create policy "authenticated users create work orders"
on public.work_orders for insert
to authenticated
with check (true);

drop policy if exists "active company users create work order areas" on public.work_order_areas;
drop policy if exists "operations create work order areas" on public.work_order_areas;
create policy "authenticated users create work order areas"
on public.work_order_areas for insert
to authenticated
with check (true);
