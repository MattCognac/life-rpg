import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
  ANTHROPIC_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
});

if (!parsed.success) {
  console.error(
    "\n❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
    "\n",
  );
  throw new Error("Invalid environment variables — check your .env file");
}

export const env = parsed.data;

export const hasAnthropicKey = (): boolean =>
  !!env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.length > 0;
