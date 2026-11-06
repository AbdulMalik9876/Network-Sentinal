import { defineConfig } from "drizzle-kit";
import path from "path";

// Local dev: read the repo-root .env (on Render the env vars are set directly)
try { process.loadEnvFile(path.join(__dirname, "../../.env")); } catch {}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts", // relative: path.join breaks drizzle-kit on Windows
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need a direct (non-pooled) connection on Neon
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
