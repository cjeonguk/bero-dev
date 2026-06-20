revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on all sequences in schema public from anon;
revoke all on all sequences in schema public from authenticated;
revoke all on all functions in schema public from anon;
revoke all on all functions in schema public from authenticated;

alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on tables from authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke all on sequences from authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon;
alter default privileges for role postgres in schema public revoke all on functions from authenticated;

grant usage on schema public to authenticated;
grant usage on schema public to service_role;

grant select on public.attendances to authenticated;
grant select on public.classrooms to authenticated;
grant select on public.enrollments to authenticated;
grant select on public.lectures to authenticated;
grant select on public.schools to authenticated;
grant select on public.semester_schedules to authenticated;
grant select on public.students to authenticated;
grant select on public.teachers to authenticated;

alter table public.attendances enable row level security;
alter table public.classrooms enable row level security;
alter table public.enrollments enable row level security;
alter table public.lectures enable row level security;
alter table public.schools enable row level security;
alter table public.semester_schedules enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.temporal_lectures enable row level security;

drop policy if exists teachers_select_self on public.teachers;
create policy teachers_select_self
on public.teachers
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists schools_select_own_school on public.schools;
create policy schools_select_own_school
on public.schools
for select
to authenticated
using (
  exists (
    select 1
    from public.teachers teacher
    where teacher.id = (select auth.uid())
      and teacher.school_id = schools.id
  )
);

drop policy if exists classrooms_select_own_school on public.classrooms;
create policy classrooms_select_own_school
on public.classrooms
for select
to authenticated
using (
  exists (
    select 1
    from public.teachers teacher
    where teacher.id = (select auth.uid())
      and teacher.school_id = classrooms.school_id
  )
);

drop policy if exists semester_schedules_select_own_school on public.semester_schedules;
create policy semester_schedules_select_own_school
on public.semester_schedules
for select
to authenticated
using (
  exists (
    select 1
    from public.teachers teacher
    where teacher.id = (select auth.uid())
      and teacher.school_id = semester_schedules.school_id
  )
);

drop policy if exists lectures_select_owned_or_school_admin on public.lectures;
create policy lectures_select_owned_or_school_admin
on public.lectures
for select
to authenticated
using (
  teacher_id = (select auth.uid())
  or exists (
    select 1
    from public.teachers teacher
    join public.semester_schedules semester
      on semester.id = lectures.semester_id
    where teacher.id = (select auth.uid())
      and coalesce(teacher.is_admin, false)
      and teacher.school_id = semester.school_id
  )
);

drop policy if exists enrollments_select_owned_or_school_admin on public.enrollments;
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
    join public.teachers teacher
      on teacher.id = (select auth.uid())
    where lecture.id = enrollments.lecture_id
      and (
        lecture.teacher_id = teacher.id
        or (
          coalesce(teacher.is_admin, false)
          and semester.school_id = teacher.school_id
        )
      )
  )
);

drop policy if exists students_select_owned_or_school_admin on public.students;
create policy students_select_owned_or_school_admin
on public.students
for select
to authenticated
using (
  exists (
    select 1
    from public.enrollments enrollment
    join public.lectures lecture
      on lecture.id = enrollment.lecture_id
    left join public.semester_schedules semester
      on semester.id = lecture.semester_id
    join public.teachers teacher
      on teacher.id = (select auth.uid())
    where enrollment.student_id = students.id
      and (
        lecture.teacher_id = teacher.id
        or (
          coalesce(teacher.is_admin, false)
          and semester.school_id = teacher.school_id
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
    from public.lectures lecture
    left join public.semester_schedules semester
      on semester.id = lecture.semester_id
    join public.teachers teacher
      on teacher.id = (select auth.uid())
    where lecture.id = attendances.lecture_id
      and (
        lecture.teacher_id = teacher.id
        or (
          coalesce(teacher.is_admin, false)
          and semester.school_id = teacher.school_id
        )
      )
  )
);
