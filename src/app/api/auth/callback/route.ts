import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Password recovery always lands on the reset form.
      if (next.startsWith("/auth/reset-password")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id ?? "")
        .single();

      let redirect = next;
      if (profile?.role === "admin") {
        redirect =
          next.startsWith("/admin") ||
          next.startsWith("/sessions/config") ||
          next.startsWith("/sessions/testing") ||
          next.startsWith("/auth/reset-password")
            ? next
            : "/admin";
      } else if (profile?.role === "instructor" && next === "/dashboard") {
        redirect = "/sessions";
      }
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
