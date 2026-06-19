alter table public.attendances
add constraint attendances_student_lecture_date_period_key
unique (student_id, lecture_id, attendance_date, period);
