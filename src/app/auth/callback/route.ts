import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function sanitizeRedirectPath(raw: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const next = sanitizeRedirectPath(rawNext ?? "/");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = rawNext ? next : "/auth/verified";
      return NextResponse.redirect(`${origin}${destination}`);
    }
    console.error("Auth code exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
