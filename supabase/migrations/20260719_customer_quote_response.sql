create or replace function public.customer_respond_to_quote(
  p_quote_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_quote public.quotes%rowtype;
begin
  if p_decision not in ('accepted', 'rejected') then
    raise exception 'Decision must be accepted or rejected.';
  end if;

  select * into v_profile
  from public.profiles
  where id = auth.uid();

  if v_profile.id is null or v_profile.role <> 'customer' or v_profile.customer_id is null then
    raise exception 'Only authenticated customer users may respond to quotes.';
  end if;

  select * into v_quote
  from public.quotes
  where id = p_quote_id;

  if v_quote.id is null then
    raise exception 'Quote not found.';
  end if;

  if v_quote.company_id <> v_profile.company_id or v_quote.customer_id <> v_profile.customer_id then
    raise exception 'You do not have access to this quote.';
  end if;

  if v_quote.status not in ('sent', 'pending') then
    raise exception 'This quote is no longer awaiting a decision.';
  end if;

  update public.quotes
  set status = p_decision
  where id = p_quote_id;

  return jsonb_build_object(
    'id', p_quote_id,
    'status', p_decision
  );
end;
$$;

revoke all on function public.customer_respond_to_quote(uuid, text) from public;
grant execute on function public.customer_respond_to_quote(uuid, text) to authenticated;
