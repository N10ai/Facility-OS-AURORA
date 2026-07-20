drop policy if exists "inspection photos public read" on storage.objects;
drop policy if exists "public proof reads" on storage.objects;
drop policy if exists "authenticated proof uploads" on storage.objects;
drop policy if exists "inspection photos authenticated upload" on storage.objects;

create policy "tenant inspection photo uploads" on storage.objects for insert to authenticated
with check (bucket_id='inspection-photos' and (storage.foldername(name))[1]=app_private.current_profile_company_id()::text);
create policy "tenant proof photo uploads" on storage.objects for insert to authenticated
with check (bucket_id='proof-photos' and (storage.foldername(name))[1]=app_private.current_profile_company_id()::text);
create policy "tenant photo updates" on storage.objects for update to authenticated
using (bucket_id in ('inspection-photos','proof-photos') and (storage.foldername(name))[1]=app_private.current_profile_company_id()::text)
with check (bucket_id in ('inspection-photos','proof-photos') and (storage.foldername(name))[1]=app_private.current_profile_company_id()::text);
create policy "tenant photo deletes" on storage.objects for delete to authenticated
using (bucket_id in ('inspection-photos','proof-photos') and (storage.foldername(name))[1]=app_private.current_profile_company_id()::text);