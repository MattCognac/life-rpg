import { cookies } from "next/headers";

/**
 * Read the user's IANA timezone from the cookie set by TimezoneProvider.
 * Must be called inside a server component or server action (uses next/headers).
 */
export async function getUserTimezone(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("timezone")?.value ?? "America/Los_Angeles";
}
