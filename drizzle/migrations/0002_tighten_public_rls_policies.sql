-- Referrer allow-check callable by anonymous visitors without exposing the table
create or replace function public.is_referrer_allowed(_referrer text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_websites
    where _referrer is not null
      and length(trim(url)) > 0
      and position(lower(trim(url)) in lower(_referrer)) = 1
  );
$$;

grant execute on function public.is_referrer_allowed(text) to anon, authenticated;

-- Admin-only listing of blocked access logs
create or replace function public.admin_list_blocked_logs(_password text)
returns setof blocked_access_logs
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public._is_admin_password(_password) then
    raise exception 'unauthorized';
  end if;
  return query select * from public.blocked_access_logs order by blocked_at desc limit 50;
end;
$$;

grant execute on function public.admin_list_blocked_logs(text) to anon, authenticated;

-- Remove public read policies (reads now go through security-definer RPCs)
drop policy if exists "Anyone can read allowed websites" on public.allowed_websites;
drop policy if exists "Anyone can read payment methods" on public.payment_methods;
drop policy if exists "Anyone can read blocked logs" on public.blocked_access_logs;

-- Replace the tautological insert policy with a real validation check
drop policy if exists "Anyone can insert blocked logs" on public.blocked_access_logs;
create policy "Anyone can insert blocked logs"
on public.blocked_access_logs
for insert
to public
with check (char_length(referrer) <= 500);