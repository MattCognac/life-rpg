import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Get the authenticated user's ID. Call this at the top of every server action
 * and server component that needs user-scoped data.
 *
 * Redirects to /login if there's no active session.
 */
export async function getAuthUser(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user.id;
}
