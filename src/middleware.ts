import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/auth",
  "/simulate",
  "/about",
  "/api/auth",
];

function isPublic(path: string): boolean {
  if (path === "/") return true;
  return PUBLIC_PREFIXES.some(
    (p) => p !== "/" && (path === p || path.startsWith(`${p}/`))
  );
}

function isAdminSystemToolPath(path: string): boolean {
  return (
    path.startsWith("/sessions/config") || path.startsWith("/sessions/testing")
  );
}

function homeForRole(role: string | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/sessions";
  return "/dashboard";
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPublic(path) || path.startsWith("/api/teams/preview")) {
    return response;
  }

  if (path.startsWith("/api/")) {
    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (path.startsWith("/join/")) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const emailAllowlisted = !!(
    user.email && allowlist.includes(user.email.toLowerCase())
  );
  // Treat allowlisted emails as admin for routing even before DB promote runs.
  const effectiveRole =
    role === "admin" || emailAllowlisted ? "admin" : role;

  if (path.startsWith("/admin")) {
    if (effectiveRole !== "admin") {
      return NextResponse.redirect(
        new URL(homeForRole(role), request.url)
      );
    }
    return response;
  }

  if (path.startsWith("/sessions") || path.startsWith("/instructor")) {
    if (effectiveRole === "instructor") {
      return response;
    }
    if (effectiveRole === "admin" && isAdminSystemToolPath(path)) {
      return response;
    }
    return NextResponse.redirect(
      new URL(homeForRole(effectiveRole), request.url)
    );
  }

  // Admins landing on student routes → admin home
  if (
    effectiveRole === "admin" &&
    (path.startsWith("/dashboard") ||
      path.startsWith("/round") ||
      path.startsWith("/history") ||
      path.startsWith("/leaderboard") ||
      path.startsWith("/join"))
  ) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico)$).*)",
  ],
};
