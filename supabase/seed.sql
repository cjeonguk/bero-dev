SET session_replication_role = replica;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
--
-- PostgreSQL database dump
--

-- \restrict NYUBtqIFlO3hcH3QzOkUyvHauCrqaV2hIxGqM7nmMsROp0Y3HkANcgs8nEuhegl

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") VALUES
	('d79bb3d2-22ab-4117-aae3-1b27e3097d3f', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', 'fe894d5c-53e8-414d-90ac-3f554642c730', 's256', 'rL8oD_8tzH48w0N1tvoMIeAYy1vSH61rASW-UUU1KWo', 'email', '', '', '2025-12-27 06:56:28.794251+00', '2025-12-27 06:56:28.794251+00', 'email/signup', NULL, NULL, NULL, NULL, NULL, false),
	('78e72cc8-2824-4b89-b991-f5a6735e416e', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2bc03c54-3715-41e1-b072-9e5d8058f0b4', 's256', 'AWCaNgVtGVgkuoRM8y4a4kETt1h8qUBXnvbbBreRPNo', 'email', '', '', '2026-02-03 04:10:07.824346+00', '2026-02-03 04:10:07.824346+00', 'email/signup', NULL, NULL, NULL, NULL, NULL, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', 'authenticated', 'authenticated', 'aaron@example.com', '$2a$10$KlKLTM3CPigO8zUktf6em.aZ7IaDpVe1Y2rr5eDb7FuGC2L9i9ozG', '2026-02-09 17:06:33.623292+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-02-12 04:37:43.676004+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-09 17:06:33.603434+00', '2026-02-12 05:45:18.023172+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', 'authenticated', 'authenticated', 'wooram9816@gmail.com', extensions.crypt('password123', extensions.gen_salt('bf')), '2026-02-03 04:10:27.124893+00', NULL, '', '2026-02-03 04:10:07.830678+00', '', NULL, '', '', NULL, '2026-04-06 12:30:28.380913+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "85991a44-f17b-4d20-85bc-9a56ec86fbd6", "email": "wooram9816@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-02-03 04:10:07.799427+00', '2026-04-06 12:30:28.40833+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', 'authenticated', 'authenticated', 'jigangjon@gmail.com', '$2a$10$CLOMR7WI5We3/EQBFRX1dOV3b/QfNPHMQKYYYOGamHpcRnxeYnsFW', '2025-12-27 06:57:27.172815+00', NULL, '', '2025-12-27 06:56:28.80548+00', '', NULL, '', '', NULL, '2026-01-02 18:37:46.580137+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "e4d7fd60-b39f-4dec-99c0-a847dacc0572", "email": "jigangjon@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-12-27 06:56:28.748608+00', '2026-01-02 19:57:12.405354+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('e4d7fd60-b39f-4dec-99c0-a847dacc0572', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', '{"sub": "e4d7fd60-b39f-4dec-99c0-a847dacc0572", "email": "jigangjon@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2025-12-27 06:56:28.779713+00', '2025-12-27 06:56:28.779781+00', '2025-12-27 06:56:28.779781+00', '91ff4eb6-cdd0-47e9-ab67-16ac8d877d68'),
	('85991a44-f17b-4d20-85bc-9a56ec86fbd6', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '{"sub": "85991a44-f17b-4d20-85bc-9a56ec86fbd6", "email": "wooram9816@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-02-03 04:10:07.818653+00', '2026-02-03 04:10:07.818709+00', '2026-02-03 04:10:07.818709+00', '0d93bb7f-3164-4fe7-bc7b-99375fdaa163'),
	('07993eea-ca5c-4902-b527-fcfeb7e5fdab', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', '{"sub": "07993eea-ca5c-4902-b527-fcfeb7e5fdab", "email": "aaron@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-09 17:06:33.614099+00', '2026-02-09 17:06:33.614162+00', '2026-02-09 17:06:33.614162+00', '392c556f-00f2-4022-9bd9-093512ae94ee');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('6239a53d-eeb5-43ee-b5c0-4d6b913b7d57', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-06 01:18:56.622564+00', '2026-02-06 01:18:56.622564+00', NULL, 'aal1', NULL, NULL, 'node', '18.191.242.203', NULL, NULL, NULL, NULL, NULL),
	('9c831863-4f83-4127-8f1f-d15332a9f8a6', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-05 01:14:05.30934+00', '2026-02-06 01:18:56.64026+00', NULL, 'aal1', NULL, '2026-02-06 01:18:56.640144', 'node', '18.191.242.203', NULL, NULL, NULL, NULL, NULL),
	('2d6ede7b-405e-40c8-9ed3-bf67fad0da25', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-04 23:40:10.499578+00', '2026-02-11 01:38:57.925681+00', NULL, 'aal1', NULL, '2026-02-11 01:38:57.925538', 'node', '58.239.47.24', NULL, NULL, NULL, NULL, NULL),
	('a257631f-ef2b-45a2-a253-4ad32327c5d3', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', '2025-12-27 07:13:44.156989+00', '2025-12-27 13:43:13.883539+00', NULL, 'aal1', NULL, '2025-12-27 13:43:13.882807', 'node', '58.239.47.14', NULL, NULL, NULL, NULL, NULL),
	('154db6e1-3b92-4749-94d4-78a8db4b1be4', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', '2026-02-11 01:38:57.976019+00', '2026-02-11 01:38:57.976019+00', NULL, 'aal1', NULL, NULL, 'node', '58.239.47.24', NULL, NULL, NULL, NULL, NULL),
	('88cc19ed-674c-46d7-89a4-8213df8f6eee', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', '2026-02-11 02:37:16.137304+00', '2026-02-11 06:45:49.391963+00', NULL, 'aal1', NULL, '2026-02-11 06:45:49.39182', 'node', '58.239.47.81', NULL, NULL, NULL, NULL, NULL),
	('0cf90484-84a2-4da6-b321-c1e052c8f7e3', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', '2025-12-27 13:43:14.097898+00', '2026-01-02 18:37:46.577807+00', NULL, 'aal1', NULL, '2026-01-02 18:37:46.577688', 'node', '119.204.109.148', NULL, NULL, NULL, NULL, NULL),
	('d8b5fe2c-a866-4717-9fb4-3f07e97229af', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-03-17 07:35:43.436852+00', '2026-03-17 07:35:43.436852+00', NULL, 'aal1', NULL, NULL, 'node', '3.137.173.148', NULL, NULL, NULL, NULL, NULL),
	('c77bb8ff-3db3-4049-9894-2118070a8ca5', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-04 13:19:24.997688+00', '2026-03-17 07:35:43.461096+00', NULL, 'aal1', NULL, '2026-03-17 07:35:43.460979', 'node', '3.137.173.148', NULL, NULL, NULL, NULL, NULL),
	('31ce002d-5892-452a-820c-4ea19ca2b834', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-03-17 07:35:47.54689+00', '2026-03-17 07:35:47.54689+00', NULL, 'aal1', NULL, NULL, 'node', '18.222.165.193', NULL, NULL, NULL, NULL, NULL),
	('86ba6d95-e5bd-4176-957b-8dbfca3dbdd4', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-03-17 07:35:53.037785+00', '2026-03-17 07:35:53.037785+00', NULL, 'aal1', NULL, NULL, 'node', '18.222.165.193', NULL, NULL, NULL, NULL, NULL),
	('5819bd32-9363-4724-ab66-57ab2b8e376c', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', '2026-02-11 06:45:49.357037+00', '2026-02-12 04:36:06.304041+00', NULL, 'aal1', NULL, '2026-02-12 04:36:06.303943', 'node', '58.239.47.37', NULL, NULL, NULL, NULL, NULL),
	('78d4bad2-5664-4bba-811a-460f7acb6d03', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', '2026-02-12 04:36:06.391443+00', '2026-02-12 04:36:06.391443+00', NULL, 'aal1', NULL, NULL, 'node', '58.239.47.37', NULL, NULL, NULL, NULL, NULL),
	('9f3ce34f-6fb7-4f22-a68e-efd0a38bbe07', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', '2026-01-02 18:37:46.580834+00', '2026-01-02 22:50:32.229751+00', NULL, 'aal1', NULL, '2026-01-02 22:50:32.229627', 'node', '119.204.109.148', NULL, NULL, NULL, NULL, NULL),
	('5c3b526f-3ba4-4f6f-9149-122f0e417686', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-03 04:10:27.131645+00', '2026-02-03 04:10:27.131645+00', NULL, 'aal1', NULL, NULL, 'node', '18.119.125.15', NULL, NULL, NULL, NULL, NULL),
	('39562b21-5e2c-4405-a437-6984dce5c9e9', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-04 02:25:15.870426+00', '2026-02-04 02:25:15.870426+00', NULL, 'aal1', NULL, NULL, 'node', '3.137.180.232', NULL, NULL, NULL, NULL, NULL),
	('331c0906-ea5e-4c85-b6e1-24d7ff32af0e', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-03 04:11:05.161233+00', '2026-02-04 04:56:20.979578+00', NULL, 'aal1', NULL, '2026-02-04 04:56:20.979443', 'node', '3.14.84.111', NULL, NULL, NULL, NULL, NULL),
	('ba8ee2db-ece2-4f7f-8bfc-20c1c4b367d9', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', '2026-02-12 04:37:43.6761+00', '2026-04-06 12:30:28.308556+00', NULL, 'aal1', NULL, '2026-04-06 12:30:28.308453', 'node', '58.239.47.147', NULL, NULL, NULL, NULL, NULL),
	('d6c049a5-0626-4747-9345-2a471b7f0f0b', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-04-06 12:30:28.382568+00', '2026-04-06 12:30:28.382568+00', NULL, 'aal1', NULL, NULL, 'node', '58.239.47.147', NULL, NULL, NULL, NULL, NULL),
	('4ab14cdb-0a39-42ab-82dd-c5dbd2610545', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-04 04:56:20.980972+00', '2026-02-05 01:06:42.39198+00', NULL, 'aal1', NULL, '2026-02-05 01:06:42.391858', 'node', '3.19.229.171', NULL, NULL, NULL, NULL, NULL),
	('c69caa42-5028-41c9-ac6f-b71fa5a415b3', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-05 01:06:42.45059+00', '2026-02-05 01:06:42.45059+00', NULL, 'aal1', NULL, NULL, 'node', '3.19.229.171', NULL, NULL, NULL, NULL, NULL),
	('d82db05a-050c-4ca0-b352-1feb614965d2', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-04 02:25:20.597413+00', '2026-02-05 01:14:02.405748+00', NULL, 'aal1', NULL, '2026-02-05 01:14:02.405624', 'node', '18.223.212.109', NULL, NULL, NULL, NULL, NULL),
	('646278ae-9490-4de8-b5cd-beaa863eb156', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-05 01:14:02.462231+00', '2026-02-05 01:14:02.462231+00', NULL, 'aal1', NULL, NULL, 'node', '18.223.212.109', NULL, NULL, NULL, NULL, NULL),
	('c5292e3c-8c12-4e9b-873f-f2e84f2ae7a1', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-05 01:25:02.989172+00', '2026-02-05 01:25:02.989172+00', NULL, 'aal1', NULL, NULL, 'node', '18.223.212.109', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('a257631f-ef2b-45a2-a253-4ad32327c5d3', '2025-12-27 07:13:44.16537+00', '2025-12-27 07:13:44.16537+00', 'password', '2c9c0eb7-2e36-4051-8e00-618c6d077c51'),
	('0cf90484-84a2-4da6-b321-c1e052c8f7e3', '2025-12-27 13:43:14.106642+00', '2025-12-27 13:43:14.106642+00', 'password', 'e7327726-c604-4b34-b5e4-febcbcea0e8b'),
	('9f3ce34f-6fb7-4f22-a68e-efd0a38bbe07', '2026-01-02 18:37:46.626089+00', '2026-01-02 18:37:46.626089+00', 'password', 'd49bb013-1970-4668-a116-e072fd6f2a82'),
	('5c3b526f-3ba4-4f6f-9149-122f0e417686', '2026-02-03 04:10:27.151682+00', '2026-02-03 04:10:27.151682+00', 'otp', '3f3265d3-7bf7-4222-b80b-1f5b635bb7d7'),
	('331c0906-ea5e-4c85-b6e1-24d7ff32af0e', '2026-02-03 04:11:05.164753+00', '2026-02-03 04:11:05.164753+00', 'password', '9caf038b-d704-4755-9717-20fd810476a6'),
	('39562b21-5e2c-4405-a437-6984dce5c9e9', '2026-02-04 02:25:15.961237+00', '2026-02-04 02:25:15.961237+00', 'password', '545382d0-c26a-4d7d-a952-8e37bd26d02e'),
	('d82db05a-050c-4ca0-b352-1feb614965d2', '2026-02-04 02:25:20.601615+00', '2026-02-04 02:25:20.601615+00', 'password', '60ecee66-05ac-41c6-a67c-6fa292f18dff'),
	('4ab14cdb-0a39-42ab-82dd-c5dbd2610545', '2026-02-04 04:56:21.016831+00', '2026-02-04 04:56:21.016831+00', 'password', 'a2b63484-8583-433f-a14b-39521e984199'),
	('c77bb8ff-3db3-4049-9894-2118070a8ca5', '2026-02-04 13:19:25.093883+00', '2026-02-04 13:19:25.093883+00', 'password', '1d4d1f03-659d-4de1-8fc7-4276b33d3e51'),
	('2d6ede7b-405e-40c8-9ed3-bf67fad0da25', '2026-02-04 23:40:10.522479+00', '2026-02-04 23:40:10.522479+00', 'password', '649793b7-adfa-4d19-884f-ffb733e14f82'),
	('c69caa42-5028-41c9-ac6f-b71fa5a415b3', '2026-02-05 01:06:42.469965+00', '2026-02-05 01:06:42.469965+00', 'password', 'ab3c4e8d-7209-4d64-8f14-1aa3ddc3dc42'),
	('646278ae-9490-4de8-b5cd-beaa863eb156', '2026-02-05 01:14:02.470157+00', '2026-02-05 01:14:02.470157+00', 'password', '4ccd1ad2-b48b-4a25-8c7d-a6a64a76f232'),
	('9c831863-4f83-4127-8f1f-d15332a9f8a6', '2026-02-05 01:14:05.375576+00', '2026-02-05 01:14:05.375576+00', 'password', '78c7f476-8bff-4370-b455-40698e54ac77'),
	('c5292e3c-8c12-4e9b-873f-f2e84f2ae7a1', '2026-02-05 01:25:03.064822+00', '2026-02-05 01:25:03.064822+00', 'password', '7cfa0f05-a097-4c32-a13f-f6600822fb57'),
	('6239a53d-eeb5-43ee-b5c0-4d6b913b7d57', '2026-02-06 01:18:56.648503+00', '2026-02-06 01:18:56.648503+00', 'password', '8bc35cce-1178-437c-ac87-7c43c99a92cc'),
	('154db6e1-3b92-4749-94d4-78a8db4b1be4', '2026-02-11 01:38:57.991891+00', '2026-02-11 01:38:57.991891+00', 'password', '06460f67-8d7a-41db-898b-8d1cdc5f9d63'),
	('88cc19ed-674c-46d7-89a4-8213df8f6eee', '2026-02-11 02:37:16.164997+00', '2026-02-11 02:37:16.164997+00', 'password', '8d9f00d7-18b9-4a4f-821b-99cb045436b3'),
	('5819bd32-9363-4724-ab66-57ab2b8e376c', '2026-02-11 06:45:49.394868+00', '2026-02-11 06:45:49.394868+00', 'password', '6bb4294f-b1cd-4ca8-a326-8c9046bb8f77'),
	('78d4bad2-5664-4bba-811a-460f7acb6d03', '2026-02-12 04:36:06.429403+00', '2026-02-12 04:36:06.429403+00', 'password', '365edac7-7543-4766-b9ae-3bbde71b1040'),
	('ba8ee2db-ece2-4f7f-8bfc-20c1c4b367d9', '2026-02-12 04:37:43.684031+00', '2026-02-12 04:37:43.684031+00', 'password', 'ddcd0143-8114-4d58-84d4-7bf9fda04c82'),
	('d8b5fe2c-a866-4717-9fb4-3f07e97229af', '2026-03-17 07:35:43.46565+00', '2026-03-17 07:35:43.46565+00', 'password', '7dc363eb-6411-4f2c-a9b9-6c4af417d89a'),
	('31ce002d-5892-452a-820c-4ea19ca2b834', '2026-03-17 07:35:47.54911+00', '2026-03-17 07:35:47.54911+00', 'password', 'fe4d06ba-216c-4e49-91ef-b7e42f601155'),
	('86ba6d95-e5bd-4176-957b-8dbfca3dbdd4', '2026-03-17 07:35:53.040143+00', '2026-03-17 07:35:53.040143+00', 'password', '3b72cc08-8e2e-47a2-bcf3-ef5f8dd35bde'),
	('d6c049a5-0626-4747-9345-2a471b7f0f0b', '2026-04-06 12:30:28.409158+00', '2026-04-06 12:30:28.409158+00', 'password', '71df58c7-8cdc-4213-b0ea-c58d2853b60e');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 4, '3vpqakwqcijo', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', true, '2025-12-27 07:13:44.161411+00', '2025-12-27 13:43:13.85506+00', NULL, 'a257631f-ef2b-45a2-a253-4ad32327c5d3'),
	('00000000-0000-0000-0000-000000000000', 5, 'gpp4xe5rihtu', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', false, '2025-12-27 13:43:13.866629+00', '2025-12-27 13:43:13.866629+00', '3vpqakwqcijo', 'a257631f-ef2b-45a2-a253-4ad32327c5d3'),
	('00000000-0000-0000-0000-000000000000', 6, 'yikyhlbc67ub', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', true, '2025-12-27 13:43:14.104802+00', '2025-12-27 14:46:00.851033+00', NULL, '0cf90484-84a2-4da6-b321-c1e052c8f7e3'),
	('00000000-0000-0000-0000-000000000000', 7, 'wpz25setwdta', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', false, '2025-12-27 14:46:00.862237+00', '2025-12-27 14:46:00.862237+00', 'yikyhlbc67ub', '0cf90484-84a2-4da6-b321-c1e052c8f7e3'),
	('00000000-0000-0000-0000-000000000000', 8, 'tgeez2odl32w', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', true, '2026-01-02 18:37:46.609507+00', '2026-01-02 19:57:12.370273+00', NULL, '9f3ce34f-6fb7-4f22-a68e-efd0a38bbe07'),
	('00000000-0000-0000-0000-000000000000', 9, 'g5yg7x7bn22f', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', false, '2026-01-02 19:57:12.389391+00', '2026-01-02 19:57:12.389391+00', 'tgeez2odl32w', '9f3ce34f-6fb7-4f22-a68e-efd0a38bbe07'),
	('00000000-0000-0000-0000-000000000000', 10, 'mdwxmob62f5a', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-02-03 04:10:27.139896+00', '2026-02-03 04:10:27.139896+00', NULL, '5c3b526f-3ba4-4f6f-9149-122f0e417686'),
	('00000000-0000-0000-0000-000000000000', 11, 'xpw3qq2uhqih', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', true, '2026-02-03 04:11:05.16312+00', '2026-02-03 06:04:30.989576+00', NULL, '331c0906-ea5e-4c85-b6e1-24d7ff32af0e'),
	('00000000-0000-0000-0000-000000000000', 12, 'xzxhofvmb3mn', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-02-03 06:04:31.020212+00', '2026-02-03 06:04:31.020212+00', 'xpw3qq2uhqih', '331c0906-ea5e-4c85-b6e1-24d7ff32af0e'),
	('00000000-0000-0000-0000-000000000000', 13, 'txke7hzmtpk2', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-02-04 02:25:15.919308+00', '2026-02-04 02:25:15.919308+00', NULL, '39562b21-5e2c-4405-a437-6984dce5c9e9'),
	('00000000-0000-0000-0000-000000000000', 15, 'mjcmzpvqk2zr', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', true, '2026-02-04 04:56:21.003047+00', '2026-02-04 19:15:51.581018+00', NULL, '4ab14cdb-0a39-42ab-82dd-c5dbd2610545'),
	('00000000-0000-0000-0000-000000000000', 17, 'p4jxe3jm7vlu', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-02-04 19:15:51.613265+00', '2026-02-04 19:15:51.613265+00', 'mjcmzpvqk2zr', '4ab14cdb-0a39-42ab-82dd-c5dbd2610545'),
	('00000000-0000-0000-0000-000000000000', 18, 'iydjv24ba252', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', true, '2026-02-04 23:40:10.517585+00', '2026-02-05 00:47:00.925464+00', NULL, '2d6ede7b-405e-40c8-9ed3-bf67fad0da25'),
	('00000000-0000-0000-0000-000000000000', 19, 'pqh6cobfdnuj', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-02-05 00:47:00.94707+00', '2026-02-05 00:47:00.94707+00', 'iydjv24ba252', '2d6ede7b-405e-40c8-9ed3-bf67fad0da25'),
	('00000000-0000-0000-0000-000000000000', 20, '5qfey7abidhy', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-02-05 01:06:42.460628+00', '2026-02-05 01:06:42.460628+00', NULL, 'c69caa42-5028-41c9-ac6f-b71fa5a415b3'),
	('00000000-0000-0000-0000-000000000000', 14, 'nhcn226essjg', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', true, '2026-02-04 02:25:20.599062+00', '2026-02-05 01:14:02.385495+00', NULL, 'd82db05a-050c-4ca0-b352-1feb614965d2'),
	('00000000-0000-0000-0000-000000000000', 21, 'kguilw5ppxe7', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-02-05 01:14:02.39103+00', '2026-02-05 01:14:02.39103+00', 'nhcn226essjg', 'd82db05a-050c-4ca0-b352-1feb614965d2'),
	('00000000-0000-0000-0000-000000000000', 22, '5u25vzcbsjtu', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-02-05 01:14:02.468669+00', '2026-02-05 01:14:02.468669+00', NULL, '646278ae-9490-4de8-b5cd-beaa863eb156'),
	('00000000-0000-0000-0000-000000000000', 24, 'zqxnft32p5hh', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-02-05 01:25:03.040878+00', '2026-02-05 01:25:03.040878+00', NULL, 'c5292e3c-8c12-4e9b-873f-f2e84f2ae7a1'),
	('00000000-0000-0000-0000-000000000000', 23, 'c6oft3poe4yi', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', true, '2026-02-05 01:14:05.351116+00', '2026-02-06 01:18:56.584638+00', NULL, '9c831863-4f83-4127-8f1f-d15332a9f8a6'),
	('00000000-0000-0000-0000-000000000000', 25, 'h5gohhx6dqr3', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-02-06 01:18:56.611533+00', '2026-02-06 01:18:56.611533+00', 'c6oft3poe4yi', '9c831863-4f83-4127-8f1f-d15332a9f8a6'),
	('00000000-0000-0000-0000-000000000000', 26, 'pn5mjlrvqkb5', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-02-06 01:18:56.643417+00', '2026-02-06 01:18:56.643417+00', NULL, '6239a53d-eeb5-43ee-b5c0-4d6b913b7d57'),
	('00000000-0000-0000-0000-000000000000', 27, 'i6nh6333we24', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', false, '2026-02-11 01:38:57.987648+00', '2026-02-11 01:38:57.987648+00', NULL, '154db6e1-3b92-4749-94d4-78a8db4b1be4'),
	('00000000-0000-0000-0000-000000000000', 28, 't2wjyrqdl7to', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', true, '2026-02-11 02:37:16.153253+00', '2026-02-11 06:45:49.327373+00', NULL, '88cc19ed-674c-46d7-89a4-8213df8f6eee'),
	('00000000-0000-0000-0000-000000000000', 29, 's4st35h23t7a', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', false, '2026-02-11 06:45:49.359483+00', '2026-02-11 06:45:49.359483+00', 't2wjyrqdl7to', '88cc19ed-674c-46d7-89a4-8213df8f6eee'),
	('00000000-0000-0000-0000-000000000000', 30, '37elgkyv6jeb', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', true, '2026-02-11 06:45:49.383665+00', '2026-02-11 14:03:09.175051+00', NULL, '5819bd32-9363-4724-ab66-57ab2b8e376c'),
	('00000000-0000-0000-0000-000000000000', 31, 'ix5on25pvbvu', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', false, '2026-02-11 14:03:09.181322+00', '2026-02-11 14:03:09.181322+00', '37elgkyv6jeb', '5819bd32-9363-4724-ab66-57ab2b8e376c'),
	('00000000-0000-0000-0000-000000000000', 32, '3uqdu5djiuux', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', false, '2026-02-12 04:36:06.412185+00', '2026-02-12 04:36:06.412185+00', NULL, '78d4bad2-5664-4bba-811a-460f7acb6d03'),
	('00000000-0000-0000-0000-000000000000', 33, '2swv33nrboro', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', true, '2026-02-12 04:37:43.680123+00', '2026-02-12 05:45:17.996003+00', NULL, 'ba8ee2db-ece2-4f7f-8bfc-20c1c4b367d9'),
	('00000000-0000-0000-0000-000000000000', 34, 'ug4sxidp6yl4', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', false, '2026-02-12 05:45:18.01781+00', '2026-02-12 05:45:18.01781+00', '2swv33nrboro', 'ba8ee2db-ece2-4f7f-8bfc-20c1c4b367d9'),
	('00000000-0000-0000-0000-000000000000', 16, 'fpahoy4bz25j', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', true, '2026-02-04 13:19:25.051761+00', '2026-03-17 07:35:43.402923+00', NULL, 'c77bb8ff-3db3-4049-9894-2118070a8ca5'),
	('00000000-0000-0000-0000-000000000000', 35, 'kptexo2k4uii', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-03-17 07:35:43.425595+00', '2026-03-17 07:35:43.425595+00', 'fpahoy4bz25j', 'c77bb8ff-3db3-4049-9894-2118070a8ca5'),
	('00000000-0000-0000-0000-000000000000', 36, 'ygkfyz3kf3ft', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-03-17 07:35:43.449006+00', '2026-03-17 07:35:43.449006+00', NULL, 'd8b5fe2c-a866-4717-9fb4-3f07e97229af'),
	('00000000-0000-0000-0000-000000000000', 37, 'inxw6mguepl4', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-03-17 07:35:47.54784+00', '2026-03-17 07:35:47.54784+00', NULL, '31ce002d-5892-452a-820c-4ea19ca2b834'),
	('00000000-0000-0000-0000-000000000000', 38, 'vepg2hridvga', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-03-17 07:35:53.038963+00', '2026-03-17 07:35:53.038963+00', NULL, '86ba6d95-e5bd-4176-957b-8dbfca3dbdd4'),
	('00000000-0000-0000-0000-000000000000', 39, 'g767o5foua4b', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', false, '2026-04-06 12:30:28.400521+00', '2026-04-06 12:30:28.400521+00', NULL, 'd6c049a5-0626-4747-9345-2a471b7f0f0b');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."schools" ("id", "created_at", "name", "current_semester_id") VALUES
	('3fbf29fd-21f5-45ba-b855-4dbcaa72eb19', '2025-12-27 07:20:45.309961+00', '일반일반일반고', NULL),
	('d4289665-0d3e-4784-a06b-e97f2d595a5c', '2025-12-27 07:19:36.792914+00', '민사고의차은우최정욱', 1),
	('b8ab83ad-39f4-44b7-91c7-f28794adc666', '2026-02-03 04:33:59.769731+00', '민족사관고등학교', 2),
	('f52d2304-22cb-4ea0-88f8-a196c6ef02ae', '2026-02-09 17:07:48.854047+00', '테스트', 3);


--
-- Data for Name: classrooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."classrooms" ("id", "created_at", "name", "school_id") VALUES
	('0d63e674-9f65-407f-865a-870e3ff524f0', '2025-12-27 08:35:26.825967+00', 'C210', NULL),
	('946388fd-1573-4e1a-9ad4-e2030155cbd1', '2026-02-03 04:49:06.660277+00', 'C126', 'b8ab83ad-39f4-44b7-91c7-f28794adc666'),
	('7bfc3401-5379-45ff-b412-df29b8fdd23a', '2026-02-09 17:11:14.670553+00', 'test', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae');


--
-- Data for Name: semester_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."semester_schedules" ("id", "created_at", "school_id", "name", "start_date", "end_date", "start_period", "end_period", "period_schedules") VALUES
	(1, '2025-12-27 14:45:38.185185+00', 'd4289665-0d3e-4784-a06b-e97f2d595a5c', '2025-2', '2025-08-18', '2026-01-27', 1, 8, '{"{\"period\": 1, \"end_time\": \"09:20+09\", \"start_time\": \"00:00+09\"}","{\"period\": 2, \"end_time\": \"10:20+09\", \"start_time\": \"09:30+09\"}","{\"period\": 3, \"end_time\": \"11:20+09\", \"start_time\": \"10:30+09\"}","{\"period\": 4, \"end_time\": \"12:20+09\", \"start_time\": \"11:30+09\"}","{\"period\": 5, \"end_time\": \"14:30+09\", \"start_time\": \"13:40+09\"}","{\"period\": 6, \"end_time\": \"15:30+09\", \"start_time\": \"14:40+09\"}","{\"period\": 7, \"end_time\": \"16:30+09\", \"start_time\": \"15:40+09\"}","{\"period\": 8, \"end_time\": \"23:59+09\", \"start_time\": \"16:40+09\"}"}'),
	(2, '2026-02-03 04:36:56.968309+00', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', '2026-PRISM', '2026-02-02', '2026-02-25', 1, 4, '{"{\"period\": 1, \"end_time\": \"10:00+09\", \"start_time\": \"08:30+09\"}","{\"period\": 2, \"end_time\": \"12:00+09\", \"start_time\": \"10:30+09\"}","{\"period\": 3, \"end_time\": \"15:00+09\", \"start_time\": \"13:30+09\"}","{\"period\": 4, \"end_time\": \"17:00+09\", \"start_time\": \"15:30+09\"}"}'),
	(3, '2026-02-09 17:08:39.448197+00', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', '테스트', '2026-02-02', '2026-02-25', 1, 4, '{"{\"period\": 1, \"end_time\": \"10:00+09\", \"start_time\": \"08:30+09\"}","{\"period\": 2, \"end_time\": \"12:00+09\", \"start_time\": \"10:30+09\"}","{\"period\": 3, \"end_time\": \"15:00+09\", \"start_time\": \"13:30+09\"}","{\"period\": 4, \"end_time\": \"17:00+09\", \"start_time\": \"15:30+09\"}"}');


--
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."teachers" ("id", "created_at", "name", "school_id", "is_admin") VALUES
	('e4d7fd60-b39f-4dec-99c0-a847dacc0572', '2025-12-27 07:21:56.706238+00', '전지강', 'd4289665-0d3e-4784-a06b-e97f2d595a5c', false),
	('85991a44-f17b-4d20-85bc-9a56ec86fbd6', '2026-02-03 04:33:16.150352+00', '김태완', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', false),
	('07993eea-ca5c-4902-b527-fcfeb7e5fdab', '2026-02-09 17:07:22.1182+00', '테스트', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', false);


--
-- Data for Name: lectures; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lectures" ("id", "created_at", "name", "classroom_id", "teacher_id", "schedule", "holiday", "module", "semester_id") VALUES
	('e777e570-72fa-48a5-bda9-e180a60bcd59', '2026-02-03 04:41:57.149974+00', 'PRISM 수업 (김태완T)', '946388fd-1573-4e1a-9ad4-e2030155cbd1', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '{"{\"day\": \"Monday\", \"period\": 3}","{\"day\": \"Tuesday\", \"period\": 3}","{\"day\": \"Wednesday\", \"period\": 3}","{\"day\": \"Thursday\", \"period\": 3}","{\"day\": \"Friday\", \"period\": 3}"}', NULL, 'C1', 2),
	('27d90ac4-63f6-4449-97ce-a586ce301ca2', '2026-02-09 17:13:24.072131+00', '테스트', '7bfc3401-5379-45ff-b412-df29b8fdd23a', '07993eea-ca5c-4902-b527-fcfeb7e5fdab', '{"{\"day\": \"Monday\", \"period\": 3}","{\"day\": \"Tuesday\", \"period\": 3}","{\"day\": \"Wednesday\", \"period\": 3}","{\"day\": \"Thursday\", \"period\": 3}","{\"day\": \"Friday\", \"period\": 3}"}', NULL, 'X', 3),
	('8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', '2026-02-03 09:40:53.269244+00', 'PRISM 수업 (김태완T)', '946388fd-1573-4e1a-9ad4-e2030155cbd1', '85991a44-f17b-4d20-85bc-9a56ec86fbd6', '{"{\"day\": \"Monday\", \"period\": 2}","{\"day\": \"Tuesday\", \"period\": 2}","{\"day\": \"Wednesday\", \"period\": 2}","{\"day\": \"Thursday\", \"period\": 2}","{\"day\": \"Friday\", \"period\": 2}"}', NULL, 'B1', 2),
	('dd539db3-5e72-4403-9927-9c0919235cf2', '2025-12-27 13:32:12.813973+00', '고급 위상연애학', '0d63e674-9f65-407f-865a-870e3ff524f0', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', '{"{\"day\": \"Monday\", \"period\": 3}","{\"day\": \"Monday\", \"period\": 4}","{\"day\": \"Tuesday\", \"period\": 5}","{\"day\": \"Tuesday\", \"period\": 6}","{\"day\": \"Wednesday\", \"period\": 7}","{\"day\": \"Wednesday\", \"period\": 8}","{\"day\": \"Thursday\", \"period\": 1}","{\"day\": \"Thursday\", \"period\": 2}","{\"day\": \"Friday\", \"period\": 4}","{\"day\": \"Friday\", \"period\": 5}","{\"day\": \"Saturday\", \"period\": 6}","{\"day\": \"Saturday\", \"period\": 7}","{\"day\": \"Sunday\", \"period\": 8}","{\"day\": \"Sunday\", \"period\": 1}"}', NULL, 'D1', 1),
	('e728bdd7-e6c5-4484-8899-a94ccff997a6', '2025-12-27 13:25:16.178272+00', '연애학개론', '0d63e674-9f65-407f-865a-870e3ff524f0', 'e4d7fd60-b39f-4dec-99c0-a847dacc0572', '{"{\"day\": \"Monday\", \"period\": 1}","{\"day\": \"Monday\", \"period\": 2}","{\"day\": \"Tuesday\", \"period\": 3}","{\"day\": \"Tuesday\", \"period\": 4}","{\"day\": \"Wednesday\", \"period\": 5}","{\"day\": \"Wednesday\", \"period\": 6}","{\"day\": \"Thursday\", \"period\": 7}","{\"day\": \"Thursday\", \"period\": 8}","{\"day\": \"Friday\", \"period\": 2}","{\"day\": \"Friday\", \"period\": 3}","{\"day\": \"Saturday\", \"period\": 1}","{\"day\": \"Saturday\", \"period\": 5}","{\"day\": \"Sunday\", \"period\": 6}","{\"day\": \"Sunday\", \"period\": 7}"}', NULL, 'M', 1);


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."students" ("id", "created_at", "name", "school_id", "device_id", "last_detected_place", "num") VALUES
	('60ece9bb-4c66-4744-a2d7-806521bdae8a', '2025-12-27 07:34:59.318087+00', '일반고외계인', '3fbf29fd-21f5-45ba-b855-4dbcaa72eb19', NULL, NULL, '1234567890'),
	('0d56623f-f953-40f4-b369-d2138b7b907d', '2025-12-27 07:33:59.034188+00', '지휘자박시훈', 'd4289665-0d3e-4784-a06b-e97f2d595a5c', 'yahoo', '0d63e674-9f65-407f-865a-870e3ff524f0', '000002'),
	('1b212df6-4669-4d50-b835-50dd47ac94cb', '2025-12-27 07:33:17.818877+00', '디키마우스', 'd4289665-0d3e-4784-a06b-e97f2d595a5c', 'SPCPD6PV116ACCC', '0d63e674-9f65-407f-865a-870e3ff524f0', '000001'),
	('1cde6571-6958-4e1b-9402-402d64a245fa', '2025-12-27 07:28:59.842557+00', '차은우최정욱', 'd4289665-0d3e-4784-a06b-e97f2d595a5c', '최정욱의 Apple Watch', NULL, '000000'),
	('deed3885-063c-4d6e-903a-779b2a703254', '2026-02-04 01:19:04.523966+00', '박정후', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', NULL, NULL, '241059'),
	('681f0b81-367a-4f38-9f0a-f90d1ba150c2', '2026-02-04 01:19:43.367583+00', '조슈아', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', NULL, NULL, '251135'),
	('de14602c-f5c3-4f4b-a654-f8b342473f07', '2026-02-04 01:20:30.449568+00', '김건희', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', NULL, NULL, '251012'),
	('72812d7f-cef2-48f8-b544-2acddf61561f', '2026-02-04 01:21:40.112802+00', '임성후', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', NULL, NULL, '251115'),
	('ce475247-5e94-45d9-9195-d700677237be', '2026-02-04 01:17:05.75222+00', '장민준', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', '00002', NULL, '251120'),
	('9de7d27b-0f5e-4cc4-a4e0-888333db9a70', '2026-02-04 01:17:35.218119+00', '소예진', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', '00003', NULL, '251063'),
	('f865c3d6-550f-4e83-8ae8-dfa7c503c898', '2026-02-04 01:18:03.715588+00', '권준솔', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', '00005', NULL, '251007'),
	('d54fb51a-a54b-4c3a-b0dd-7a2426e0da08', '2026-02-04 01:23:22.334256+00', '유나연', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', '00006', NULL, '241090'),
	('a9f1fdac-bddd-4b4c-b0bc-efe969550fe2', '2026-02-04 01:21:03.8341+00', '신선우', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', '00007', NULL, '251071'),
	('7cf7acb0-6aa4-4e18-a793-a38112dcde54', '2026-02-04 01:27:57.581089+00', '김대현', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', '00107', NULL, '241013'),
	('ccfb44e8-0e19-4e60-9df0-802dd8e14a66', '2026-02-04 01:29:05.155733+00', '임유진', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', '00010', NULL, '251116'),
	('387fe9cf-cce2-4acf-8c8e-127cb42ad2e9', '2026-02-04 01:23:43.794326+00', '황호재', 'b8ab83ad-39f4-44b7-91c7-f28794adc666', '00016', NULL, '251156'),
	('664d6972-cdd6-4205-bfd0-2caca1278897', '2026-02-11 14:05:54.464114+00', '테스트3', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', '647', '7bfc3401-5379-45ff-b412-df29b8fdd23a', '222222'),
	('68bf72f4-27f0-4a4f-a0f9-167e4af752dd', '2026-02-11 14:13:42.118948+00', '테스트5', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', '13', '7bfc3401-5379-45ff-b412-df29b8fdd23a', '444444'),
	('0cd16b9e-14d7-4da7-bcab-a699906ccbb0', '2026-02-11 13:59:38.03172+00', '테스트2', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', '16', '7bfc3401-5379-45ff-b412-df29b8fdd23a', '111111'),
	('402eb316-0b6b-48bf-ba0e-a937d23a3d0f', '2026-02-11 14:11:11.158243+00', '테스트4', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', '15', '7bfc3401-5379-45ff-b412-df29b8fdd23a', '333333'),
	('d4889047-93e0-4441-8b15-dd7f370aeeb9', '2026-02-11 01:28:11.833395+00', '테스트', 'f52d2304-22cb-4ea0-88f8-a196c6ef02ae', '583', '7bfc3401-5379-45ff-b412-df29b8fdd23a', '000000');


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."enrollments" ("created_at", "student_id", "lecture_id", "semester_id") VALUES
	('2025-12-27 13:39:57.528076+00', '0d56623f-f953-40f4-b369-d2138b7b907d', 'dd539db3-5e72-4403-9927-9c0919235cf2', 1),
	('2025-12-27 13:29:17.022949+00', '1b212df6-4669-4d50-b835-50dd47ac94cb', 'e728bdd7-e6c5-4484-8899-a94ccff997a6', 1),
	('2025-12-27 13:28:42.443206+00', '1cde6571-6958-4e1b-9402-402d64a245fa', 'e728bdd7-e6c5-4484-8899-a94ccff997a6', 1),
	('2026-02-04 01:40:49.96338+00', 'a9f1fdac-bddd-4b4c-b0bc-efe969550fe2', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
	('2026-02-04 01:38:10.021829+00', 'ce475247-5e94-45d9-9195-d700677237be', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
	('2026-02-04 01:38:31.170115+00', '9de7d27b-0f5e-4cc4-a4e0-888333db9a70', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
	('2026-02-04 01:39:47.782582+00', 'd54fb51a-a54b-4c3a-b0dd-7a2426e0da08', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
	('2026-02-04 01:38:52.161174+00', 'f865c3d6-550f-4e83-8ae8-dfa7c503c898', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
	('2026-02-04 01:43:35.258798+00', '7cf7acb0-6aa4-4e18-a793-a38112dcde54', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
	('2026-02-04 01:44:18.679588+00', 'ccfb44e8-0e19-4e60-9df0-802dd8e14a66', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
	('2026-02-04 01:45:13.057214+00', '387fe9cf-cce2-4acf-8c8e-127cb42ad2e9', '8399efd3-ce4a-46c0-8c06-c3b3bd6cd978', 2),
	('2026-02-11 01:29:23.162874+00', 'd4889047-93e0-4441-8b15-dd7f370aeeb9', '27d90ac4-63f6-4449-97ce-a586ce301ca2', 3),
	('2026-02-11 14:00:50.487562+00', '0cd16b9e-14d7-4da7-bcab-a699906ccbb0', '27d90ac4-63f6-4449-97ce-a586ce301ca2', 3),
	('2026-02-11 14:06:40.171121+00', '664d6972-cdd6-4205-bfd0-2caca1278897', '27d90ac4-63f6-4449-97ce-a586ce301ca2', 3),
	('2026-02-11 14:11:43.568447+00', '402eb316-0b6b-48bf-ba0e-a937d23a3d0f', '27d90ac4-63f6-4449-97ce-a586ce301ca2', 3),
	('2026-02-11 14:14:04.571652+00', '68bf72f4-27f0-4a4f-a0f9-167e4af752dd', '27d90ac4-63f6-4449-97ce-a586ce301ca2', 3);


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."attendances" ("id", "student_id", "lecture_id", "attendance_date", "status", "created_at", "period") VALUES
	('53381d07-1401-445f-9acd-e0bcd8dfb1ee', '1b212df6-4669-4d50-b835-50dd47ac94cb', 'e728bdd7-e6c5-4484-8899-a94ccff997a6', '2026-01-03', 'present', '2025-12-27 13:39:21+00', 1),
	('4060469d-29bd-4772-afb6-920f692d7960', '1cde6571-6958-4e1b-9402-402d64a245fa', 'e728bdd7-e6c5-4484-8899-a94ccff997a6', '2026-01-04', 'absent', '2025-12-27 13:42:11.370819+00', 7),
	('dd186094-be56-4023-8c17-acc8b2e545f3', '664d6972-cdd6-4205-bfd0-2caca1278897', '27d90ac4-63f6-4449-97ce-a586ce301ca2', '2026-02-12', 'absent', '2026-02-12 04:38:31.648393+00', 3),
	('d9bbd4eb-84a7-4ad5-b554-c1b4bc9ab2ca', '68bf72f4-27f0-4a4f-a0f9-167e4af752dd', '27d90ac4-63f6-4449-97ce-a586ce301ca2', '2026-02-12', 'absent', '2026-02-11 14:14:28.087291+00', 3),
	('b850a3c0-7b36-4a72-89e8-0df4aae9b872', '0cd16b9e-14d7-4da7-bcab-a699906ccbb0', '27d90ac4-63f6-4449-97ce-a586ce301ca2', '2026-02-12', 'absent', '2026-02-11 14:01:33.36267+00', 3),
	('7837177a-560a-4dc0-953d-aa20b773c51a', '402eb316-0b6b-48bf-ba0e-a937d23a3d0f', '27d90ac4-63f6-4449-97ce-a586ce301ca2', '2026-02-12', 'absent', '2026-02-11 14:12:00.868116+00', 3),
	('7cc5789f-8cd9-41c6-a909-e82c3e0fd75c', 'd4889047-93e0-4441-8b15-dd7f370aeeb9', '27d90ac4-63f6-4449-97ce-a586ce301ca2', '2026-02-12', 'present', '2026-02-12 04:38:31.854518+00', 3);


--
-- Data for Name: temporal_lectures; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 39, true);


--
-- Name: semester_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."semester_schedules_id_seq"', 3, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict NYUBtqIFlO3hcH3QzOkUyvHauCrqaV2hIxGqM7nmMsROp0Y3HkANcgs8nEuhegl

RESET ALL;
