import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated users can only access public routes
  if (!user && !PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated users shouldn't see login/signup
  if (user && PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
