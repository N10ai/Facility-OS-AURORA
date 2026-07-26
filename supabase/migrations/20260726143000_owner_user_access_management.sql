create table if not exists public.work_order_assignment_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  previous_profile_id uuid references public.profiles(id) on delete set null,
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  changed_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);
alter table public.work_order_assignment_history enable row level security;
drop policy if exists "company managers view assignment history" on public.work_order_assignment_history;
create policy "company managers view assignment history" on public.work_order_assignment_history for select to authenticated using (company_id = app_private.current_profile_company_id() and app_private.can_manage_operations());

create or replace function public.reassign_work_order(p_work_order_id uuid, p_assigned_profile_id uuid default null, p_note text default null)
returns public.work_orders language plpgsql security definer set search_path = public, app_private as $$
declare v_company uuid := app_private.current_profile_company_id(); v_actor uuid := auth.uid(); v_order public.work_orders; v_previous uuid;
begin
  if v_company is null or not app_private.can_manage_operations() then raise exception 'Only an owner, admin, manager, or supervisor can assign work orders'; end if;
  select * into v_order from public.work_orders where id=p_work_order_id and company_id=v_company for update;
  if not found then raise exception 'Work order not found'; end if;
  if p_assigned_profile_id is not null and not exists(select 1 from public.profiles where id=p_assigned_profile_id and company_id=v_company and status='active' and role in ('owner','admin','manager','supervisor','employee')) then raise exception 'Selected employee is not an active member of this company'; end if;
  v_previous := v_order.assigned_to_profile_id;
  update public.work_orders set assigned_to_profile_id=p_assigned_profile_id,updated_at=now() where id=p_work_order_id returning * into v_order;
  insert into public.work_order_assignment_history(company_id,work_order_id,previous_profile_id,assigned_profile_id,changed_by_profile_id,note) values(v_company,p_work_order_id,v_previous,p_assigned_profile_id,v_actor,p_note);
  return v_order;
end $$;
grant execute on function public.reassign_work_order(uuid,uuid,text) to authenticated;

create or replace function public.manage_company_user(p_profile_id uuid, p_role text, p_status text, p_customer_id uuid default null)
returns public.profiles language plpgsql security definer set search_path = public, app_private as $$
declare v_company uuid := app_private.current_profile_company_id(); v_actor uuid := auth.uid(); v_result public.profiles;
begin
  if v_company is null or app_private.current_profile_role() not in ('owner','admin') then raise exception 'Only an owner or admin can manage users'; end if;
  if p_role not in ('owner','admin','manager','supervisor','employee','customer','contractor') then raise exception 'Invalid role'; end if;
  if p_status not in ('active','inactive') then raise exception 'Invalid status'; end if;
  if p_profile_id=v_actor and (p_status<>'active' or p_role not in ('owner','admin')) then raise exception 'You cannot remove your own owner/admin access'; end if;
  if p_role='customer' then
    if p_customer_id is null or not exists(select 1 from public.customers where id=p_customer_id and company_id=v_company) then raise exception 'Choose a valid customer account'; end if;
  else p_customer_id := null;
  end if;
  update public.profiles set role=p_role,status=p_status,customer_id=p_customer_id,updated_at=now() where id=p_profile_id and company_id=v_company returning * into v_result;
  if not found then raise exception 'User not found in your company'; end if;
  if p_status='inactive' then update public.work_orders set assigned_to_profile_id=null,updated_at=now() where company_id=v_company and assigned_to_profile_id=p_profile_id and status in ('scheduled','returned'); end if;
  return v_result;
end $$;
grant execute on function public.manage_company_user(uuid,text,text,uuid) to authenticated;
