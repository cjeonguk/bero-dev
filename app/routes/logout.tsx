import { createClient } from "~/lib/supabase/server";
import { type ActionFunctionArgs, redirect } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = createClient(request);

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  return redirect("/", { headers });
}
