import type { Route } from "./+types/api";

export async function action({ request }: Route.ActionArgs) {
  const body = request.body;

  return body;
}
