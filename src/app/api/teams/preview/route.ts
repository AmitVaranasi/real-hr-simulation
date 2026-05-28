import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: team, error } = await supabase
    .from("teams")
    .select("name, industry, strategy, sessions(name)")
    .eq("join_code", code.trim())
    .maybeSingle();

  if (error || !team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  return NextResponse.json({ team });
}
