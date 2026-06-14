-- Require a real authenticated session for editorial writes and keep public
-- snapshots read-only. Public bucket URLs do not require a listing policy.

drop policy if exists "cms authenticated manage" on public.cms_documents;
create policy "cms authenticated manage"
  on public.cms_documents for all to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "cms authenticated publish" on public.cms_public_documents;
drop policy if exists "cms authenticated publish insert" on public.cms_public_documents;
drop policy if exists "cms authenticated publish update" on public.cms_public_documents;
drop policy if exists "cms authenticated publish delete" on public.cms_public_documents;
create policy "cms authenticated publish insert"
  on public.cms_public_documents for insert to authenticated
  with check ((select auth.uid()) is not null);
create policy "cms authenticated publish update"
  on public.cms_public_documents for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);
create policy "cms authenticated publish delete"
  on public.cms_public_documents for delete to authenticated
  using ((select auth.uid()) is not null);

drop policy if exists "cms authenticated revisions" on public.cms_revisions;
create policy "cms authenticated revisions"
  on public.cms_revisions for all to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

drop policy if exists "media public read" on storage.objects;
