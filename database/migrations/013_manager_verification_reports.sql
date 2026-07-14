-- Aurora v3.3 manager verification and customer reports
alter table public.work_orders add column if not exists verified_by_profile_id uuid references public.profiles(id) on delete set null;
alter table public.work_orders add column if not exists customer_summary text;
alter table public.work_orders add column if not exists manager_note text;
alter table public.work_orders add column if not exists quality_score integer default 100;
alter table public.work_orders add column if not exists returned_at timestamptz;

create index if not exists work_orders_verification_queue_idx
  on public.work_orders(company_id, status, scheduled_date);

notify pgrst, 'reload schema';
