revoke all on function public.get_portal_invite_preview(text) from public, authenticated;
grant execute on function public.get_portal_invite_preview(text) to anon;

revoke all on function public.claim_portal_invite(text) from public, anon;
grant execute on function public.claim_portal_invite(text) to authenticated;

revoke all on function public.customer_respond_to_quote(uuid,text) from public, anon;
grant execute on function public.customer_respond_to_quote(uuid,text) to authenticated;