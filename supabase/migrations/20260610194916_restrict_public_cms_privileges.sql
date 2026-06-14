-- Keep the public CMS snapshot strictly read-only for anonymous visitors.

revoke all on table public.cms_public_documents from anon;
grant select on table public.cms_public_documents to anon;
