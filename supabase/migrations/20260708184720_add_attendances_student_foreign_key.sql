create index if not exists attendances_student_id_idx
on public.attendances (student_id);

alter table public.attendances
drop constraint if exists attendances_student_id_fkey;

alter table public.attendances
add constraint attendances_student_id_fkey
  foreign key (student_id)
  references public.students (id);
