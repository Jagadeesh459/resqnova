import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/resource-planner",
  "/evacuation-planner",
  "/citizen",
  "/rescue",
  "/ambulance",
  "/shelter",
  "/settings",
];

export async function middleware(request: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase.from("users").select("role").eq("auth_id", user.id).maybeSingle();
  const role = profile?.role as string | undefined;
  const pathname = request.nextUrl.pathname;
  const allowed = pathname.startsWith("/citizen") ? role === "citizen" : pathname.startsWith("/rescue") ? role === "rescue" : pathname.startsWith("/ambulance") ? role === "ambulance" : pathname.startsWith("/shelter") ? role === "shelter" : pathname.startsWith("/dashboard") || pathname.startsWith("/resource-planner") || pathname.startsWith("/evacuation-planner") || pathname.startsWith("/settings") ? role === "admin" : true;
  if (role && !allowed) {
    const destination = role === "citizen" ? "/citizen" : role === "rescue" ? "/rescue" : role === "ambulance" ? "/ambulance" : role === "shelter" ? "/shelter" : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/resource-planner/:path*", "/evacuation-planner/:path*", "/citizen/:path*", "/rescue/:path*", "/ambulance/:path*", "/shelter/:path*", "/settings/:path*"],
};
