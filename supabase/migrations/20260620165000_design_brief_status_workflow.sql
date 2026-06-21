alter table public.design_brief_submissions
  add column if not exists processed_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table public.design_brief_submissions
  drop constraint if exists design_brief_submissions_status_check;

alter table public.design_brief_submissions
  add constraint design_brief_submissions_status_check
  check (status in ('new', 'reviewed', 'processed', 'archived'));
