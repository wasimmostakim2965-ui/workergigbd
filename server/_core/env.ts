export const ENV = {
  appId: process.env.VITE_APP_ID ?? "workergigbd",
  cookieSecret: process.env.JWT_SECRET ?? "workergigbd-jwt-secret-2024-secure-key-32chars",
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:Wasim@#$_&-+()/@db.tsokfguhydwausvuaaiw.supabase.co:5432/postgres",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
