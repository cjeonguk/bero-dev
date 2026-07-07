create type public.lecture_session_kind as enum (
  'regular',
  'makeup',
  'special'
);

create table public.lecture_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  lecture_id uuid references public.lectures(id) on delete cascade,
  school_id uuid not null references public.schools(id),
  semester_id bigint references public.semester_schedules(id),
  name text,
  module text,
  session_date date not null,
  period bigint not null check (period > 0),
  classroom_id uuid not null references public.classrooms(id),
  teacher_id uuid not null references public.teachers(id),
  kind public.lecture_session_kind not null default 'regular',
  note text,
  unique (classroom_id, session_date, period),
  unique (teacher_id, session_date, period)
);

create table public.lecture_session_enrollments (
  lecture_session_id uuid not null references public.lecture_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (lecture_session_id, student_id)
);

alter table public.attendances
add column lecture_session_id uuid references public.lecture_sessions(id) on delete cascade;

create unique index lecture_sessions_lecture_slot_idx
on public.lecture_sessions (lecture_id, session_date, period)
where lecture_id is not null;

create index lecture_sessions_teacher_id_session_date_idx
on public.lecture_sessions (teacher_id, session_date);

create index lecture_sessions_lecture_id_session_date_idx
on public.lecture_sessions (lecture_id, session_date);

create index lecture_sessions_session_date_period_idx
on public.lecture_sessions (session_date, period);

create index lecture_session_enrollments_student_id_idx
on public.lecture_session_enrollments (student_id);

create index attendances_lecture_session_id_idx
on public.attendances (lecture_session_id);

grant all on public.lecture_sessions to service_role;
grant all on public.lecture_session_enrollments to service_role;

grant select on public.lecture_sessions to authenticated;
grant select on public.lecture_session_enrollments to authenticated;

alter table public.lecture_sessions enable row level security;
alter table public.lecture_session_enrollments enable row level security;

drop policy if exists lecture_sessions_select_owned_or_school_admin on public.lecture_sessions;
create policy lecture_sessions_select_owned_or_school_admin
on public.lecture_sessions
for select
to authenticated
using (
  teacher_id = (select auth.uid())
  or exists (
    select 1
    from public.teachers teacher
    where teacher.id = (select auth.uid())
      and coalesce(teacher.is_admin, false)
      and teacher.school_id = lecture_sessions.school_id
  )
);

drop policy if exists lecture_session_enrollments_select_owned_or_school_admin on public.lecture_session_enrollments;
create policy lecture_session_enrollments_select_owned_or_school_admin
on public.lecture_session_enrollments
for select
to authenticated
using (
  exists (
    select 1
    from public.lecture_sessions lecture_session
    join public.teachers teacher
      on teacher.id = (select auth.uid())
    where lecture_session.id = lecture_session_enrollments.lecture_session_id
      and (
        lecture_session.teacher_id = teacher.id
        or (
          coalesce(teacher.is_admin, false)
          and lecture_session.school_id = teacher.school_id
        )
      )
  )
);

drop policy if exists attendances_select_owned_or_school_admin on public.attendances;
create policy attendances_select_owned_or_school_admin
on public.attendances
for select
to authenticated
using (
  exists (
    select 1
    from public.lecture_sessions lecture_session
    join public.teachers teacher
      on teacher.id = (select auth.uid())
    where lecture_session.id = attendances.lecture_session_id
      and (
        lecture_session.teacher_id = teacher.id
        or (
          coalesce(teacher.is_admin, false)
          and lecture_session.school_id = teacher.school_id
        )
      )
  )
);

create schema if not exists internal;

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

  with inserted_rows as (
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
    returning 1
  )
  select count(*) into inserted_count
  from inserted_rows;

  return inserted_count;
end;
$$;

comment on function internal.refresh_lecture_sessions(uuid, date)
is 'Refreshes future regular lecture sessions for a lecture based on its semester schedule and holiday settings.';

revoke all on function internal.refresh_lecture_sessions(uuid, date) from public;
revoke all on function internal.refresh_lecture_sessions(uuid, date) from anon;
revoke all on function internal.refresh_lecture_sessions(uuid, date) from authenticated;
revoke all on function internal.refresh_lecture_sessions(uuid, date) from service_role;

select internal.refresh_lecture_sessions(l.id, s.start_date)
from public.lectures l
join public.semester_schedules s
  on s.id = l.semester_id;

update public.attendances attendance
set lecture_session_id = lecture_session.id
from public.lecture_sessions lecture_session
where lecture_session.lecture_id = attendance.lecture_id
  and lecture_session.session_date = attendance.attendance_date
  and lecture_session.period = attendance.period
  and attendance.lecture_session_id is null;

do $$
begin
  if exists (
    select 1
    from public.attendances
    where lecture_session_id is null
  ) then
    raise exception 'attendances rows remain without lecture_session_id after backfill';
  end if;
end;
$$;

alter table public.attendances
drop constraint if exists fk_enrollments;

alter table public.attendances
drop constraint if exists attendances_student_lecture_date_period_key;

alter table public.attendances
alter column lecture_session_id set not null;

alter table public.attendances
add constraint attendances_student_lecture_session_key
unique (student_id, lecture_session_id);

alter table public.attendances
drop column lecture_id,
drop column attendance_date,
drop column period;

create or replace function internal.seed_daily_attendances(
  target_date date default ((now() at time zone 'Asia/Seoul')::date)
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count bigint;
begin
  with session_students as (
    select distinct
      lecture_session.id as lecture_session_id,
      lecture_session.lecture_id,
      lecture_session.session_date,
      lecture_session.period,
      enrollment.student_id
    from public.lecture_sessions lecture_session
    join public.enrollments enrollment
      on enrollment.lecture_id = lecture_session.lecture_id
     and (
       lecture_session.semester_id is null
       or enrollment.semester_id = lecture_session.semester_id
     )
    where lecture_session.session_date = target_date

    union

    select distinct
      lecture_session.id as lecture_session_id,
      lecture_session.lecture_id,
      lecture_session.session_date,
      lecture_session.period,
      lecture_session_enrollment.student_id
    from public.lecture_sessions lecture_session
    join public.lecture_session_enrollments lecture_session_enrollment
      on lecture_session_enrollment.lecture_session_id = lecture_session.id
    where lecture_session.session_date = target_date
  ), inserted_rows as (
    insert into public.attendances (
      student_id,
      lecture_session_id,
      status
    )
    select distinct
      session_student.student_id,
      session_student.lecture_session_id,
      'absent'::public.attendance_status
    from session_students session_student
    on conflict (student_id, lecture_session_id) do nothing
    returning 1
  )
  select count(*) into inserted_count
  from inserted_rows;

  return inserted_count;
end;
$$;

comment on function internal.seed_daily_attendances(date)
is 'Seeds absent attendance rows for all lecture sessions on a target KST date.';

revoke all on function internal.seed_daily_attendances(date) from public;
revoke all on function internal.seed_daily_attendances(date) from anon;
revoke all on function internal.seed_daily_attendances(date) from authenticated;
revoke all on function internal.seed_daily_attendances(date) from service_role;
