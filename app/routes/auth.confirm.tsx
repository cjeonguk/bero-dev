import { createClient } from "~/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type LoaderFunctionArgs, redirect } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const _next = requestUrl.searchParams.get("next");
  const next = normalizeNext(_next, requestUrl);

  if (token_hash && type) {
    const { supabase, headers } = createClient(request);
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return redirect(next, { headers });
    } else {
      return redirect(`/auth/error?error=${error?.message}`);
    }
  }

  // redirect the user to an error page with some instructions
  return redirect(`/auth/error?error=No token hash or type`);
}

function normalizeNext(next: string | null, requestUrl: URL) {
  if (!next) {
    return "/";
  }

  if (next.startsWith("/")) {
    return next;
  }

  try {
    const nextUrl = new URL(next);

    if (nextUrl.origin !== requestUrl.origin) {
      return "/";
    }

    return `${nextUrl.pathname}${nextUrl.search}`;
  } catch {
    return "/";
  }
}
