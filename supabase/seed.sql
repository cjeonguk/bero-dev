SET session_replication_role = replica;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Minimal local auth users for development.
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'e4d7fd60-b39f-4dec-99c0-a847dacc0572',
    'authenticated',
    'authenticated',
    'teacher-alpha@example.com',
    extensions.crypt('dev-password-1', extensions.gen_salt('bf')),
    '2026-01-01 09:00:00+00',
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Teacher Alpha", "email_verified": true}',
    NULL,
    '2026-01-01 09:00:00+00',
    '2026-01-01 09:00:00+00',
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '85991a44-f17b-4d20-85bc-9a56ec86fbd6',
    'authenticated',
    'authenticated',
    'teacher-bravo@example.com',
    extensions.crypt('dev-password-2', extensions.gen_salt('bf')),
    '2026-02-01 09:00:00+00',
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Teacher Bravo", "email_verified": true}',
    NULL,
    '2026-02-01 09:00:00+00',
    '2026-02-01 09:00:00+00',
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '07993eea-ca5c-4902-b527-fcfeb7e5fdab',
    'authenticated',
    'authenticated',
    'teacher-charlie@example.com',
    extensions.crypt('dev-password-3', extensions.gen_salt('bf')),
    '2026-03-01 09:00:00+00',
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Teacher Charlie", "email_verified": true}',
    NULL,
    '2026-03-01 09:00:00+00',
    '2026-03-01 09:00:00+00',
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL,
    false
  );

INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  id
) VALUES
  (
    'e4d7fd60-b39f-4dec-99c0-a847dacc0572',
    'e4d7fd60-b39f-4dec-99c0-a847dacc0572',
    '{"sub": "e4d7fd60-b39f-4dec-99c0-a847dacc0572", "email": "teacher-alpha@example.com", "email_verified": true}',
    'email',
    NULL,
    '2026-01-01 09:00:00+00',
    '2026-01-01 09:00:00+00',
    '91ff4eb6-cdd0-47e9-ab67-16ac8d877d68'
  ),
  (
    '85991a44-f17b-4d20-85bc-9a56ec86fbd6',
    '85991a44-f17b-4d20-85bc-9a56ec86fbd6',
    '{"sub": "85991a44-f17b-4d20-85bc-9a56ec86fbd6", "email": "teacher-bravo@example.com", "email_verified": true}',
    'email',
    NULL,
    '2026-02-01 09:00:00+00',
    '2026-02-01 09:00:00+00',
    '0d93bb7f-3164-4fe7-bc7b-99375fdaa163'
  ),
  (
    '07993eea-ca5c-4902-b527-fcfeb7e5fdab',
    '07993eea-ca5c-4902-b527-fcfeb7e5fdab',
    '{"sub": "07993eea-ca5c-4902-b527-fcfeb7e5fdab", "email": "teacher-charlie@example.com", "email_verified": true}',
    'email',
    NULL,
    '2026-03-01 09:00:00+00',
    '2026-03-01 09:00:00+00',
    '392c556f-00f2-4022-9bd9-093512ae94ee'
  );

INSERT INTO public.schools (id, created_at, name, current_semester_id) VALUES
  ('3fbf29fd-21f5-45ba-b855-4dbcaa72eb19', '2026-01-01 09:00:00+00', 'Northfield High', NULL),
  ('d4289665-0d3e-4784-a06b-e97f2d595a5c', '2026-01-01 09:05:00+00', 'Riverview High', 1),
  ('b8ab83ad-39f4-44b7-91c7-f28794adc666', '2026-02-01 09:05:00+00', 'Lakeside Academy', 2),
  ('f52d2304-22cb-4ea0-88f8-a196c6ef02ae', '2026-03-01 09:05:00+00', 'Summit Prep', 3);

INSERT INTO public.classrooms (id, created_at, name, school_id) VALUES
  ('0d63e674-9f65-407f-865a-870e3ff524f0', '2026-01-01 09:10:00+00', 'Room A101', 'd4289665-0d3e-4784-a06b-e97f2d595a5c'),
  ('946388fd-1573-4e1a-9ad4-e2030155cbd1', '2026-02-01 09:10:00+00', 'Room B201', 'b8ab83ad-39f4-44b7-91c7-f28794adc666'),
  ('7bfc3401-5379-45ff-b412-df29b8fdd23a', '2026-03-01 09:10:00+00', 'Room C301', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae');

INSERT INTO public.semester_schedules (
  id,
  created_at,
  school_id,
  name,
  start_date,
  end_date,
  start_period,
  end_period,
  period_schedules
) VALUES
  (
    1,
    '2026-01-01 09:15:00+00',
    'd4289665-0d3e-4784-a06b-e97f2d595a5c',
    '2026 Spring',
    '2026-01-05',
    '2026-06-30',
    1,
    8,
    ARRAY[
      '{"period": 1, "end_time": "09:20+09", "start_time": "08:30+09"}'::jsonb,
      '{"period": 2, "end_time": "10:20+09", "start_time": "09:30+09"}'::jsonb,
      '{"period": 3, "end_time": "11:20+09", "start_time": "10:30+09"}'::jsonb,
      '{"period": 4, "end_time": "12:20+09", "start_time": "11:30+09"}'::jsonb,
      '{"period": 5, "end_time": "14:30+09", "start_time": "13:40+09"}'::jsonb,
      '{"period": 6, "end_time": "15:30+09", "start_time": "14:40+09"}'::jsonb,
      '{"period": 7, "end_time": "16:30+09", "start_time": "15:40+09"}'::jsonb,
      '{"period": 8, "end_time": "17:30+09", "start_time": "16:40+09"}'::jsonb
    ]
  ),
  (
    2,
    '2026-02-01 09:15:00+00',
    'b8ab83ad-39f4-44b7-91c7-f28794adc666',
    '2026 Term 1',
    CURRENT_DATE - 30,
    CURRENT_DATE + 120,
    1,
    4,
    ARRAY[
      '{"period": 1, "end_time": "10:00+09", "start_time": "08:30+09"}'::jsonb,
      '{"period": 2, "end_time": "12:00+09", "start_time": "10:30+09"}'::jsonb,
      '{"period": 3, "end_time": "15:00+09", "start_time": "13:30+09"}'::jsonb,
      '{"period": 4, "end_time": "17:00+09", "start_time": "15:30+09"}'::jsonb
    ]
  ),
  (
    3,
    '2026-03-01 09:15:00+00',
    'f52d2304-22cb-4ea0-88f8-a196c6ef02ae',
    '2026 Trial Term',
    CURRENT_DATE - 30,
    CURRENT_DATE + 120,
    1,
    4,
    ARRAY[
      '{"period": 1, "end_time": "10:00+09", "start_time": "08:30+09"}'::jsonb,
      '{"period": 2, "end_time": "12:00+09", "start_time": "10:30+09"}'::jsonb,
      '{"period": 3, "end_time": "15:00+09", "start_time": "13:30+09"}'::jsonb,
      '{"period": 4, "end_time": "17:00+09", "start_time": "15:30+09"}'::jsonb
    ]
  );

INSERT INTO public.teachers (id, created_at, name, school_id, is_admin) VALUES
  ('e4d7fd60-b39f-4dec-99c0-a847dacc0572', '2026-01-01 09:20:00+00', 'Teacher Alpha', 'd4289665-0d3e-4784-a06b-e97f2d595a5c', false),
  ('85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-01 09:20:00+00', 'Teacher Bravo', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', true),
  ('07993eea-ca5c-4902-b527-fcfeb7e5fdab', '2026-03-01 09:20:00+00', 'Teacher Charlie', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', false);

INSERT INTO public.lectures (
  id,
  created_at,
  name,
  classroom_id,
  teacher_id,
  schedule,
  holiday,
  module,
  semester_id
) VALUES
  (
    'e777e570-72fa-48a5-bda9-e180a60bcd59',
    '2026-02-01 09:25:00+00',
    'Applied Science',
    '946388fd-1573-4e1a-9ad4-e2030155cbd1',
    '85991a44-f17b-4d20-85bc-9a56ec86fbd6',
    ARRAY[
      '{"day": "Monday", "period": 3}'::jsonb,
      '{"day": "Tuesday", "period": 3}'::jsonb,
      '{"day": "Wednesday", "period": 3}'::jsonb,
      '{"day": "Thursday", "period": 3}'::jsonb,
      '{"day": "Friday", "period": 3}'::jsonb
    ],
    NULL,
    'SCI-1',
    2
  ),
  (
    '27d90ac4-63f6-4449-97ce-a586ce301ca2',
    '2026-03-01 09:25:00+00',
    'Attendance Pilot',
    '7bfc3401-5379-45ff-b412-df29b8fdd23a',
    '07993eea-ca5c-4902-b527-fcfeb7e5fdab',
    ARRAY[
      '{"day": "Monday", "period": 3}'::jsonb,
      '{"day": "Monday", "period": 4}'::jsonb,
      '{"day": "Tuesday", "period": 3}'::jsonb,
      '{"day": "Tuesday", "period": 4}'::jsonb,
      '{"day": "Wednesday", "period": 3}'::jsonb,
      '{"day": "Wednesday", "period": 4}'::jsonb,
      '{"day": "Thursday", "period": 3}'::jsonb,
      '{"day": "Thursday", "period": 4}'::jsonb,
      '{"day": "Friday", "period": 3}'::jsonb,
      '{"day": "Friday", "period": 4}'::jsonb
    ],
    NULL,
    'PILOT',
    3
  ),
  (
    '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978',
    '2026-02-01 09:30:00+00',
    'Foundations Lab',
    '946388fd-1573-4e1a-9ad4-e2030155cbd1',
    '85991a44-f17b-4d20-85bc-9a56ec86fbd6',
    ARRAY[
      '{"day": "Monday", "period": 2}'::jsonb,
      '{"day": "Tuesday", "period": 2}'::jsonb,
      '{"day": "Wednesday", "period": 2}'::jsonb,
      '{"day": "Thursday", "period": 2}'::jsonb,
      '{"day": "Friday", "period": 2}'::jsonb
    ],
    NULL,
    'LAB-1',
    2
  ),
  (
    'dd539db3-5e72-4403-9927-9c0919235cf2',
    '2026-01-01 09:25:00+00',
    'Humanities Seminar',
    '0d63e674-9f65-407f-865a-870e3ff524f0',
    'e4d7fd60-b39f-4dec-99c0-a847dacc0572',
    ARRAY[
      '{"day": "Monday", "period": 3}'::jsonb,
      '{"day": "Monday", "period": 4}'::jsonb,
      '{"day": "Tuesday", "period": 5}'::jsonb,
      '{"day": "Tuesday", "period": 6}'::jsonb,
      '{"day": "Wednesday", "period": 7}'::jsonb,
      '{"day": "Wednesday", "period": 8}'::jsonb,
      '{"day": "Thursday", "period": 1}'::jsonb,
      '{"day": "Thursday", "period": 2}'::jsonb,
      '{"day": "Friday", "period": 4}'::jsonb,
      '{"day": "Friday", "period": 5}'::jsonb
    ],
    NULL,
    'HUM-2',
    1
  ),
  (
    'e728bdd7-e6c5-4484-8899-a94ccff997a6',
    '2026-01-01 09:30:00+00',
    'Intro to Research',
    '0d63e674-9f65-407f-865a-870e3ff524f0',
    'e4d7fd60-b39f-4dec-99c0-a847dacc0572',
    ARRAY[
      '{"day": "Monday", "period": 1}'::jsonb,
      '{"day": "Monday", "period": 2}'::jsonb,
      '{"day": "Tuesday", "period": 3}'::jsonb,
      '{"day": "Tuesday", "period": 4}'::jsonb,
      '{"day": "Wednesday", "period": 5}'::jsonb,
      '{"day": "Wednesday", "period": 6}'::jsonb,
      '{"day": "Thursday", "period": 7}'::jsonb,
      '{"day": "Thursday", "period": 8}'::jsonb,
      '{"day": "Friday", "period": 2}'::jsonb,
      '{"day": "Friday", "period": 3}'::jsonb
    ],
    NULL,
    'RES-1',
    1
  );

INSERT INTO public.students (id, created_at, name, school_id, device_id, last_detected_place, num) VALUES
  ('60ece9bb-4c66-4744-a2d7-806521bdae8a', '2026-01-01 09:35:00+00', 'Student 01', '3fbf29fd-21f5-45ba-b855-4dbcaa72eb19', NULL, NULL, '100001'),
  ('0d56623f-f953-40f4-b369-d2138b7b907d', '2026-01-01 09:36:00+00', 'Student 02', 'd4289665-0d3e-4784-a06b-e97f2d595a5c', 'device-alpha-02', '0d63e674-9f65-407f-865a-870e3ff524f0', '100002'),
  ('1b212df6-4669-4d50-b835-50dd47ac94cb', '2026-01-01 09:37:00+00', 'Student 03', 'd4289665-0d3e-4784-a06b-e97f2d595a5c', 'device-alpha-03', '0d63e674-9f65-407f-865a-870e3ff524f0', '100003'),
  ('1cde6571-6958-4e1b-9402-402d64a245fa', '2026-01-01 09:38:00+00', 'Student 04', 'd4289665-0d3e-4784-a06b-e97f2d595a5c', 'device-alpha-04', NULL, '100004'),
  ('deed3885-063c-4d6e-903a-779b2a703254', '2026-02-01 09:35:00+00', 'Student 05', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', NULL, NULL, '200001'),
  ('681f0b81-367a-4f38-9f0a-f90d1ba150c2', '2026-02-01 09:36:00+00', 'Student 06', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', NULL, NULL, '200002'),
  ('de14602c-f5c3-4f4b-a654-f8b342473f07', '2026-02-01 09:37:00+00', 'Student 07', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', NULL, NULL, '200003'),
  ('72812d7f-cef2-48f8-b544-2acddf61561f', '2026-02-01 09:38:00+00', 'Student 08', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', NULL, NULL, '200004'),
  ('ce475247-5e94-45d9-9195-d700677237be', '2026-02-01 09:39:00+00', 'Student 09', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', 'device-bravo-09', NULL, '200005'),
  ('9de7d27b-0f5e-4cc4-a4e0-888333db9a70', '2026-02-01 09:40:00+00', 'Student 10', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', 'device-bravo-10', NULL, '200006'),
  ('f865c3d6-550f-4e83-8ae8-dfa7c503c898', '2026-02-01 09:41:00+00', 'Student 11', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', 'device-bravo-11', NULL, '200007'),
  ('d54fb51a-a54b-4c3a-b0dd-7a2426e0da08', '2026-02-01 09:42:00+00', 'Student 12', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', 'device-bravo-12', NULL, '200008'),
  ('a9f1fdac-bddd-4b4c-b0bc-efe969550fe2', '2026-02-01 09:43:00+00', 'Student 13', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', 'device-bravo-13', NULL, '200009'),
  ('7cf7acb0-6aa4-4e18-a793-a38112dcde54', '2026-02-01 09:44:00+00', 'Student 14', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', 'device-bravo-14', NULL, '200010'),
  ('ccfb44e8-0e19-4e60-9df0-802dd8e14a66', '2026-02-01 09:45:00+00', 'Student 15', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', 'device-bravo-15', NULL, '200011'),
  ('387fe9cf-cce2-4acf-8c8e-127cb42ad2e9', '2026-02-01 09:46:00+00', 'Student 16', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', 'device-bravo-16', NULL, '200012'),
  ('664d6972-cdd6-4205-bfd0-2caca1278897', '2026-03-01 09:35:00+00', 'Student 17', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', 'device-charlie-17', '7bfc3401-5379-45ff-b412-df29b8fdd23a', '300001'),
  ('68bf72f4-27f0-4a4f-a0f9-167e4af752dd', '2026-03-01 09:36:00+00', 'Student 18', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', 'device-charlie-18', '7bfc3401-5379-45ff-b412-df29b8fdd23a', '300002'),
  ('0cd16b9e-14d7-4da7-bcab-a699906ccbb0', '2026-03-01 09:37:00+00', 'Student 19', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', 'device-charlie-19', '7bfc3401-5379-45ff-b412-df29b8fdd23a', '300003'),
  ('402eb316-0b6b-48bf-ba0e-a937d23a3d0f', '2026-03-01 09:38:00+00', 'Student 20', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', 'device-charlie-20', '7bfc3401-5379-45ff-b412-df29b8fdd23a', '300004'),
  ('d4889047-93e0-4441-8b15-dd7f370aeeb9', '2026-03-01 09:39:00+00', 'Student 21', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', 'device-charlie-21', '7bfc3401-5379-45ff-b412-df29b8fdd23a', '300005');

INSERT INTO public.enrollments (created_at, student_id, lecture_id, semester_id) VALUES
  ('2026-01-01 10:00:00+00', '0d56623f-f953-40f4-b369-d2138b7b907d', 'dd539db3-5e72-4403-9927-9c0919235cf2', 1),
  ('2026-01-01 10:01:00+00', '1b212df6-4669-4d50-b835-50dd47ac94cb', 'e728bdd7-e6c5-4484-8899-a94ccff997a6', 1),
  ('2026-01-01 10:02:00+00', '1cde6571-6958-4e1b-9402-402d64a245fa', 'e728bdd7-e6c5-4484-8899-a94ccff997a6', 1),
  ('2026-02-01 10:00:00+00', 'a9f1fdac-bddd-4b4c-b0bc-efe969550fe2', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
  ('2026-02-01 10:01:00+00', 'ce475247-5e94-45d9-9195-d700677237be', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
  ('2026-02-01 10:02:00+00', '9de7d27b-0f5e-4cc4-a4e0-888333db9a70', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
  ('2026-02-01 10:03:00+00', 'd54fb51a-a54b-4c3a-b0dd-7a2426e0da08', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
  ('2026-02-01 10:04:00+00', 'f865c3d6-550f-4e83-8ae8-dfa7c503c898', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
  ('2026-02-01 10:05:00+00', '7cf7acb0-6aa4-4e18-a793-a38112dcde54', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
  ('2026-02-01 10:06:00+00', 'ccfb44e8-0e19-4e60-9df0-802dd8e14a66', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
  ('2026-02-01 10:07:00+00', '387fe9cf-cce2-4acf-8c8e-127cb42ad2e9', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
  ('2026-03-01 10:00:00+00', 'd4889047-93e0-4441-8b15-dd7f370aeeb9', '27d90ac4-63f6-4449-97ce-a586ce301ca2', 3),
  ('2026-03-01 10:01:00+00', '0cd16b9e-14d7-4da7-bcab-a699906ccbb0', '27d90ac4-63f6-4449-97ce-a586ce301ca2', 3),
  ('2026-03-01 10:02:00+00', '664d6972-cdd6-4205-bfd0-2caca1278897', '27d90ac4-63f6-4449-97ce-a586ce301ca2', 3),
  ('2026-03-01 10:03:00+00', '402eb316-0b6b-48bf-ba0e-a937d23a3d0f', '27d90ac4-63f6-4449-97ce-a586ce301ca2', 3),
  ('2026-03-01 10:04:00+00', '68bf72f4-27f0-4a4f-a0f9-167e4af752dd', '27d90ac4-63f6-4449-97ce-a586ce301ca2', 3);

INSERT INTO public.attendances (id, student_id, lecture_id, attendance_date, status, created_at, period) VALUES
  ('53381d07-1401-445f-9acd-e0bcd8dfb1ee', '1b212df6-4669-4d50-b835-50dd47ac94cb', 'e728bdd7-e6c5-4484-8899-a94ccff997a6', '2026-01-05', 'present', '2026-01-05 00:10:00+00', 1),
  ('4060469d-29bd-4772-afb6-920f692d7960', '1cde6571-6958-4e1b-9402-402d64a245fa', 'e728bdd7-e6c5-4484-8899-a94ccff997a6', '2026-01-06', 'absent', '2026-01-06 00:10:00+00', 3),
  ('dd186094-be56-4023-8c17-acc8b2e545f3', '664d6972-cdd6-4205-bfd0-2caca1278897', '27d90ac4-63f6-4449-97ce-a586ce301ca2', '2026-03-03', 'absent', '2026-03-03 00:10:00+00', 3),
  ('d9bbd4eb-84a7-4ad5-b554-c1b4bc9ab2ca', '68bf72f4-27f0-4a4f-a0f9-167e4af752dd', '27d90ac4-63f6-4449-97ce-a586ce301ca2', '2026-03-03', 'absent', '2026-03-03 00:11:00+00', 3),
  ('b850a3c0-7b36-4a72-89e8-0df4aae9b872', '0cd16b9e-14d7-4da7-bcab-a699906ccbb0', '27d90ac4-63f6-4449-97ce-a586ce301ca2', '2026-03-03', 'absent', '2026-03-03 00:12:00+00', 3),
  ('7837177a-560a-4dc0-953d-aa20b773c51a', '402eb316-0b6b-48bf-ba0e-a937d23a3d0f', '27d90ac4-63f6-4449-97ce-a586ce301ca2', '2026-03-03', 'absent', '2026-03-03 00:13:00+00', 3),
  ('7cc5789f-8cd9-41c6-a909-e82c3e0fd75c', 'd4889047-93e0-4441-8b15-dd7f370aeeb9', '27d90ac4-63f6-4449-97ce-a586ce301ca2', '2026-03-03', 'present', '2026-03-03 00:14:00+00', 3);

SELECT internal.seed_daily_attendances(CURRENT_DATE);

SELECT pg_catalog.setval('public.semester_schedules_id_seq', 3, true);

RESET ALL;
