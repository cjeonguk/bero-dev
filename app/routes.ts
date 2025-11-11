import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("layouts/main.tsx", [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("admin", "routes/admin/dashboard.tsx", [
      route("dashboard", "routes/admin/dashboard.tsx"),
      route("register", "routes/admin/register.tsx"),
    ]),
    route("teacher", "routes/teacher/dashboard.tsx", [
      route("dashboard", "routes/teacher/dashboard.tsx"),
      route("register-class", "routes/teacher/register-class.tsx"),
      route("school-admin", "routes/teacher/school-admin/dashboard.tsx", [
        route("dashboard", "routes/teacher/school-admin/dashboard.tsx"),
        route("register", "routes/teacher/school-admin/register/index.tsx", [
          route(
            "teacher",
            "routes/teacher/school-admin/register/register-teacher.tsx"
          ),
          route(
            "student",
            "routes/teacher/school-admin/register/register-student.tsx"
          ),
          route(
            "room",
            "routes/teacher/school-admin/register/register-room.tsx"
          ),
        ]),
      ]),
    ]),
    route("student", "routes/student/index.tsx", [
      route("report", "routes/student/report.tsx", [
        route(":hash", "routes/student/confirm-report.tsx"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
