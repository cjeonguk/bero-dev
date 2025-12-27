import { PostgrestError } from "@supabase/supabase-js";
import type { Route } from "./+types/api";
import { createClient } from "~/lib/supabase/server";

interface Body {
  deviceID: string;
  rssi: number;
  deviceName: string;
  timestamp: string;
  classroom: string;
}

export async function action({ request }: Route.ActionArgs) {
  const body = (await request.json()) as Body;

  const { supabase } = createClient(request);
  try {
    const { data: studentName, error: studentError } = await supabase
      .from("students")
      .select("name")
      .eq("device_name", body.deviceName)
      .single();

    if (studentError) throw studentError;

    if (!studentName || !studentName.name)
      return { success: false, studentName: "" };

    const { error: updateError } = await supabase
      .from("students")
      .update({ last_detected_place: body.classroom })
      .match({ name: studentName.name });

    if (updateError) throw updateError;
    return { success: true, studentName: studentName.name };
  } catch (error) {
    if (error instanceof PostgrestError)
      console.error("API ERROR:", error.message);
  }
}
