import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLocale } from "@/lib/i18n/config";

/**
 * Persists the signed-in user's locale preference to profiles.locale so
 * it follows them to another device/browser. The hrsim_locale cookie
 * (set client-side by LocaleSwitcher) is what actually takes effect
 * immediately and for signed-out visitors — this is the durable,
 * cross-device half of "explicit user preference" in the resolution
 * order. A logged-out caller or a write failure is a no-op, not an
 * error the UI needs to surface: the cookie already did its job.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const locale = body?.locale;
  if (!isLocale(locale)) {
    return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ locale })
    .eq("id", user.id);

  return NextResponse.json({ ok: true, persisted: !error });
}
