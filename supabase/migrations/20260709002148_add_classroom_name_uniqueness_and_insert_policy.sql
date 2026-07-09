grant insert on public.classrooms to authenticated;

drop policy if exists classrooms_insert_own_school_admin on public.classrooms;
create policy classrooms_insert_own_school_admin
on public.classrooms
for insert
to authenticated
with check (
  (select internal.current_teacher_is_admin())
  and school_id = (select internal.current_teacher_school_id())
  and name is not null
  and btrim(name) <> ''
);

create unique index if not exists classrooms_school_id_normalized_name_uidx
on public.classrooms (school_id, lower(btrim(name)))
where school_id is not null and name is not null;
