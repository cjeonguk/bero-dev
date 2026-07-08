create or replace function public.refresh_lecture_sessions_for_server(
  target_lecture_id uuid,
  from_date date default ((now() at time zone 'Asia/Seoul')::date)
)
returns bigint
language sql
security definer
set search_path = public, internal, pg_temp
as $$
  select internal.refresh_lecture_sessions(target_lecture_id, from_date);
$$;

comment on function public.refresh_lecture_sessions_for_server(uuid, date)
is 'Server-side wrapper for refreshing future lecture sessions without exposing the internal schema.';

revoke all on function public.refresh_lecture_sessions_for_server(uuid, date) from public;
revoke all on function public.refresh_lecture_sessions_for_server(uuid, date) from anon;
revoke all on function public.refresh_lecture_sessions_for_server(uuid, date) from authenticated;
revoke all on function public.refresh_lecture_sessions_for_server(uuid, date) from service_role;

grant execute on function public.refresh_lecture_sessions_for_server(uuid, date) to service_role;
