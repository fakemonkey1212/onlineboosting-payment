CREATE OR REPLACE FUNCTION public.is_referrer_allowed(_referrer text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  with ref as (
    select lower(substring(_referrer from '^https?://([^/:?#]+)')) as host
  )
  select exists (
    select 1 from public.allowed_websites w, ref
    where ref.host is not null and length(trim(w.url)) > 0
      and (
        position(lower(trim(w.url)) in lower(_referrer)) = 1
        or ref.host = regexp_replace(lower(substring(trim(w.url) from '^(?:https?://)?(?:\*\.)?([^/:?#]+)')), '^www\.', '')
        or ref.host like '%.' || regexp_replace(lower(substring(trim(w.url) from '^(?:https?://)?(?:\*\.)?([^/:?#]+)')), '^www\.', '')
      )
  );
$$;