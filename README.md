# Bero Dev

Bero Dev is a school attendance management system built for real-time classroom attendance tracking.

Teachers can view attendance for the current class, and the platform is designed to let students check their own attendance records as well. The project uses React Router for the web app and Supabase for authentication and database management.

## Features

- Teacher attendance dashboard
- Attendance tracking by lecture, date, and period
- Device-based attendance update API
- Supabase email/password authentication
- Timetable-based current class lookup
- Structured school data model for students, teachers, classrooms, and enrollments

## Tech Stack

- React 19
- React Router 7
- TypeScript
- Vite
- Tailwind CSS 4
- Supabase
- Luxon
- shadcn/ui

## Getting Started

### Install dependencies

```bash
npm install
```

### Environment variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
DEVICE_API_TOKEN=your_device_api_bearer_token
```

`SUPABASE_SERVICE_ROLE_KEY` and `DEVICE_API_TOKEN` are server-only values. Do not expose them in browser code.

### Run locally

```bash
npm run dev
```

App URL:

```text
http://localhost:5173
```

## Future Improvements

- Student attendance history and report pages
- Admin management workflows
- Live realtime dashboard updates
- Better access control and production-ready security policies
- Automated tests and seed data
