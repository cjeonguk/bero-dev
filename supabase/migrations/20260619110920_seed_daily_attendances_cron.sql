create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create schema if not exists internal;

create or replace function internal.seed_daily_attendances(
  target_date date default ((now() at time zone 'Asia/Seoul')::date)
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_day_name text;
  inserted_count bigint;
begin
  target_day_name := case extract(dow from target_date)::int
    when 0 then 'Sunday'
    when 1 then 'Monday'
    when 2 then 'Tuesday'
    when 3 then 'Wednesday'
    when 4 then 'Thursday'
    when 5 then 'Friday'
    when 6 then 'Saturday'
  end;

  with inserted_rows as (
    insert into public.attendances (
      student_id,
      lecture_id,
      attendance_date,
      status,
      period
    )
    select distinct
      e.student_id,
      l.id,
      target_date,
      'absent'::public.attendance_status,
      (schedule_entry ->> 'period')::bigint
    from public.lectures l
    join public.semester_schedules s
      on s.id = l.semester_id
    join public.enrollments e
      on e.lecture_id = l.id
     and e.semester_id = s.id
    cross join lateral unnest(coalesce(l.schedule, array[]::jsonb[])) as schedule_entry
    where s.start_date <= target_date
      and s.end_date >= target_date
      and schedule_entry ->> 'day' = target_day_name
      and not exists (
        select 1
        from unnest(coalesce(l.holiday, array[]::jsonb[])) as holiday_entry
        where holiday_entry ->> 'date' = target_date::text
          and (holiday_entry ->> 'period')::bigint = (schedule_entry ->> 'period')::bigint
      )
    on conflict (student_id, lecture_id, attendance_date, period) do nothing
    returning 1
  )
  select count(*) into inserted_count
  from inserted_rows;

  return inserted_count;
end;
$$;

comment on function internal.seed_daily_attendances(date)
is 'Seeds absent attendance rows for every scheduled lecture on a target KST date, excluding holiday date/period entries.';

revoke all on function internal.seed_daily_attendances(date) from public;
revoke all on function internal.seed_daily_attendances(date) from anon;
revoke all on function internal.seed_daily_attendances(date) from authenticated;
revoke all on function internal.seed_daily_attendances(date) from service_role;

select cron.schedule(
  'seed-daily-attendances-kst-0600',
  '0 21 * * *',
  $$select internal.seed_daily_attendances((now() at time zone 'Asia/Seoul')::date);$$
);
