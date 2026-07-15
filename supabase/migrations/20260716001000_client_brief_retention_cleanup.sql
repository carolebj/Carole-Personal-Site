-- Complete the Client Brief retention chain: delete obsolete OTP challenges
-- and record the physical deletion of expired private PDF objects.

alter table public.estimator_deletion_logs
  add column if not exists storage_cleaned_at timestamptz,
  add column if not exists storage_cleanup_error text;

create index if not exists estimator_deletion_logs_storage_cleanup_idx
  on public.estimator_deletion_logs (id)
  where storage_cleanup_required and storage_cleaned_at is null;

grant update on table public.estimator_deletion_logs to service_role;

create or replace function public.purge_expired_brief_email_challenges(
  p_limit integer default 500
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  if p_limit < 1 or p_limit > 5000 then
    raise exception 'p_limit must be between 1 and 5000';
  end if;

  with obsolete as (
    select challenge.id
    from public.brief_email_challenges challenge
    where challenge.expires_at <= now() or challenge.consumed_at is not null
    order by challenge.created_at, challenge.id
    for update skip locked
    limit p_limit
  ), deleted as (
    delete from public.brief_email_challenges challenge
    using obsolete
    where challenge.id = obsolete.id
    returning challenge.id
  )
  select count(*)::integer into deleted_count from deleted;

  return deleted_count;
end;
$$;

revoke execute on function public.purge_expired_brief_email_challenges(integer)
  from public, anon, authenticated;
grant execute on function public.purge_expired_brief_email_challenges(integer)
  to service_role;

comment on function public.purge_expired_brief_email_challenges(integer) is
  'Server-only bounded purge for expired or consumed Client Brief email challenges.';
