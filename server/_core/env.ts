import "dotenv/config";

const env = process.env;

export const ENV = {
  databaseUrl: env.DATABASE_URL || "",
  directUrl: env.DIRECT_URL || "",
  supabaseUrl: env.SUPABASE_URL || "",
  supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY || "",
  supabaseSecretKey: env.SUPABASE_SECRET_KEY || "",
  supabaseJwksUrl: env.SUPABASE_JWKS_URL || "",
  port: parseInt(env.PORT || "3000"),
  nodeEnv: env.NODE_ENV || "development",
  useLocalDb: env.USE_LOCAL_DB === "true",
  forgeApiUrl: env.FORGE_API_URL || "",
  forgeApiKey: env.FORGE_API_KEY || "",
  appId: env.APP_ID || "workergigbd-app",
  cookieSecret: env.COOKIE_SECRET || "default-secret",
  ownerOpenId: env.OWNER_OPEN_ID || "",
};
