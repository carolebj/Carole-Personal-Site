-- Remove anonymous access from legacy Client Brief data after public submission
-- paths have moved behind server bridges. The current main Design Brief bridge
-- and the dev Client Brief API both create signed uploads and write with
-- service_role; the legacy direct-write DesignBrief component is not routed on
-- dev and must not be made reachable again.
--
-- Authenticated access remains temporarily because the dashboard reads and
-- updates both brief tables and creates signed brief-assets URLs directly.
-- Restricting that role safely requires the editor authorization migration.

alter table public.brief_submissions enable row level security;
alter table public.brief_submissions force row level security;

revoke all privileges on table public.brief_submissions
  from public, anon, authenticated;
grant select, update on table public.brief_submissions to authenticated;
grant select, insert, update, delete on table public.brief_submissions
  to service_role;

alter table public.design_brief_submissions enable row level security;
alter table public.design_brief_submissions force row level security;

drop policy if exists "design brief public submit"
  on public.design_brief_submissions;
revoke all privileges on table public.design_brief_submissions
  from public, anon, authenticated;
grant select, update on table public.design_brief_submissions to authenticated;
grant select, insert, update, delete on table public.design_brief_submissions
  to service_role;

-- Public uploads are obsolete: the active API creates signed upload URLs with
-- service_role. Authenticated read/manage policies remain for the current
-- dashboard until editor authorization can replace the broad role.
drop policy if exists "brief assets public upload" on storage.objects;
