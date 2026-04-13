import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createAdminClient() {
  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY — required for admin operations like account deletion",
    );
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
