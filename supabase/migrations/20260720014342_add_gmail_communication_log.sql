create table if not exists public.communication_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  channel text not null default 'email' check (channel in ('email','sms','phone','portal','internal')),
  direction text not null default 'outbound' check (direction in ('outbound','inbound','internal')),
  provider text,
  from_address text,
  to_addresses text[] not null default '{}',
  cc_addresses text[] not null default '{}',
  bcc_addresses text[] not null default '{}',
  subject text,
  body_text text,
  status text not null default 'draft' check (status in ('draft','queued','sending','sent','delivered','failed','received')),
  provider_message_id text,
  provider_thread_id text,
  related_entity_type text,
  related_entity_id uuid,
  error_message text,
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists communication_messages_company_created_idx on public.communication_messages(company_id, created_at desc);
create index if not exists communication_messages_customer_created_idx on public.communication_messages(customer_id, created_at desc);
create index if not exists communication_messages_provider_thread_idx on public.communication_messages(provider, provider_thread_id) where provider_thread_id is not null;

alter table public.communication_messages enable row level security;

drop policy if exists "company staff view communications" on public.communication_messages;
create policy "company staff view communications" on public.communication_messages for select to authenticated
using (company_id = (select private.current_company_id()) and (select private.current_app_role()) in ('owner','admin','manager','supervisor','account_manager','sales_rep'));

drop policy if exists "customers view own communications" on public.communication_messages;
create policy "customers view own communications" on public.communication_messages for select to authenticated
using (company_id = (select private.current_company_id()) and customer_id = (select private.current_customer_id()) and direction <> 'internal');

drop policy if exists "company staff create communications" on public.communication_messages;
create policy "company staff create communications" on public.communication_messages for insert to authenticated
with check (company_id = (select private.current_company_id()) and created_by_profile_id = (select auth.uid()) and (select private.current_app_role()) in ('owner','admin','manager','supervisor','account_manager','sales_rep'));

drop policy if exists "company admins update communications" on public.communication_messages;
create policy "company admins update communications" on public.communication_messages for update to authenticated
using (company_id = (select private.current_company_id()) and (select private.current_app_role()) in ('owner','admin','manager'))
with check (company_id = (select private.current_company_id()) and (select private.current_app_role()) in ('owner','admin','manager'));

grant select, insert, update on public.communication_messages to authenticated;
revoke all on public.communication_messages from anon;

comment on table public.communication_messages is 'Tenant-scoped communication history for Gmail and future channels. OAuth credentials are never stored here.';