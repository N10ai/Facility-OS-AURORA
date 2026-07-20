do $$
declare t text;
begin
  foreach t in array array['facility_buildings','facility_floors','facility_areas','services','checklists','sops','inventory_items','vendors','documents','automation_rules','contractors','supply_items','facility_supply_inventory']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in (''owner'',''admin'',''manager'',''supervisor'',''employee'',''sales_rep'',''account_manager''))','company members view '||t,t);
    execute format('create policy %I on public.%I for insert to authenticated with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in (''owner'',''admin'',''manager''))','management create '||t,t);
    execute format('create policy %I on public.%I for update to authenticated using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in (''owner'',''admin'',''manager'')) with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in (''owner'',''admin'',''manager''))','management update '||t,t);
    execute format('create policy %I on public.%I for delete to authenticated using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in (''owner'',''admin''))','admins delete '||t,t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['verification_photos','issues']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (company_id=app_private.current_profile_company_id())','company members view '||t,t);
    execute format('create policy %I on public.%I for insert to authenticated with check (company_id=app_private.current_profile_company_id())','company members create '||t,t);
    execute format('create policy %I on public.%I for update to authenticated using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in (''owner'',''admin'',''manager'',''supervisor'')) with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in (''owner'',''admin'',''manager'',''supervisor''))','management update '||t,t);
    execute format('create policy %I on public.%I for delete to authenticated using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in (''owner'',''admin''))','admins delete '||t,t);
  end loop;
end $$;

create policy "owners admins view commissions" on public.commissions for select to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin'));
create policy "owners admins manage commissions" on public.commissions for all to authenticated
using (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin'))
with check (company_id=app_private.current_profile_company_id() and app_private.current_profile_role() in ('owner','admin'));