import { type RouteConfig, layout } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default [
  layout("layouts/main.tsx", await flatRoutes()),
] satisfies RouteConfig;
