create or replace function app_private.current_profile_employee_id()
returns uuid language sql stable security definer set search_path=''
as $$ select p.employee_id from public.profiles p where p.id=(select auth.uid()) and p.status='active' limit 1 $$;
revoke all on function app_private.current_profile_employee_id() from public, anon;
grant execute on function app_private.current_profile_employee_id() to authenticated;

do $$ declare r record; begin
  for r in select schemaname,tablename,policyname from pg_policies
    where schemaname='public' and (policyname like 'dev % all' or policyname='mvp authenticated access')
  loop execute format('drop policy if exists %I on %I.%I',r.policyname,r.schemaname,r.tablename); end loop;
end $$;

create policy "company members view company" on public.companies for select to authenticated using (id=app_private.current_profile_company_id());
create policy "owners admins update company" on public.companies for update to authenticated
using (id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin'))
with check (id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin'));

create policy "staff view company facilities" on public.facilities for select to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','supervisor','employee','sales_rep','account_manager'));
create policy "customers view own facilities" on public.facilities for select to authenticated
using (company_id=app_private.current_profile_company_id() and customer_id=app_private.current_profile_customer_id() and app_private.current_profile_role()='customer');
create policy "management create facilities" on public.facilities for insert to authenticated
with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','account_manager'));
create policy "management update facilities" on public.facilities for update to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','account_manager'))
with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','account_manager'));
create policy "admins delete facilities" on public.facilities for delete to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin'));

create policy "staff view contacts" on public.customer_contacts for select to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','account_manager','sales_rep'));
create policy "customers view own contacts" on public.customer_contacts for select to authenticated
using (company_id=app_private.current_profile_company_id() and customer_id=app_private.current_profile_customer_id() and app_private.current_profile_role()='customer');
create policy "management manage contacts" on public.customer_contacts for all to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','account_manager'))
with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','account_manager'));

create policy "staff view customer notes" on public.customer_notes for select to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','account_manager','sales_rep'));
create policy "staff create customer notes" on public.customer_notes for insert to authenticated
with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','account_manager','sales_rep'));
create policy "management update customer notes" on public.customer_notes for update to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager'))
with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager'));
create policy "admins delete customer notes" on public.customer_notes for delete to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin'));

create policy "staff view customer timeline" on public.customer_timeline_events for select to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','account_manager','sales_rep'));
create policy "customers view own timeline" on public.customer_timeline_events for select to authenticated
using (company_id=app_private.current_profile_company_id() and customer_id=app_private.current_profile_customer_id() and app_private.current_profile_role()='customer');
create policy "staff create customer timeline" on public.customer_timeline_events for insert to authenticated
with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','account_manager','sales_rep'));

create policy "company members view facility timeline" on public.facility_timeline_events for select to authenticated using (company_id=app_private.current_profile_company_id());
create policy "staff create facility timeline" on public.facility_timeline_events for insert to authenticated
with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager','supervisor','employee'));

create policy "users view own notifications" on public.app_notifications for select to authenticated
using (company_id=app_private.current_profile_company_id() and profile_id=(select auth.uid()));
create policy "users update own notifications" on public.app_notifications for update to authenticated
using (company_id=app_private.current_profile_company_id() and profile_id=(select auth.uid()))
with check (company_id=app_private.current_profile_company_id() and profile_id=(select auth.uid()));
create policy "management create notifications" on public.app_notifications for insert to authenticated
with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager'));

create policy "management view activity" on public.activity_events for select to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager'));
create policy "company users create activity" on public.activity_events for insert to authenticated
with check (company_id=app_private.current_profile_company_id() and actor_profile_id=(select auth.uid()));

drop policy if exists "company admins manage portal invites" on public.portal_invites;
create policy "company admins manage portal invites" on public.portal_invites for all to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager'))
with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin','manager'));