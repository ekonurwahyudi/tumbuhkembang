import { createRequire } from "node:module";
import { defineConfig } from "drizzle-kit";

// dotenv cuma devDependency (buat baca .env.local pas dev lokal). Di container
// production, env sudah disuntik langsung oleh host — modulnya sengaja tidak ada.
try {
  createRequire(import.meta.url)("dotenv").config({ path: ".env.local" });
} catch {
  // no-op di production
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
});
