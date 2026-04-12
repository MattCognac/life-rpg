import { revalidatePath } from "next/cache";

const APP_PATHS = [
  "/",
  "/quests",
  "/chains",
  "/daily",
  "/character",
  "/skills",
  "/achievements",
] as const;

/**
 * Revalidate all major app routes. Optionally include extra paths
 * (e.g. specific chain/quest detail pages).
 */
export function revalidateApp(...extra: string[]) {
  for (const p of APP_PATHS) {
    revalidatePath(p);
  }
  for (const p of extra) {
    revalidatePath(p);
  }
}
