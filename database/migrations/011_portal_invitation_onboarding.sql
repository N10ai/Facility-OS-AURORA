-- FacilityOS v2.1 Invite Onboarding
-- Replaces Edge Function user creation with invitation links and a secure RPC.

create table if not exists public.portal_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('owner','manager','employee','customer')),
  phone text,
  token text not null unique,
  status text not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz default now()
);

create index if not exists portal_invites_token_idx on public.portal_invites(token);
create index if not exists portal_invites_company_idx on public.portal_invites(company_id);

alter table public.portal_invites enable row level security;

drop policy if exists "company admins manage portal invites" on public.portal_invites;
create policy "company admins manage portal invites"
on public.portal_invites
for all
to authenticated
using (
  company_id = (
    select company_id from public.profiles where id = auth.uid()
  )
  and exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('owner','manager')
  )
)
with check (
  company_id = (
    select company_id from public.profiles where id = auth.uid()
  )
  and exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('owner','manager')
  )
);

create or replace function public.get_portal_invite_preview(invite_token text)
returns table (
  email text,
  full_name text,
  role text,
  expires_at timestamptz,
  status text
)
language sql
security definer
set search_path = public
as $$
  select i.email, i.full_name, i.role, i.expires_at, i.status
  from public.portal_invites i
  where i.token = invite_token
    and i.status = 'pending'
    and i.expires_at > now()
  limit 1;
$$;

grant execute on function public.get_portal_invite_preview(text) to anon, authenticated;

create or replace function public.claim_portal_invite(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record public.portal_invites%rowtype;
  user_email text;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in to accept an invitation.';
  end if;

  select email into user_email
  from auth.users
  where id = auth.uid();

  select *
  into invite_record
  from public.portal_invites
  where token = invite_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invitation is invalid, expired, or already used.';
  end if;

  if lower(invite_record.email) <> lower(user_email) then
    raise exception 'Log in with the email address that received this invitation.';
  end if;

  insert into public.profiles (
    id, company_id, customer_id, full_name, role, phone, status
  )
  values (
    auth.uid(),
    invite_record.company_id,
    case when invite_record.role = 'customer' then invite_record.customer_id else null end,
    invite_record.full_name,
    invite_record.role,
    invite_record.phone,
    'active'
  )
  on conflict (id) do update set
    company_id = excluded.company_id,
    customer_id = excluded.customer_id,
    full_name = excluded.full_name,
    role = excluded.role,
    phone = excluded.phone,
    status = 'active';

  update public.portal_invites
  set status = 'accepted',
      used_at = now()
  where id = invite_record.id;

  return jsonb_build_object(
    'ok', true,
    'role', invite_record.role,
    'company_id', invite_record.company_id,
    'customer_id', invite_record.customer_id
  );
end;
$$;

grant execute on function public.claim_portal_invite(text) to authenticated;

notify pgrst, 'reload schema';
