import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:Wasim@#$_&-+()/@db.tsokfguhydwausvuaaiw.supabase.co:5432/postgres";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
