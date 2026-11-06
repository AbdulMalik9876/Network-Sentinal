import { defineConfig } from "drizzle-kit";
import path from "path";

// Local dev: read the repo-root .env (on Render the env vars are set directly)
try { process.loadEnvFile(path.join(__dirname, "../../.env")); } catch {}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
