alter table public.attendance_clients
drop constraint if exists attendance_clients_check;

alter table public.attendance_clients
add constraint attendance_clients_exactly_one_scope_check
check (
  (default_classroom_id is not null) <> (owner_teacher_id is not null)
);

grant delete on public.attendance_clients to authenticated;

drop policy if exists attendance_clients_select_owned_or_school_admin on public.attendance_clients;
drop policy if exists attendance_clients_insert_owned_or_school_admin on public.attendance_clients;
drop policy if exists attendance_clients_update_owned_or_school_admin on public.attendance_clients;
drop policy if exists attendance_clients_delete_owned_or_school_admin on public.attendance_clients;

create policy attendance_clients_select_separated_scope
on public.attendance_clients
for select
to authenticated
using (
  owner_teacher_id = (select internal.current_teacher_id())
  or (
    (select internal.current_teacher_is_admin())
    and owner_teacher_id is null
    and school_id = (select internal.current_teacher_school_id())
  )
);

create policy attendance_clients_insert_teacher_scope
on public.attendance_clients
for insert
to authenticated
with check (
  owner_teacher_id = (select internal.current_teacher_id())
  and default_classroom_id is null
  and school_id = (select internal.current_teacher_school_id())
);

create policy attendance_clients_insert_classroom_scope_admin
on public.attendance_clients
for insert
to authenticated
with check (
  (select internal.current_teacher_is_admin())
  and owner_teacher_id is null
  and school_id = (select internal.current_teacher_school_id())
  and exists (
    select 1
    from public.classrooms classroom
    where classroom.id = attendance_clients.default_classroom_id
      and classroom.school_id = (select internal.current_teacher_school_id())
  )
);

create policy attendance_clients_update_teacher_scope
on public.attendance_clients
for update
to authenticated
using (
  owner_teacher_id = (select internal.current_teacher_id())
)
with check (
  owner_teacher_id = (select internal.current_teacher_id())
  and default_classroom_id is null
  and school_id = (select internal.current_teacher_school_id())
);

create policy attendance_clients_update_classroom_scope_admin
on public.attendance_clients
for update
to authenticated
using (
  (select internal.current_teacher_is_admin())
  and owner_teacher_id is null
  and school_id = (select internal.current_teacher_school_id())
)
with check (
  (select internal.current_teacher_is_admin())
  and owner_teacher_id is null
  and school_id = (select internal.current_teacher_school_id())
  and exists (
    select 1
    from public.classrooms classroom
    where classroom.id = attendance_clients.default_classroom_id
      and classroom.school_id = (select internal.current_teacher_school_id())
  )
);

create policy attendance_clients_update_teacher_scope_admin
on public.attendance_clients
for update
to authenticated
using (
  (select internal.current_teacher_is_admin())
  and owner_teacher_id = (select internal.current_teacher_id())
  and default_classroom_id is null
  and school_id = (select internal.current_teacher_school_id())
)
with check (
  owner_teacher_id = (select internal.current_teacher_id())
  and default_classroom_id is null
  and school_id = (select internal.current_teacher_school_id())
);

create policy attendance_clients_delete_teacher_scope
on public.attendance_clients
for delete
to authenticated
using (
  owner_teacher_id = (select internal.current_teacher_id())
);

create policy attendance_clients_delete_classroom_scope_admin
on public.attendance_clients
for delete
to authenticated
using (
  (select internal.current_teacher_is_admin())
  and owner_teacher_id is null
  and school_id = (select internal.current_teacher_school_id())
);

create policy attendance_clients_delete_teacher_scope_admin
on public.attendance_clients
for delete
to authenticated
using (
  (select internal.current_teacher_is_admin())
  and owner_teacher_id = (select internal.current_teacher_id())
  and default_classroom_id is null
  and school_id = (select internal.current_teacher_school_id())
);
