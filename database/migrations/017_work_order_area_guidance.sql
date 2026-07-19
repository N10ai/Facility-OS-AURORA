alter table public.work_order_areas
  add column if not exists sop_title text,
  add column if not exists instructions text,
  add column if not exists required_tools text[] not null default '{}',
  add column if not exists required_supplies text[] not null default '{}',
  add column if not exists safety_notes text,
  add column if not exists estimated_minutes integer;

comment on column public.work_order_areas.sop_title is 'Employee-facing SOP title for this cleaning area';
comment on column public.work_order_areas.instructions is 'Step-by-step employee instructions for this cleaning area';
comment on column public.work_order_areas.required_tools is 'Tools required to complete this cleaning area';
comment on column public.work_order_areas.required_supplies is 'Cleaning products and consumables required for this area';
comment on column public.work_order_areas.safety_notes is 'Area-specific PPE, chemical, access, and safety guidance';
