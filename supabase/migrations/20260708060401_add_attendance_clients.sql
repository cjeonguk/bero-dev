create table public.attendance_clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  school_id uuid not null references public.schools(id),
  name text not null,
  token_hash text not null,
  active boolean not null default true,
  default_classroom_id uuid references public.classrooms(id),
  owner_teacher_id uuid references public.teachers(id),
  last_seen_at timestamp with time zone,
  check (
    default_classroom_id is not null
    or owner_teacher_id is not null
  )
);

create index attendance_clients_school_id_idx
on public.attendance_clients (school_id);

create index attendance_clients_default_classroom_id_idx
on public.attendance_clients (default_classroom_id);

create index attendance_clients_owner_teacher_id_idx
on public.attendance_clients (owner_teacher_id);

grant all on public.attendance_clients to service_role;

alter table public.attendance_clients enable row level security;
