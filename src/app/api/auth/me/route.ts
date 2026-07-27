import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api/auth";

/** Returns current profile after ADMIN_EMAILS bootstrap promotion. */
export async function GET() {
  const { user, profile } = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: profile?.role ?? null,
    display_name: profile?.display_name ?? null,
  });
}
