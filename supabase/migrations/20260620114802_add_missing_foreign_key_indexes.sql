create index if not exists classrooms_school_id_idx
on public.classrooms (school_id);

create index if not exists enrollments_lecture_id_idx
on public.enrollments (lecture_id);

create index if not exists enrollments_semester_id_idx
on public.enrollments (semester_id);

create index if not exists lectures_semester_id_idx
on public.lectures (semester_id);

create index if not exists lectures_classroom_id_idx
on public.lectures (classroom_id);

create index if not exists lectures_teacher_id_idx
on public.lectures (teacher_id);

create index if not exists schools_current_semester_id_idx
on public.schools (current_semester_id);

create index if not exists semester_schedules_school_id_idx
on public.semester_schedules (school_id);

create index if not exists students_last_detected_place_idx
on public.students (last_detected_place);

create index if not exists students_school_id_idx
on public.students (school_id);

create index if not exists teachers_school_id_idx
on public.teachers (school_id);

create index if not exists temporal_lectures_classroom_id_idx
on public.temporal_lectures (classroom_id);

create index if not exists temporal_lectures_teacher_id_idx
on public.temporal_lectures (teacher_id);
