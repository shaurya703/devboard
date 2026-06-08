/**
 * Validated, typed environment configuration.
 * Fails fast at startup if anything required is missing or malformed.
 */
import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load .env from the server package root (and fall back to repo root).
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const booleanish = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SERVER_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),

  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  COOKIE_SECURE: booleanish,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

/** Comma-separated CORS origins → array. */
export const allowedOrigins = env.CLIENT_ORIGIN.split(",").map((o) => o.trim());

export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
