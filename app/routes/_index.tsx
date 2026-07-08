import { data, redirect, type LoaderFunctionArgs } from "react-router";
import { createClient } from "~/lib/supabase/server";
import { Welcome } from "../welcome/welcome";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return data(null, { headers });
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (teacher) {
    return redirect("/teacher/dashboard", { headers });
  }

  return data(null, { headers });
}

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
