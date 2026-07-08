create or replace function internal.refresh_lecture_sessions(
  target_lecture_id uuid,
  from_date date default ((now() at time zone 'Asia/Seoul')::date)
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  lecture_record record;
  effective_from_date date;
  inserted_count bigint;
begin
  select
    l.id,
    l.name,
    l.module,
    l.schedule,
    l.holiday,
    l.classroom_id,
    l.teacher_id,
    s.id as semester_id,
    s.school_id,
    s.start_date,
    s.end_date
  into lecture_record
  from public.lectures l
  join public.semester_schedules s
    on s.id = l.semester_id
  where l.id = target_lecture_id;

  if not found then
    return 0;
  end if;

  if lecture_record.classroom_id is null
    or lecture_record.teacher_id is null
    or lecture_record.start_date is null
    or lecture_record.end_date is null
    or lecture_record.school_id is null then
    return 0;
  end if;

  effective_from_date := greatest(lecture_record.start_date, from_date);

  if effective_from_date > lecture_record.end_date then
    return 0;
  end if;

  delete from public.lecture_sessions
  where lecture_id = target_lecture_id
    and kind = 'regular'
    and session_date >= effective_from_date;

  with inserted_sessions as (
    insert into public.lecture_sessions (
      lecture_id,
      school_id,
      semester_id,
      name,
      module,
      session_date,
      period,
      classroom_id,
      teacher_id,
      kind
    )
    select
      lecture_record.id,
      lecture_record.school_id,
      lecture_record.semester_id,
      lecture_record.name,
      lecture_record.module,
      calendar_dates.session_date::date,
      (schedule_entry ->> 'period')::bigint,
      lecture_record.classroom_id,
      lecture_record.teacher_id,
      'regular'::public.lecture_session_kind
    from generate_series(
      effective_from_date,
      lecture_record.end_date,
      interval '1 day'
    ) as calendar_dates(session_date)
    cross join lateral unnest(coalesce(lecture_record.schedule, array[]::jsonb[])) as schedule_entry
    where schedule_entry ->> 'day' = case extract(dow from calendar_dates.session_date)::int
      when 0 then 'Sunday'
      when 1 then 'Monday'
      when 2 then 'Tuesday'
      when 3 then 'Wednesday'
      when 4 then 'Thursday'
      when 5 then 'Friday'
      when 6 then 'Saturday'
    end
      and not exists (
        select 1
        from unnest(coalesce(lecture_record.holiday, array[]::jsonb[])) as holiday_entry
        where holiday_entry ->> 'date' = calendar_dates.session_date::date::text
          and (holiday_entry ->> 'period')::bigint = (schedule_entry ->> 'period')::bigint
      )
    returning id, lecture_id, semester_id
  ), inserted_attendances as (
    insert into public.attendances (
      student_id,
      lecture_session_id,
      status
    )
    select distinct
      enrollment.student_id,
      inserted_session.id,
      'absent'::public.attendance_status
    from inserted_sessions inserted_session
    join public.enrollments enrollment
      on enrollment.lecture_id = inserted_session.lecture_id
     and (
       inserted_session.semester_id is null
       or enrollment.semester_id = inserted_session.semester_id
     )
    on conflict (student_id, lecture_session_id) do nothing
    returning 1
  )
  select count(*) into inserted_count
  from inserted_sessions;

  return inserted_count;
end;
$$;

create or replace function internal.sync_future_session_attendances(
  target_lecture_id uuid,
  target_student_id uuid,
  sync_mode text,
  from_date date default ((now() at time zone 'Asia/Seoul')::date)
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_count bigint;
begin
  if sync_mode = 'add' then
    with inserted_rows as (
      insert into public.attendances (
        student_id,
        lecture_session_id,
        status
      )
      select
        target_student_id,
        lecture_session.id,
        'absent'::public.attendance_status
      from public.lecture_sessions lecture_session
      where lecture_session.lecture_id = target_lecture_id
        and lecture_session.kind = 'regular'
        and lecture_session.session_date >= from_date
      on conflict (student_id, lecture_session_id) do nothing
      returning 1
    )
    select count(*) into affected_count
    from inserted_rows;

    return affected_count;
  end if;

  if sync_mode = 'remove' then
    with deleted_rows as (
      delete from public.attendances attendance
      using public.lecture_sessions lecture_session
      where lecture_session.id = attendance.lecture_session_id
        and lecture_session.lecture_id = target_lecture_id
        and lecture_session.kind = 'regular'
        and lecture_session.session_date >= from_date
        and attendance.student_id = target_student_id
      returning 1
    )
    select count(*) into affected_count
    from deleted_rows;

    return affected_count;
  end if;

  raise exception 'unsupported sync_mode: %', sync_mode;
end;
$$;

comment on function internal.sync_future_session_attendances(uuid, uuid, text, date)
is 'Synchronizes future regular-session attendance rows for a single lecture/student pair.';

revoke all on function internal.sync_future_session_attendances(uuid, uuid, text, date) from public;
revoke all on function internal.sync_future_session_attendances(uuid, uuid, text, date) from anon;
revoke all on function internal.sync_future_session_attendances(uuid, uuid, text, date) from authenticated;
revoke all on function internal.sync_future_session_attendances(uuid, uuid, text, date) from service_role;
grant execute on function internal.sync_future_session_attendances(uuid, uuid, text, date) to service_role;

create or replace function public.sync_future_session_attendances_for_server(
  target_lecture_id uuid,
  target_student_id uuid,
  sync_mode text,
  from_date date default ((now() at time zone 'Asia/Seoul')::date)
)
returns bigint
language sql
security definer
set search_path = public, internal, pg_temp
as $$
  select internal.sync_future_session_attendances(
    target_lecture_id,
    target_student_id,
    sync_mode,
    from_date
  );
$$;

comment on function public.sync_future_session_attendances_for_server(uuid, uuid, text, date)
is 'Server-side wrapper for synchronizing future regular-session attendance rows.';

revoke all on function public.sync_future_session_attendances_for_server(uuid, uuid, text, date) from public;
revoke all on function public.sync_future_session_attendances_for_server(uuid, uuid, text, date) from anon;
revoke all on function public.sync_future_session_attendances_for_server(uuid, uuid, text, date) from authenticated;
revoke all on function public.sync_future_session_attendances_for_server(uuid, uuid, text, date) from service_role;
grant execute on function public.sync_future_session_attendances_for_server(uuid, uuid, text, date) to service_role;

do $$
declare
  cron_job_id bigint;
begin
  select jobid into cron_job_id
  from cron.job
  where jobname = 'seed-daily-attendances-kst-0600'
  limit 1;

  if cron_job_id is not null then
    perform cron.unschedule(cron_job_id);
  end if;
end;
$$;

drop function if exists internal.seed_daily_attendances(date);

drop policy if exists lecture_session_enrollments_select_owned_or_school_admin on public.lecture_session_enrollments;
drop table if exists public.lecture_session_enrollments;
