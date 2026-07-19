create or replace function app_private.can_manage_operations()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app_private.current_profile_role() = any(array[
    'owner','admin','manager','supervisor'
  ]), false)
$$;

create or replace function app_private.can_access_work_order(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.work_orders w
    where w.id = target_work_order_id
      and w.company_id = app_private.current_profile_company_id()
      and (
        app_private.can_manage_operations()
        or w.assigned_to_profile_id = (select auth.uid())
        or (
          app_private.current_profile_role() = 'customer'
          and w.customer_id = app_private.current_profile_customer_id()
        )
      )
  )
$$;

create or replace function app_private.can_access_service_visit(target_service_visit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.service_visits v
    where v.id = target_service_visit_id
      and v.company_id = app_private.current_profile_company_id()
      and (
        app_private.can_manage_operations()
        or v.assigned_to_profile_id = (select auth.uid())
        or (
          app_private.current_profile_role() = 'customer'
          and v.customer_id = app_private.current_profile_customer_id()
        )
      )
  )
$$;

revoke all on function app_private.can_manage_operations() from public, anon;
revoke all on function app_private.can_access_work_order(uuid) from public, anon;
revoke all on function app_private.can_access_service_visit(uuid) from public, anon;
grant execute on function app_private.can_manage_operations() to authenticated;
grant execute on function app_private.can_access_work_order(uuid) to authenticated;
grant execute on function app_private.can_access_service_visit(uuid) to authenticated;

drop policy if exists "mvp authenticated access" on public.work_orders;
drop policy if exists "mvp authenticated access" on public.work_order_areas;
drop policy if exists "mvp authenticated access" on public.work_order_supply_usage;
drop policy if exists "mvp authenticated access" on public.work_order_time_entries;
drop policy if exists "mvp authenticated access" on public.service_plans;
drop policy if exists "dev service_visits all" on public.service_visits;
drop policy if exists "mvp authenticated access" on public.service_visits;
drop policy if exists "dev service_visit_tasks all" on public.service_visit_tasks;
drop policy if exists "dev service_visit_proof all" on public.service_visit_proof;
drop policy if exists "dev service_visit_timeline_events all" on public.service_visit_timeline_events;
drop policy if exists "mvp authenticated access" on public.mission_tasks;
drop policy if exists "mvp authenticated access" on public.visit_proof;
drop policy if exists "dev inspections all" on public.inspections;
drop policy if exists "mvp authenticated access" on public.inspections;
drop policy if exists "mvp authenticated access" on public.inspection_areas;
drop policy if exists "mvp authenticated access" on public.inspection_items;
drop policy if exists "mvp authenticated access" on public.inspection_photos;
drop policy if exists "mvp authenticated access" on public.customer_requests;
drop policy if exists "mvp authenticated access" on public.facility_issues;

create policy "operations view accessible work orders" on public.work_orders
for select to authenticated
using (app_private.can_access_work_order(id));

create policy "operations managers create work orders" on public.work_orders
for insert to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.can_manage_operations()
);

create policy "operations update accessible work orders" on public.work_orders
for update to authenticated
using (
  app_private.can_access_work_order(id)
  and app_private.current_profile_role() <> 'customer'
)
with check (
  company_id = app_private.current_profile_company_id()
  and (
    app_private.can_manage_operations()
    or assigned_to_profile_id = (select auth.uid())
  )
);

create policy "operations managers delete work orders" on public.work_orders
for delete to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and app_private.can_manage_operations()
);

create policy "operations view work order areas" on public.work_order_areas
for select to authenticated
using (app_private.can_access_work_order(work_order_id));
create policy "operations create work order areas" on public.work_order_areas
for insert to authenticated
with check (company_id = app_private.current_profile_company_id() and app_private.can_access_work_order(work_order_id) and app_private.current_profile_role() <> 'customer');
create policy "operations update work order areas" on public.work_order_areas
for update to authenticated
using (app_private.can_access_work_order(work_order_id) and app_private.current_profile_role() <> 'customer')
with check (company_id = app_private.current_profile_company_id() and app_private.can_access_work_order(work_order_id) and app_private.current_profile_role() <> 'customer');
create policy "operations managers delete work order areas" on public.work_order_areas
for delete to authenticated
using (app_private.can_manage_operations() and app_private.can_access_work_order(work_order_id));

create policy "operations view work order supply usage" on public.work_order_supply_usage
for select to authenticated
using (app_private.can_access_work_order(work_order_id));
create policy "operations record work order supply usage" on public.work_order_supply_usage
for insert to authenticated
with check (company_id = app_private.current_profile_company_id() and app_private.can_access_work_order(work_order_id) and app_private.current_profile_role() <> 'customer');
create policy "operations update work order supply usage" on public.work_order_supply_usage
for update to authenticated
using (app_private.can_access_work_order(work_order_id) and app_private.current_profile_role() <> 'customer')
with check (company_id = app_private.current_profile_company_id() and app_private.can_access_work_order(work_order_id) and app_private.current_profile_role() <> 'customer');
create policy "operations managers delete work order supply usage" on public.work_order_supply_usage
for delete to authenticated
using (app_private.can_manage_operations() and app_private.can_access_work_order(work_order_id));

create policy "operations view work order time entries" on public.work_order_time_entries
for select to authenticated
using (app_private.can_access_work_order(work_order_id));
create policy "operations create own time entries" on public.work_order_time_entries
for insert to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and app_private.can_access_work_order(work_order_id)
  and (profile_id = (select auth.uid()) or app_private.can_manage_operations())
  and app_private.current_profile_role() <> 'customer'
);
create policy "operations update own time entries" on public.work_order_time_entries
for update to authenticated
using ((profile_id = (select auth.uid()) or app_private.can_manage_operations()) and app_private.can_access_work_order(work_order_id))
with check (company_id = app_private.current_profile_company_id() and (profile_id = (select auth.uid()) or app_private.can_manage_operations()) and app_private.can_access_work_order(work_order_id));
create policy "operations managers delete time entries" on public.work_order_time_entries
for delete to authenticated
using (app_private.can_manage_operations() and app_private.can_access_work_order(work_order_id));

create policy "operations staff view service plans" on public.service_plans
for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and (
    app_private.can_manage_operations()
    or assigned_to_profile_id = (select auth.uid())
    or (app_private.current_profile_role() = 'customer' and customer_id = app_private.current_profile_customer_id())
  )
);
create policy "operations managers create service plans" on public.service_plans
for insert to authenticated
with check (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());
create policy "operations managers update service plans" on public.service_plans
for update to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations())
with check (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());
create policy "operations managers delete service plans" on public.service_plans
for delete to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());

create policy "operations view accessible service visits" on public.service_visits
for select to authenticated
using (app_private.can_access_service_visit(id));
create policy "operations managers create service visits" on public.service_visits
for insert to authenticated
with check (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());
create policy "operations update accessible service visits" on public.service_visits
for update to authenticated
using (app_private.can_access_service_visit(id) and app_private.current_profile_role() <> 'customer')
with check (company_id = app_private.current_profile_company_id() and (app_private.can_manage_operations() or assigned_to_profile_id = (select auth.uid())));
create policy "operations managers delete service visits" on public.service_visits
for delete to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());

create policy "operations view service visit tasks" on public.service_visit_tasks
for select to authenticated using (app_private.can_access_service_visit(service_visit_id));
create policy "operations create service visit tasks" on public.service_visit_tasks
for insert to authenticated with check (company_id = app_private.current_profile_company_id() and app_private.can_access_service_visit(service_visit_id) and app_private.current_profile_role() <> 'customer');
create policy "operations update service visit tasks" on public.service_visit_tasks
for update to authenticated using (app_private.can_access_service_visit(service_visit_id) and app_private.current_profile_role() <> 'customer')
with check (company_id = app_private.current_profile_company_id() and app_private.can_access_service_visit(service_visit_id) and app_private.current_profile_role() <> 'customer');
create policy "operations managers delete service visit tasks" on public.service_visit_tasks
for delete to authenticated using (app_private.can_manage_operations() and app_private.can_access_service_visit(service_visit_id));

create policy "operations view service visit proof" on public.service_visit_proof
for select to authenticated using (app_private.can_access_service_visit(service_visit_id));
create policy "operations create service visit proof" on public.service_visit_proof
for insert to authenticated with check (company_id = app_private.current_profile_company_id() and app_private.can_access_service_visit(service_visit_id) and app_private.current_profile_role() <> 'customer');
create policy "operations update service visit proof" on public.service_visit_proof
for update to authenticated using (app_private.can_access_service_visit(service_visit_id) and app_private.current_profile_role() <> 'customer')
with check (company_id = app_private.current_profile_company_id() and app_private.can_access_service_visit(service_visit_id) and app_private.current_profile_role() <> 'customer');
create policy "operations managers delete service visit proof" on public.service_visit_proof
for delete to authenticated using (app_private.can_manage_operations() and app_private.can_access_service_visit(service_visit_id));

create policy "operations view service visit timeline" on public.service_visit_timeline_events
for select to authenticated using (app_private.can_access_service_visit(service_visit_id));
create policy "operations add service visit timeline" on public.service_visit_timeline_events
for insert to authenticated with check (company_id = app_private.current_profile_company_id() and app_private.can_access_service_visit(service_visit_id) and app_private.current_profile_role() <> 'customer');
create policy "operations managers update service visit timeline" on public.service_visit_timeline_events
for update to authenticated using (app_private.can_manage_operations() and app_private.can_access_service_visit(service_visit_id))
with check (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations() and app_private.can_access_service_visit(service_visit_id));
create policy "operations managers delete service visit timeline" on public.service_visit_timeline_events
for delete to authenticated using (app_private.can_manage_operations() and app_private.can_access_service_visit(service_visit_id));

create policy "operations view mission tasks" on public.mission_tasks
for select to authenticated using (app_private.can_access_service_visit(service_visit_id));
create policy "operations create mission tasks" on public.mission_tasks
for insert to authenticated with check (company_id = app_private.current_profile_company_id() and app_private.can_access_service_visit(service_visit_id) and app_private.current_profile_role() <> 'customer');
create policy "operations update mission tasks" on public.mission_tasks
for update to authenticated using (app_private.can_access_service_visit(service_visit_id) and app_private.current_profile_role() <> 'customer')
with check (company_id = app_private.current_profile_company_id() and app_private.can_access_service_visit(service_visit_id) and app_private.current_profile_role() <> 'customer');
create policy "operations managers delete mission tasks" on public.mission_tasks
for delete to authenticated using (app_private.can_manage_operations() and app_private.can_access_service_visit(service_visit_id));

create policy "operations view visit proof" on public.visit_proof
for select to authenticated using (app_private.can_access_service_visit(service_visit_id));
create policy "operations upload visit proof" on public.visit_proof
for insert to authenticated with check (company_id = app_private.current_profile_company_id() and app_private.can_access_service_visit(service_visit_id) and uploaded_by_profile_id = (select auth.uid()) and app_private.current_profile_role() <> 'customer');
create policy "operations update own visit proof" on public.visit_proof
for update to authenticated using ((uploaded_by_profile_id = (select auth.uid()) or app_private.can_manage_operations()) and app_private.can_access_service_visit(service_visit_id))
with check (company_id = app_private.current_profile_company_id() and (uploaded_by_profile_id = (select auth.uid()) or app_private.can_manage_operations()) and app_private.can_access_service_visit(service_visit_id));
create policy "operations managers delete visit proof" on public.visit_proof
for delete to authenticated using (app_private.can_manage_operations() and app_private.can_access_service_visit(service_visit_id));

create policy "operations view inspections" on public.inspections
for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and (
    app_private.can_manage_operations()
    or inspector_profile_id = (select auth.uid())
    or (work_order_id is not null and app_private.can_access_work_order(work_order_id))
    or (app_private.current_profile_role() = 'customer' and customer_id = app_private.current_profile_customer_id())
  )
);
create policy "operations create inspections" on public.inspections
for insert to authenticated
with check (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() <> 'customer' and (app_private.can_manage_operations() or inspector_profile_id = (select auth.uid())));
create policy "operations update inspections" on public.inspections
for update to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() <> 'customer' and (app_private.can_manage_operations() or inspector_profile_id = (select auth.uid())))
with check (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() <> 'customer' and (app_private.can_manage_operations() or inspector_profile_id = (select auth.uid())));
create policy "operations managers delete inspections" on public.inspections
for delete to authenticated using (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());

create policy "operations view inspection areas" on public.inspection_areas
for select to authenticated using (exists (select 1 from public.inspections i where i.id = inspection_id));
create policy "operations manage inspection areas" on public.inspection_areas
for all to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() <> 'customer')
with check (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() <> 'customer');

create policy "operations view inspection items" on public.inspection_items
for select to authenticated using (exists (select 1 from public.inspection_areas a where a.id = inspection_area_id));
create policy "operations manage inspection items" on public.inspection_items
for all to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() <> 'customer')
with check (company_id = app_private.current_profile_company_id() and app_private.current_profile_role() <> 'customer');

create policy "operations view inspection photos" on public.inspection_photos
for select to authenticated using (exists (select 1 from public.inspections i where i.id = inspection_id));
create policy "operations upload inspection photos" on public.inspection_photos
for insert to authenticated with check (company_id = app_private.current_profile_company_id() and uploaded_by_profile_id = (select auth.uid()) and app_private.current_profile_role() <> 'customer');
create policy "operations update own inspection photos" on public.inspection_photos
for update to authenticated using ((uploaded_by_profile_id = (select auth.uid()) or app_private.can_manage_operations()) and company_id = app_private.current_profile_company_id())
with check ((uploaded_by_profile_id = (select auth.uid()) or app_private.can_manage_operations()) and company_id = app_private.current_profile_company_id());
create policy "operations managers delete inspection photos" on public.inspection_photos
for delete to authenticated using (app_private.can_manage_operations() and company_id = app_private.current_profile_company_id());

create policy "operations view customer requests" on public.customer_requests
for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and (
    app_private.can_manage_operations()
    or (app_private.current_profile_role() = 'customer' and customer_id = app_private.current_profile_customer_id())
  )
);
create policy "customers create own requests" on public.customer_requests
for insert to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and customer_id = app_private.current_profile_customer_id()
  and requested_by_profile_id = (select auth.uid())
  and app_private.current_profile_role() = 'customer'
);
create policy "operations managers create requests" on public.customer_requests
for insert to authenticated
with check (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());
create policy "operations managers update requests" on public.customer_requests
for update to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations())
with check (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());
create policy "operations managers delete requests" on public.customer_requests
for delete to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());

create policy "operations view facility issues" on public.facility_issues
for select to authenticated
using (
  company_id = app_private.current_profile_company_id()
  and (
    app_private.can_manage_operations()
    or reported_by_profile_id = (select auth.uid())
    or (app_private.current_profile_role() = 'customer' and customer_id = app_private.current_profile_customer_id())
  )
);
create policy "authenticated users report facility issues" on public.facility_issues
for insert to authenticated
with check (
  company_id = app_private.current_profile_company_id()
  and reported_by_profile_id = (select auth.uid())
  and (
    app_private.can_manage_operations()
    or app_private.current_profile_role() in ('employee','customer')
  )
);
create policy "operations managers update facility issues" on public.facility_issues
for update to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations())
with check (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());
create policy "operations managers delete facility issues" on public.facility_issues
for delete to authenticated
using (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());