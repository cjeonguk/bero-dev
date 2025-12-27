import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  layout("layouts/main.tsx", [
    index("routes/home.tsx"),
    route("api", "routes/api.tsx"),

    route("login", "routes/login.tsx"),
    route("logout", "routes/logout.tsx"),
    route("sign-up", "routes/sign-up.tsx"),
    route("forgot-password", "routes/forgot-password.tsx"),
    route("update-password", "routes/update-password.tsx"),
    ...prefix("auth", [
      route("confirm", "routes/auth/confirm.tsx"),
      route("error", "routes/auth/error.tsx"),
    ]),

    ...prefix("admin", [
      route("dashboard", "routes/admin/dashboard.tsx"),
      route("register", "routes/admin/register.tsx"),
    ]),

    ...prefix("teacher", [
      route("dashboard", "routes/teacher/dashboard.tsx"),
      route("register-class", "routes/teacher/register-class.tsx"),
      ...prefix("school-admin", [
        route("dashboard", "routes/teacher/school-admin/dashboard.tsx"),
        route("register", "routes/teacher/school-admin/register/index.tsx", [
          route(
            "teacher",
            "routes/teacher/school-admin/register/register-teacher.tsx",
          ),
          route(
            "student",
            "routes/teacher/school-admin/register/register-student.tsx",
          ),
          route(
            "room",
            "routes/teacher/school-admin/register/register-room.tsx",
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
