// Load environment variables from .env file
import "dotenv/config";

export const ENV = {
  // ─── Supabase PostgreSQL Database ───
  databaseUrl: process.env.DATABASE_URL ?? "",
  directUrl: process.env.DIRECT_URL ?? "",
  
  // ─── Supabase Auth ───
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? "",
  supabaseJwksUrl: process.env.SUPABASE_JWKS_URL ?? "",
  
  // ─── FORGE API (Manus runtime service) ───
  forgeApiUrl: process.env.FORGE_API_URL ?? "",
  forgeApiKey: process.env.FORGE_API_KEY ?? "",
  
  // ─── Server Settings ───
  port: parseInt(process.env.PORT ?? "3000"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  useLocalDb: process.env.USE_LOCAL_DB === "true",
};
