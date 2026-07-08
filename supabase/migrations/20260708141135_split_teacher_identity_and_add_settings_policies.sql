create type public.student_status as enum (
  'active',
  'inactive',
  'graduated',
  'leave'
);

alter table public.students
add column status public.student_status not null default 'active';

create index students_status_idx on public.students (status);

alter table public.teachers
add column user_id uuid,
add column new_id uuid not null default gen_random_uuid();

update public.teachers
set user_id = id;

alter table public.lectures
drop constraint if exists lecturess_teacher_id_fkey;

alter table public.lecture_sessions
drop constraint if exists lecture_sessions_teacher_id_fkey;

alter table public.attendance_clients
drop constraint if exists attendance_clients_owner_teacher_id_fkey;

alter table public.teachers
drop constraint if exists teachers_pkey,
drop constraint if exists teachers_id_fkey;

update public.teachers
set id = new_id;

update public.lectures lecture
set teacher_id = teacher.id
from public.teachers teacher
where lecture.teacher_id = teacher.user_id;

update public.lecture_sessions lecture_session
set teacher_id = teacher.id
from public.teachers teacher
where lecture_session.teacher_id = teacher.user_id;

update public.attendance_clients attendance_client
set owner_teacher_id = teacher.id
from public.teachers teacher
where attendance_client.owner_teacher_id = teacher.user_id;

alter table public.teachers
drop column new_id;

alter table public.teachers
add constraint teachers_pkey primary key (id);

alter table public.teachers
alter column id set default gen_random_uuid();

alter table public.teachers
add constraint teachers_user_id_key unique (user_id),
add constraint teachers_user_id_fkey
  foreign key (user_id)
  references auth.users (id)
  on delete set null;

alter table public.lectures
add constraint lecturess_teacher_id_fkey
  foreign key (teacher_id)
  references public.teachers (id);

alter table public.lecture_sessions
add constraint lecture_sessions_teacher_id_fkey
  foreign key (teacher_id)
  references public.teachers (id);

alter table public.attendance_clients
add constraint attendance_clients_owner_teacher_id_fkey
  foreign key (owner_teacher_id)
  references public.teachers (id);

grant select, update on public.teachers to authenticated;
grant select, insert, update on public.students to authenticated;
grant select, insert, update on public.lectures to authenticated;
grant select, insert, delete on public.enrollments to authenticated;
grant select, insert, update on public.attendance_clients to authenticated;
grant select, insert, update on public.attendances to authenticated;

create schema if not exists internal;

grant usage on schema internal to authenticated;
grant usage on schema internal to service_role;

create or replace function internal.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select teacher.id
  from public.teachers teacher
  where teacher.user_id = (select auth.uid())
  limit 1
$$;

create or replace function internal.current_teacher_school_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select teacher.school_id
  from public.teachers teacher
  where teacher.user_id = (select auth.uid())
  limit 1
$$;

create or replace function internal.current_teacher_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(teacher.is_admin, false)
  from public.teachers teacher
  where teacher.user_id = (select auth.uid())
  limit 1
$$;

revoke all on function internal.current_teacher_id() from public;
revoke all on function internal.current_teacher_school_id() from public;
revoke all on function internal.current_teacher_is_admin() from public;
grant execute on function internal.current_teacher_id() to authenticated;
grant execute on function internal.current_teacher_school_id() to authenticated;
grant execute on function internal.current_teacher_is_admin() to authenticated;
grant execute on function internal.current_teacher_id() to service_role;
grant execute on function internal.current_teacher_school_id() to service_role;
grant execute on function internal.current_teacher_is_admin() to service_role;

drop policy if exists teachers_select_self on public.teachers;
drop policy if exists teachers_select_self_or_school_admin on public.teachers;
drop policy if exists teachers_update_self_profile on public.teachers;
drop policy if exists teachers_insert_school_admin on public.teachers;
drop policy if exists teachers_update_school_admin on public.teachers;
create policy teachers_select_self_or_school_admin
on public.teachers
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (
    (select internal.current_teacher_is_admin())
    and school_id = (select internal.current_teacher_school_id())
  )
);

create policy teachers_update_self_profile
on public.teachers
for update
to authenticated
using (id = (select internal.current_teacher_id()))
with check (
  id = (select internal.current_teacher_id())
  and user_id = (select auth.uid())
  and school_id = (select internal.current_teacher_school_id())
  and coalesce(is_admin, false) = coalesce((select internal.current_teacher_is_admin()), false)
);

create policy teachers_insert_school_admin
on public.teachers
for insert
to authenticated
with check (
  (select internal.current_teacher_is_admin())
  and school_id = (select internal.current_teacher_school_id())
);

create policy teachers_update_school_admin
on public.teachers
for update
to authenticated
using (
  (select internal.current_teacher_is_admin())
  and school_id = (select internal.current_teacher_school_id())
)
with check (
  (select internal.current_teacher_is_admin())
  and school_id = (select internal.current_teacher_school_id())
);

drop policy if exists schools_select_own_school on public.schools;
create policy schools_select_own_school
on public.schools
for select
to authenticated
using (id = (select internal.current_teacher_school_id()));

drop policy if exists classrooms_select_own_school on public.classrooms;
create policy classrooms_select_own_school
on public.classrooms
for select
to authenticated
using (school_id = (select internal.current_teacher_school_id()));

drop policy if exists semester_schedules_select_own_school on public.semester_schedules;
create policy semester_schedules_select_own_school
on public.semester_schedules
for select
to authenticated
using (school_id = (select internal.current_teacher_school_id()));

drop policy if exists lectures_select_owned_or_school_admin on public.lectures;
drop policy if exists lectures_insert_owned_or_school_admin on public.lectures;
drop policy if exists lectures_update_owned_or_school_admin on public.lectures;
create policy lectures_select_owned_or_school_admin
on public.lectures
for select
to authenticated
using (
  teacher_id = (select internal.current_teacher_id())
  or (
    (select internal.current_teacher_is_admin())
    and exists (
      select 1
      from public.semester_schedules semester
      where semester.id = lectures.semester_id
        and semester.school_id = (select internal.current_teacher_school_id())
    )
  )
);

create policy lectures_insert_owned_or_school_admin
on public.lectures
for insert
to authenticated
with check (
  exists (
    select 1
    from public.semester_schedules semester
    join public.classrooms classroom
      on classroom.id = lectures.classroom_id
    where semester.id = lectures.semester_id
      and semester.school_id = (select internal.current_teacher_school_id())
      and classroom.school_id = (select internal.current_teacher_school_id())
      and (
        lectures.teacher_id = (select internal.current_teacher_id())
        or (select internal.current_teacher_is_admin())
      )
  )
);

create policy lectures_update_owned_or_school_admin
on public.lectures
for update
to authenticated
using (
  teacher_id = (select internal.current_teacher_id())
  or (
    (select internal.current_teacher_is_admin())
    and exists (
      select 1
      from public.semester_schedules semester
      where semester.id = lectures.semester_id
        and semester.school_id = (select internal.current_teacher_school_id())
    )
  )
)
with check (
  exists (
    select 1
    from public.semester_schedules semester
    join public.classrooms classroom
      on classroom.id = lectures.classroom_id
    where semester.id = lectures.semester_id
      and semester.school_id = (select internal.current_teacher_school_id())
      and classroom.school_id = (select internal.current_teacher_school_id())
      and (
        lectures.teacher_id = (select internal.current_teacher_id())
        or (select internal.current_teacher_is_admin())
      )
  )
);

drop policy if exists enrollments_select_owned_or_school_admin on public.enrollments;
drop policy if exists enrollments_insert_owned_or_school_admin on public.enrollments;
drop policy if exists enrollments_delete_owned_or_school_admin on public.enrollments;
create policy enrollments_select_owned_or_school_admin
on public.enrollments
for select
to authenticated
using (
  exists (
    select 1
    from public.lectures lecture
    left join public.semester_schedules semester
      on semester.id = lecture.semester_id
    where lecture.id = enrollments.lecture_id
      and (
        lecture.teacher_id = (select internal.current_teacher_id())
        or (
          (select internal.current_teacher_is_admin())
          and semester.school_id = (select internal.current_teacher_school_id())
        )
      )
  )
);

create policy enrollments_insert_owned_or_school_admin
on public.enrollments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.lectures lecture
    left join public.semester_schedules semester
      on semester.id = lecture.semester_id
    join public.students student
      on student.id = enrollments.student_id
    where lecture.id = enrollments.lecture_id
      and student.school_id = (select internal.current_teacher_school_id())
      and (
        lecture.teacher_id = (select internal.current_teacher_id())
        or (
          (select internal.current_teacher_is_admin())
          and semester.school_id = (select internal.current_teacher_school_id())
        )
      )
  )
);

create policy enrollments_delete_owned_or_school_admin
on public.enrollments
for delete
to authenticated
using (
  exists (
    select 1
    from public.lectures lecture
    left join public.semester_schedules semester
      on semester.id = lecture.semester_id
    where lecture.id = enrollments.lecture_id
      and (
        lecture.teacher_id = (select internal.current_teacher_id())
        or (
          (select internal.current_teacher_is_admin())
          and semester.school_id = (select internal.current_teacher_school_id())
        )
      )
  )
);

drop policy if exists students_select_owned_or_school_admin on public.students;
drop policy if exists students_insert_school_admin on public.students;
drop policy if exists students_update_school_admin on public.students;
create policy students_select_owned_or_school_admin
on public.students
for select
to authenticated
using (school_id = (select internal.current_teacher_school_id()));

create policy students_insert_school_admin
on public.students
for insert
to authenticated
with check (
  (select internal.current_teacher_is_admin())
  and school_id = (select internal.current_teacher_school_id())
);

create policy students_update_school_admin
on public.students
for update
to authenticated
using (
  (select internal.current_teacher_is_admin())
  and school_id = (select internal.current_teacher_school_id())
)
with check (
  (select internal.current_teacher_is_admin())
  and school_id = (select internal.current_teacher_school_id())
);

drop policy if exists lecture_sessions_select_owned_or_school_admin on public.lecture_sessions;
create policy lecture_sessions_select_owned_or_school_admin
on public.lecture_sessions
for select
to authenticated
using (
  teacher_id = (select internal.current_teacher_id())
  or (
    (select internal.current_teacher_is_admin())
    and school_id = (select internal.current_teacher_school_id())
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
    where lecture_session.id = lecture_session_enrollments.lecture_session_id
      and (
        lecture_session.teacher_id = (select internal.current_teacher_id())
        or (
          (select internal.current_teacher_is_admin())
          and lecture_session.school_id = (select internal.current_teacher_school_id())
        )
      )
  )
);

drop policy if exists attendances_select_owned_or_school_admin on public.attendances;
drop policy if exists attendances_insert_school_admin on public.attendances;
drop policy if exists attendances_update_school_admin on public.attendances;
create policy attendances_select_owned_or_school_admin
on public.attendances
for select
to authenticated
using (
  exists (
    select 1
    from public.lecture_sessions lecture_session
    where lecture_session.id = attendances.lecture_session_id
      and (
        lecture_session.teacher_id = (select internal.current_teacher_id())
        or (
          (select internal.current_teacher_is_admin())
          and lecture_session.school_id = (select internal.current_teacher_school_id())
        )
      )
  )
);

create policy attendances_insert_school_admin
on public.attendances
for insert
to authenticated
with check (
  (select internal.current_teacher_is_admin())
  and exists (
    select 1
    from public.lecture_sessions lecture_session
    where lecture_session.id = attendances.lecture_session_id
      and lecture_session.school_id = (select internal.current_teacher_school_id())
  )
);

create policy attendances_update_school_admin
on public.attendances
for update
to authenticated
using (
  (select internal.current_teacher_is_admin())
  and exists (
    select 1
    from public.lecture_sessions lecture_session
    where lecture_session.id = attendances.lecture_session_id
      and lecture_session.school_id = (select internal.current_teacher_school_id())
  )
)
with check (
  (select internal.current_teacher_is_admin())
  and exists (
    select 1
    from public.lecture_sessions lecture_session
    where lecture_session.id = attendances.lecture_session_id
      and lecture_session.school_id = (select internal.current_teacher_school_id())
  )
);

drop policy if exists attendance_clients_select_owned_or_school_admin on public.attendance_clients;
drop policy if exists attendance_clients_insert_owned_or_school_admin on public.attendance_clients;
drop policy if exists attendance_clients_update_owned_or_school_admin on public.attendance_clients;
create policy attendance_clients_select_owned_or_school_admin
on public.attendance_clients
for select
to authenticated
using (
  owner_teacher_id = (select internal.current_teacher_id())
  or (
    (select internal.current_teacher_is_admin())
    and school_id = (select internal.current_teacher_school_id())
  )
);

create policy attendance_clients_insert_owned_or_school_admin
on public.attendance_clients
for insert
to authenticated
with check (
  school_id = (select internal.current_teacher_school_id())
  and (
    owner_teacher_id = (select internal.current_teacher_id())
    or (
      (select internal.current_teacher_is_admin())
      and (
        owner_teacher_id is null
        or exists (
          select 1
          from public.teachers managed_teacher
          where managed_teacher.id = attendance_clients.owner_teacher_id
            and managed_teacher.school_id = (select internal.current_teacher_school_id())
        )
      )
    )
  )
  and (
    default_classroom_id is null
    or exists (
      select 1
      from public.classrooms classroom
      where classroom.id = attendance_clients.default_classroom_id
        and classroom.school_id = (select internal.current_teacher_school_id())
    )
  )
);

create policy attendance_clients_update_owned_or_school_admin
on public.attendance_clients
for update
to authenticated
using (
  owner_teacher_id = (select internal.current_teacher_id())
  or (
    (select internal.current_teacher_is_admin())
    and school_id = (select internal.current_teacher_school_id())
  )
)
with check (
  school_id = (select internal.current_teacher_school_id())
  and (
    owner_teacher_id = (select internal.current_teacher_id())
    or (
      (select internal.current_teacher_is_admin())
      and (
        owner_teacher_id is null
        or exists (
          select 1
          from public.teachers managed_teacher
          where managed_teacher.id = attendance_clients.owner_teacher_id
            and managed_teacher.school_id = (select internal.current_teacher_school_id())
        )
      )
    )
  )
  and (
    default_classroom_id is null
    or exists (
      select 1
      from public.classrooms classroom
      where classroom.id = attendance_clients.default_classroom_id
        and classroom.school_id = (select internal.current_teacher_school_id())
    )
  )
);
